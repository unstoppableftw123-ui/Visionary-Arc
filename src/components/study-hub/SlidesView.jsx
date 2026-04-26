import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Copy, RefreshCw, Download } from "lucide-react";
import { OutputToolbar } from "./SummaryView";
import { exportToPPTX } from "../../services/exportService";

export default function SlidesView({
  slides,
  onCopy,
  onRegenerate,
  onDownload,
  onSave,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!slides?.length) return null;

  const slide = slides[currentIndex];
  const content = typeof slide === "string" ? slide : (slide.content ?? slide.text ?? "");

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
  const reset = () => setCurrentIndex(0);

  const downloadContent = () =>
    slides
      .map((s, i) => {
        const title = typeof s === "string" ? `Slide ${i + 1}` : (s.title ?? `Slide ${i + 1}`);
        const body = typeof s === "string" ? s : (s.content ?? s.text ?? "");
        return `${i + 1}. ${title}\n${body}`;
      })
      .join("\n\n");

  const title = typeof slide === "string" ? `Slide ${currentIndex + 1}` : (slide.title ?? `Slide ${currentIndex + 1}`);

  const handleExportPPTX = () => {
    const parsed = slides.map((s, i) => ({
      title: typeof s === "string" ? `Slide ${i + 1}` : (s.title ?? `Slide ${i + 1}`),
      content: typeof s === "string" ? s : (s.content ?? s.text ?? ""),
      bullets: typeof s === "string" ? [] : (s.bullets ?? []),
    }));
    exportToPPTX(title, parsed);
  };

  return (
    <div className="rounded-2xl border border-hub-border bg-hub-surface shadow-[0_0_0_1px_var(--hub-border),0_8px_40px_rgba(0,0,0,0.08)]">
      <OutputToolbar
        onCopy={onCopy}
        onRegenerate={onRegenerate}
        onDownload={() => onDownload?.(downloadContent())}
        onSave={onSave}
      />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-hub-sans text-sm text-hub-muted">
            Slide {currentIndex + 1} of {slides.length}
          </span>
          <button
            type="button"
            onClick={handleExportPPTX}
            className="flex items-center gap-1.5 rounded-lg border border-hub-border bg-hub-elevated px-3 py-1.5 font-hub-sans text-sm md:text-xs text-hub-text transition hover:bg-hub-bg"
          >
            <Download className="h-3.5 w-3.5" /> Download PPTX
          </button>
        </div>
        <div className="rounded-xl border border-hub-border bg-hub-bg p-6 min-h-[200px]">
          <h3 className="font-hub-sans text-lg font-semibold text-hub-text mb-3">{title}</h3>
          <div className="font-hub-sans text-sm text-hub-text whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-elevated px-4 py-2 font-hub-sans text-sm text-hub-text transition hover:bg-hub-bg disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {currentIndex === slides.length - 1 ? (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-elevated px-4 py-2 font-hub-sans text-sm text-hub-text transition hover:bg-hub-bg"
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 rounded-xl bg-hub-accent px-4 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
