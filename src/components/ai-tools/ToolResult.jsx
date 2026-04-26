import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, FileText, FileDown } from "lucide-react";
import { Button } from "../ui/button";
import { exportToDocx, exportToPDF } from "../../services/exportService";

// ─── Shimmer skeleton ────────────────────────────────────────────────────────

export function ResultSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer-line {
          background: linear-gradient(
            90deg,
            hsl(var(--secondary)) 25%,
            hsl(var(--accent)) 50%,
            hsl(var(--secondary)) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>
      <div className="shimmer-line h-4 w-3/4" />
      <div className="shimmer-line h-4 w-full" />
      <div className="shimmer-line h-4 w-5/6" />
      <div className="shimmer-line h-4 w-full" />
      <div className="shimmer-line h-4 w-2/3" />
      <div className="shimmer-line h-4 w-full" />
      <div className="shimmer-line h-4 w-4/5" />
      <div className="shimmer-line h-4 w-full" />
      <div className="shimmer-line h-4 w-3/5" />
      <p className="text-sm md:text-xs text-muted-foreground text-center pt-2 animate-pulse">
        Generating with Claude...
      </p>
    </div>
  );
}

// ─── Markdown-ish renderer (minimal, no lib needed) ──────────────────────────

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-heading font-bold text-base mt-5 mb-2 text-foreground">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-heading font-semibold text-sm mt-4 mb-1.5 text-foreground">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="font-medium text-sm mt-3 mb-1 text-foreground">
          {line.slice(5)}
        </h4>
      );
    } else if (line.startsWith("| ")) {
      // Table — collect all table rows
      const tableRows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableRows.push(lines[i]);
        i++;
      }
      const headers = tableRows[0].split("|").filter(Boolean).map((c) => c.trim());
      const dataRows = tableRows.slice(2).map((r) =>
        r.split("|").filter(Boolean).map((c) => c.trim())
      );
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-border">
          <table className="w-full text-sm md:text-xs">
            <thead className="bg-secondary">
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="border-t border-border">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted-foreground align-top">
                      {inlineFormat(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2 ml-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
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
        <ol key={`ol-${i}`} className="space-y-1 my-2 ml-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary font-semibold shrink-0 w-5">{idx + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-primary pl-3 my-2 italic text-sm text-muted-foreground"
        >
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-3 border-border" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Bold **text** and *italic*
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith("*")) {
      parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>);
    } else if (raw.startsWith("`")) {
      parts.push(
        <code key={match.index} className="rounded bg-secondary px-1 py-0.5 text-sm md:text-xs font-mono">
          {raw.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

// ─── Result Display ──────────────────────────────────────────────────────────

export function ToolResult({ result, onReset, contextualAction }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Result box */}
      <div className="rounded-xl border border-border bg-secondary/50 p-4 max-h-[50vh] overflow-y-auto">
        <div className="space-y-0.5">{renderMarkdown(result)}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => exportToDocx("Result", result)}
        >
          <FileText className="h-3.5 w-3.5" />
          DOCX
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => exportToPDF("Result", result)}
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Generation
        </Button>

        {contextualAction && (
          <Button
            size="sm"
            className="gap-1.5 ml-auto"
            onClick={contextualAction.onClick}
          >
            {contextualAction.icon && <contextualAction.icon className="h-3.5 w-3.5" />}
            {contextualAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
