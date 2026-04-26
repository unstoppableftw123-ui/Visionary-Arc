/**
 * Notes graph data utilities: parse markdown (headings, body blocks, wikilinks)
 * and build nodes/links for the force-directed graph.
 * No React; pure functions.
 */

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const HEADING_RE = /^(#{1,3})\s+(.+)$/gm;

/**
 * Extract wikilink targets from content. Returns array of raw link text (e.g. note titles).
 * @param {string} content
 * @returns {string[]}
 */
export function extractWikilinks(content) {
  if (!content || typeof content !== "string") return [];
  const matches = [];
  let m;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    matches.push(m[1].trim());
  }
  return [...new Set(matches)];
}

/**
 * Resolve wikilink text to note id by matching note titles (case-insensitive, trimmed).
 * @param {string} linkText
 * @param {{ id: string, title: string }[]} notes
 * @returns {string | null}
 */
export function resolveWikilinkToId(linkText, notes) {
  const lower = (linkText || "").trim().toLowerCase();
  const note = notes.find((n) => (n.title || "").trim().toLowerCase() === lower);
  return note ? note.id : null;
}

/**
 * Parse markdown content into headings (H1/H2/H3) and body chunks.
 * Returns { headings: { level, text, startIndex }[], bodyChunks: { text, startIndex }[] }
 */
export function parseMarkdownStructure(content) {
  if (!content || typeof content !== "string") {
    return { headings: [], bodyChunks: [] };
  }
  const headings = [];
  let m;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(content)) !== null) {
    headings.push({
      level: m[1].length,
      text: m[2].trim(),
      startIndex: m.index,
    });
  }
  // Body chunks: content after each heading (bodyChunks[i] = content under headings[i])
  const bodyChunks = [];
  const lines = content.split("\n");
  let currentChunkLines = [];
  let currentChunkStart = 0;
  let index = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeadingLine = /^#{1,3}\s+.+/.test(line);
    index += line.length + 1;
    if (isHeadingLine) {
      const text = currentChunkLines.join("\n").trim();
      bodyChunks.push({ text, startIndex: currentChunkStart });
      currentChunkLines = [];
      currentChunkStart = index;
    } else {
      currentChunkLines.push(line);
    }
  }
  const tail = currentChunkLines.join("\n").trim();
  bodyChunks.push({ text: tail, startIndex: currentChunkStart });
  return { headings, bodyChunks };
}

/**
 * Normalize raw note from API to graph spec shape.
 * @param {object} raw - { note_id, title, content?, updated_at?, tags? }
 * @returns {{ id: string, title: string, tags: string[], lastEdited: string, content: string, links: string[] }}
 */
export function normalizeNote(raw) {
  const id = raw.note_id || raw.id || String(raw.id);
  const title = raw.title || "Untitled";
  const content = typeof raw.content === "string" ? raw.content : "";
  const lastEdited = raw.updated_at || raw.lastEdited || "";
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const linkTexts = extractWikilinks(content);
  return {
    id,
    title,
    tags,
    lastEdited,
    content,
    links: linkTexts,
  };
}

/**
 * Resolve links array (wikilink texts) to note ids given the full notes list.
 * Returns new array of notes with links as ids (does not mutate).
 */
export function resolveNoteLinks(notes) {
  return notes.map((note) => {
    if (!Array.isArray(note.links)) return note;
    const ids = note.links
      .map((text) => resolveWikilinkToId(text, notes))
      .filter(Boolean);
    return { ...note, links: ids };
  });
}

/**
 * Build a single heading node id.
 */
export function headingNodeId(fileId, headingIndex) {
  return `heading:${fileId}:${headingIndex}`;
}

/**
 * Build a single body node id.
 */
export function bodyNodeId(fileId, chunkIndex) {
  return `body:${fileId}:${chunkIndex}`;
}

/**
 * Build full graph data (nodes + links) from notes array.
 * Expansion sets control which file/heading children are included.
 * @param {object[]} notes - Normalized notes (id, title, content, links (ids), etc.)
 * @param {object} expansion - { expandedFiles: Set<string>, expandedHeadings: Set<string> }
 * @param {object} options - { maxDepth: 1|2|3, showOrphans: boolean, showBodyNodes: boolean }
 * @returns {{ nodes: object[], links: object[] }}
 */
export function buildGraphFromNotes(notes, expansion = {}, options = {}) {
  const {
    maxDepth = 2,
    showOrphans = true,
    showBodyNodes = true,
  } = options;
  const expandedFiles = expansion.expandedFiles || new Set();
  const expandedHeadings = expansion.expandedHeadings || new Set();

  const nodeMap = new Map();
  const links = [];
  const fileIds = new Set(notes.map((n) => n.id));

  // Add file nodes
  notes.forEach((note) => {
    const isOrphan = !(note.links && note.links.some((id) => fileIds.has(id)));
    if (!showOrphans && isOrphan) return;
    nodeMap.set(note.id, {
      id: note.id,
      type: "file",
      title: note.title,
      tags: note.tags,
      lastEdited: note.lastEdited,
      content: note.content,
    });
  });

  // FILE -> FILE links (wikilinks)
  notes.forEach((note) => {
    if (!nodeMap.has(note.id)) return;
    (note.links || []).forEach((targetId) => {
      if (nodeMap.has(targetId) && targetId !== note.id) {
        links.push({
          source: note.id,
          target: targetId,
          type: "file-file",
        });
      }
    });
  });

  // Headings and body (when expanded)
  notes.forEach((note) => {
    if (!nodeMap.has(note.id)) return;
    const { headings, bodyChunks } = parseMarkdownStructure(note.content);
    const expandFile = maxDepth >= 2 && expandedFiles.has(note.id);

    if (expandFile) {
      headings.forEach((h, i) => {
        const hid = headingNodeId(note.id, i);
        nodeMap.set(hid, {
          id: hid,
          type: "heading",
          fileId: note.id,
          title: note.title,
          text: h.text,
          level: h.level,
        });
        links.push({ source: note.id, target: hid, type: "file-heading" });
      });

      // HEADING -> BODY (when heading is expanded); bodyChunks[i+1] = content under heading i
      if (maxDepth >= 3 && showBodyNodes) {
        headings.forEach((_, i) => {
          const hid = headingNodeId(note.id, i);
          if (!expandedHeadings.has(hid)) return;
          const chunk = bodyChunks[i + 1];
          if (!chunk || !chunk.text) return;
          const bid = bodyNodeId(note.id, i);
          const snippet = chunk.text.length > 200 ? chunk.text.slice(0, 200) + "…" : chunk.text;
          nodeMap.set(bid, {
            id: bid,
            type: "body",
            fileId: note.id,
            headingId: hid,
            text: chunk.text,
            snippet,
          });
          links.push({ source: hid, target: bid, type: "heading-body" });
        });
        // If no headings, attach first body chunk to file
        if (headings.length === 0 && bodyChunks.length > 0) {
          const chunk = bodyChunks[0];
          const bid = bodyNodeId(note.id, 0);
          const snippet = chunk.text.length > 200 ? chunk.text.slice(0, 200) + "…" : chunk.text;
          nodeMap.set(bid, {
            id: bid,
            type: "body",
            fileId: note.id,
            headingId: null,
            text: chunk.text,
            snippet,
          });
          links.push({ source: note.id, target: bid, type: "file-body" });
        }
      }
    }
  });

  const nodes = Array.from(nodeMap.values());
  return { nodes, links };
}
