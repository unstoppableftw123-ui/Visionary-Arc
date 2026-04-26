import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { motion, AnimatePresence } from "framer-motion";
import apiService from "../services/apiService";
import {
  normalizeNote,
  resolveNoteLinks,
  buildGraphFromNotes,
} from "../utils/notesGraphData";

const GRAPH_BG = "#0f0f1a";
const NODE_RADIUS = { file: 12, heading: 7, body: 4 };
const DEFAULT_NODE_COLOR = "#94A3B8";

/** Obsidian-style tag → color map (primary tag determines node color). */
const TAG_COLORS = {
  math: "#7C6FF7",
  SAT: "#F472B6",
  physics: "#38BDF8",
  english: "#34D399",
  history: "#FB923C",
  science: "#A78BFA",
};

function getNodeColor(node) {
  const tags = node.tags || [];
  for (const t of tags) {
    const c = TAG_COLORS[t];
    if (c) return c;
  }
  if (node.type === "heading") return TAG_COLORS.math || "#B8A9F5";
  if (node.type === "body") return "#c4c4c4";
  return DEFAULT_NODE_COLOR;
}

export default function NotesGraph() {
  const navigate = useNavigate();
  const fgRef = useRef(null);
  const containerRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(2);
  const [expandedFiles, setExpandedFiles] = useState(() => new Set());
  const [expandedHeadings, setExpandedHeadings] = useState(() => new Set());
  const [showOrphans, setShowOrphans] = useState(true);
  const [showBodyNodes, setShowBodyNodes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [graphDimensions, setGraphDimensions] = useState({ w: 800, h: 600 });
  const frameRef = useRef(0);

  // Tick frameRef without triggering React re-renders — canvas reads it directly
  useEffect(() => {
    let raf;
    const tick = () => {
      frameRef.current += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fetch and normalize notes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService.notesStudio
      .getStudioNotes()
      .then((raw) => {
        if (cancelled) return;
        const normalized = (raw || []).map((n) =>
          normalizeNote({
            note_id: n.note_id,
            id: n.note_id,
            title: n.title,
            content: typeof n.content === "string" ? n.content : "",
            updated_at: n.updated_at,
            tags: n.tags || [],
          })
        );
        setNotes(resolveNoteLinks(normalized));
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect || {};
      if (width && height) setGraphDimensions({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let list = notes;
    if (selectedTag) {
      list = list.filter((n) => (n.tags || []).includes(selectedTag));
    }
    return list;
  }, [notes, selectedTag]);

  const expansion = useMemo(
    () => ({
      expandedFiles,
      expandedHeadings,
    }),
    [expandedFiles, expandedHeadings]
  );

  const { nodes, links } = useMemo(
    () =>
      buildGraphFromNotes(filteredNotes, expansion, {
        maxDepth: depth,
        showOrphans,
        showBodyNodes,
      }),
    [filteredNotes, expansion, depth, showOrphans, showBodyNodes]
  );

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({
        ...l,
        source: typeof l.source === "object" ? l.source.id : l.source,
        target: typeof l.target === "object" ? l.target.id : l.target,
      })),
    }),
    [nodes, links]
  );

  const nodeById = useMemo(() => {
    const map = new Map();
    graphData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graphData.nodes]);

  const getConnectedIds = useCallback(
    (nodeId) => {
      const connected = new Set([nodeId]);
      graphData.links.forEach((l) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        if (s === nodeId || t === nodeId) {
          connected.add(s);
          connected.add(t);
        }
      });
      return connected;
    },
    [graphData.links]
  );

  const focusedSet = useMemo(() => {
    if (!focusedNodeId) return null;
    return getConnectedIds(focusedNodeId);
  }, [focusedNodeId, getConnectedIds]);

  const searchLower = searchQuery.trim().toLowerCase();
  const matchesSearch = useCallback(
    (node) => {
      if (!searchLower) return true;
      const title = (node.title || "").toLowerCase();
      const text = (node.text || "").toLowerCase();
      const content = (node.content || "").toLowerCase();
      return (
        title.includes(searchLower) ||
        text.includes(searchLower) ||
        content.includes(searchLower)
      );
    },
    [searchLower]
  );

  const handleNodeClick = useCallback(
    (node) => {
      setFocusedNodeId((prev) => (prev === node.id ? null : node.id));
      if (node.type === "file") {
        setSelectedNote(node);
      } else {
        setSelectedNote(null);
      }
    },
    []
  );

  const handleNodeDoubleClick = useCallback((node) => {
    if (node.type === "file") {
      setExpandedFiles((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    } else if (node.type === "heading") {
      setExpandedHeadings((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    }
  }, []);

  const collapseNode = useCallback((node) => {
    if (node.type === "file") {
      setExpandedFiles((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    } else if (node.type === "heading") {
      setExpandedHeadings((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    }
  }, []);

  const handleNodeRightClick = useCallback((node, event) => {
    event.preventDefault();
    collapseNode(node);
  }, [collapseNode]);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null);
  }, []);

  const handleContainerMouseMove = useCallback((e) => {
    if (containerRef.current && containerRef.current.contains(e.target)) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  // Configure d3 forces after graph is ready (reconfigure existing forces)
  useEffect(() => {
    const graph = fgRef.current;
    if (!graph || !graphData.nodes.length) return;
    const linkForce = graph.d3Force("link");
    if (linkForce && typeof linkForce.distance === "function") {
      linkForce.distance((link) => {
        const type = (link && link.type) || "";
        if (type === "file-file") return 200;
        if (type === "file-heading") return 80;
        if (type === "heading-body" || type === "file-body") return 40;
        return 120;
      });
    }
    const chargeForce = graph.d3Force("charge");
    if (chargeForce && typeof chargeForce.strength === "function") {
      chargeForce.strength((node) => {
        if (node && node.type === "file") return -200;
        if (node && node.type === "heading") return -80;
        return -20;
      });
    }
    graph.d3ReheatSimulation();
    // Fit all nodes into view after the new layout settles
    setTimeout(() => graph.zoomToFit(600, 40), 800);
  }, [graphData.nodes.length, graphData.links]);

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const radius =
        (node.type === "file"
          ? NODE_RADIUS.file
          : node.type === "heading"
          ? NODE_RADIUS.heading
          : NODE_RADIUS.body) / globalScale;
      const isDim =
        (focusedSet && !focusedSet.has(node.id)) ||
        (searchLower && !matchesSearch(node));
      const opacity = isDim ? 0.25 : 1;
      const color = getNodeColor(node);
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const blur = (isHovered ? 2 : 1) * (12 / globalScale);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      if (node.type === "file" && globalScale >= 0.6) {
        const label = (node.title || "Untitled").slice(0, 24);
        ctx.save();
        ctx.globalAlpha = isDim ? 0.25 : 0.9;
        ctx.font = `${10 / globalScale}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(label, node.x, node.y + radius + 12 / globalScale);
        ctx.restore();
      }
    },
    [focusedSet, searchLower, matchesSearch, hoveredNode]
  );

  const linkCanvasObject = useCallback(
    (link, ctx, globalScale) => {
      const s = typeof link.source === "object" ? link.source : nodeById.get(link.source);
      const t = typeof link.target === "object" ? link.target : nodeById.get(link.target);
      if (!s || !t) return;
      const isFileFile = (link.type || "") === "file-file";
      const isDim =
        focusedSet &&
        !(focusedSet.has(s.id) && focusedSet.has(t.id));
      const dashLen = 8;
      ctx.setLineDash([dashLen, dashLen]);
      ctx.lineDashOffset = -(frameRef.current % (dashLen * 2));
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      const edgeColor = isFileFile
        ? "rgba(56, 189, 248, 0.7)"
        : "rgba(124, 111, 247, 0.6)";
      ctx.strokeStyle = edgeColor;
      ctx.globalAlpha = isDim ? 0.2 : 0.8;
      ctx.lineWidth = 1.5 / globalScale;
      ctx.shadowColor = isFileFile ? "rgba(56, 189, 248, 0.6)" : "rgba(124, 111, 247, 0.5)";
      ctx.shadowBlur = 4 / globalScale;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    },
    [nodeById, focusedSet]
  );

  const renderTooltip = () => {
    if (!hoveredNode) return null;
    const node = hoveredNode;
    let content = null;
    if (node.type === "file") {
      content = (
        <>
          <div className="font-medium text-foreground">{node.title}</div>
          {(node.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(node.tags || []).map((t) => (
                <span
                  key={t}
                  className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {node.lastEdited && (
            <div className="text-sm md:text-xs text-muted-foreground mt-1">
              Edited {node.lastEdited}
            </div>
          )}
        </>
      );
    } else if (node.type === "heading") {
      content = (
        <>
          <div className="font-medium text-foreground">{node.text}</div>
          {node.title && (
            <div className="text-sm md:text-xs text-muted-foreground mt-1">
              in {node.title}
            </div>
          )}
        </>
      );
    } else {
      const snippet = (node.snippet || node.text || "").slice(0, 200);
      content = (
        <div className="text-sm text-muted-foreground max-w-xs whitespace-pre-wrap break-words">
          {snippet}
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute z-10 pointer-events-none rounded-lg border border-border bg-card p-3 shadow-lg max-w-sm"
        style={{
          left: tooltipPos.x + 12,
          top: tooltipPos.y + 12,
        }}
      >
        {content}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center flex-1 min-h-[60vh] rounded-xl"
        style={{ background: GRAPH_BG }}
      >
        <p className="text-muted-foreground">Loading notes…</p>
      </div>
    );
  }

  if (!notes.length) {
    return (
      <div
        className="flex items-center justify-center flex-1 min-h-[60vh] rounded-xl"
        style={{ background: GRAPH_BG }}
      >
        <p className="text-muted-foreground">
          No notes yet. Add notes in Notes Studio to see them in the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] -m-4 md:-m-8">
      <div
        ref={containerRef}
        className="relative flex-1 w-full rounded-xl overflow-hidden"
        style={{ background: GRAPH_BG, minHeight: 400 }}
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={graphDimensions.w}
          height={graphDimensions.h}
          backgroundColor={GRAPH_BG}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          nodeCanvasObjectMode={() => "replace"}
          linkCanvasObjectMode={() => "replace"}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeRightClick={handleNodeRightClick}
          onNodeHover={handleNodeHover}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          autoPauseRedraw={false}
          minZoom={0.05}
          maxZoom={8}
          onEngineStop={() => fgRef.current?.zoomToFit(600, 40)}
        />
        <AnimatePresence>{hoveredNode && renderTooltip()}</AnimatePresence>

        <AnimatePresence>
          {selectedNote && selectedNote.type === "file" && (
            <motion.div
              key="note-panel"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute top-0 right-0 bottom-0 w-80 z-20 flex flex-col rounded-l-lg border border-border border-r-0 bg-card/98 backdrop-blur shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-semibold text-foreground truncate pr-2">
                  {selectedNote.title || "Untitled"}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {(selectedNote.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border">
                  {(selectedNote.tags || []).map((t) => (
                    <span
                      key={t}
                      className="text-sm md:text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${TAG_COLORS[t] || DEFAULT_NODE_COLOR}22`,
                        color: TAG_COLORS[t] || DEFAULT_NODE_COLOR,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {(selectedNote.content || "").slice(0, 800)}
                {(selectedNote.content || "").length > 800 ? "…" : ""}
              </div>
              <div className="p-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/notes-studio");
                    setSelectedNote(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
                >
                  Open in Studio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls panel */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 w-56 rounded-lg border border-border bg-card/95 backdrop-blur p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Graph</span>
            <button
              type="button"
              onClick={() => fgRef.current?.zoomToFit(400, 40)}
              className="text-sm md:text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Fit all nodes in view"
            >
              Fit
            </button>
          </div>
          <label className="text-sm md:text-xs text-muted-foreground">
            Depth
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value={1}>1 – Files only</option>
              <option value={2}>2 – Files + headings</option>
              <option value={3}>3 – Full</option>
            </select>
          </label>
          <label className="text-sm md:text-xs text-muted-foreground">
            Tag
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground"
          />
          <label className="flex items-center gap-2 text-sm md:text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showOrphans}
              onChange={(e) => setShowOrphans(e.target.checked)}
            />
            Show orphans
          </label>
          <label className="flex items-center gap-2 text-sm md:text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showBodyNodes}
              onChange={(e) => setShowBodyNodes(e.target.checked)}
            />
            Show body nodes
          </label>
        </div>

        {/* Tag color legend */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[240px] rounded-lg border border-border bg-card/95 backdrop-blur p-2.5 shadow-lg">
          <div className="text-sm md:text-xs font-medium text-muted-foreground w-full mb-1">
            Tags
          </div>
          {allTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1.5 text-sm md:text-xs text-foreground"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: TAG_COLORS[tag] || DEFAULT_NODE_COLOR,
                  boxShadow: `0 0 6px ${TAG_COLORS[tag] || DEFAULT_NODE_COLOR}`,
                }}
              />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
