import { RotateCcw } from "lucide-react";

// ─── Inline markdown renderer (mirrors ToolResult, kept local to avoid coupling)

function inlineFormat(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const raw = match[0];
    if (raw.startsWith("**"))
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{raw.slice(2, -2)}</strong>);
    else if (raw.startsWith("*"))
      parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>);
    else if (raw.startsWith("`"))
      parts.push(<code key={match.index} className="rounded bg-secondary px-1 py-0.5 text-sm md:text-xs font-mono">{raw.slice(1, -1)}</code>);
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-bold text-sm mt-4 mb-1.5 text-foreground">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="font-semibold text-sm md:text-xs mt-3 mb-1 text-foreground">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1.5 ml-3">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm md:text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-0.5 my-1.5 ml-3">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm md:text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary font-semibold shrink-0 w-4">{idx + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary pl-2.5 my-1.5 italic text-sm md:text-xs text-muted-foreground">
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-2 border-border" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-sm md:text-xs text-muted-foreground leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }
    i++;
  }
  return elements;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversationThread({ history, chatEndRef, onClear }) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border">
        <span className="text-sm md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Conversation
        </span>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-sm md:text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Clear conversation
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-[45vh] overflow-y-auto p-3 space-y-3">
        {history.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[82%] rounded-xl rounded-tr-sm bg-primary/10 px-3 py-2 text-sm md:text-xs text-foreground/80 leading-relaxed">
                {msg.content.length > 140
                  ? msg.content.slice(0, 140) + "…"
                  : msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="rounded-xl border border-border/50 bg-secondary/40 px-3 py-2.5">
              <div className="text-sm md:text-[10px] font-bold text-primary/60 uppercase tracking-wide mb-1.5">
                AI Tutor
              </div>
              <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
            </div>
          )
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
