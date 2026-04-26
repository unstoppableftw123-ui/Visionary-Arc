import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, RefreshCw, Download, Save, FileText, FileDown } from "lucide-react";
import { exportToDocx, exportToPDF } from "../../services/exportService";

export default function SummaryView({ content, streaming, onCopy, onRegenerate, onDownload, onSave }) {
  const title = "Summary";
  return (
    <div className="rounded-2xl border border-hub-border bg-hub-surface shadow-[0_0_0_1px_var(--hub-border),0_8px_40px_rgba(0,0,0,0.08)]">
      <OutputToolbar
        onCopy={onCopy}
        onRegenerate={onRegenerate}
        onDownload={() => onDownload?.(content)}
        onSave={onSave}
        onExportDocx={() => exportToDocx(title, content || "")}
        onExportPDF={() => exportToPDF(title, content || "")}
      />
      <div className="max-h-[60vh] overflow-y-auto p-6">
        <div className="font-hub-sans text-[15px] leading-relaxed text-hub-text [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-base [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-inside [&_ul]:list-disc [&_ol]:mb-2 [&_ol]:list-inside [&_ol]:list-decimal [&_li]:mb-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-hub-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-hub-mono [&_code]:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
        </div>
        {streaming && (
          <span className="inline-block h-4 w-2 animate-pulse bg-hub-accent align-middle" />
        )}
      </div>
    </div>
  );
}

export function OutputToolbar({ onCopy, onRegenerate, onDownload, onSave, onExportDocx, onExportPDF }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hub-border px-4 py-2">
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Regenerate
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </button>
      {onExportDocx && (
        <button
          type="button"
          onClick={onExportDocx}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
        >
          <FileText className="h-3.5 w-3.5" />
          DOCX
        </button>
      )}
      {onExportPDF && (
        <button
          type="button"
          onClick={onExportPDF}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </button>
      )}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
        >
          <Save className="h-3.5 w-3.5" />
          Save to Library
        </button>
      )}
    </div>
  );
}
