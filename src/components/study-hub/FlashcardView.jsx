import { useState, useContext } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, BookmarkPlus } from "lucide-react";
import { OutputToolbar } from "./SummaryView";
import { AuthContext } from "../../App";
import { saveSetOffline, syncSetToSupabase, getSetWithCards } from "../../services/flashcardService";
import { toast } from "sonner";

export default function FlashcardView({
  cards,
  onCopy,
  onRegenerate,
  onDownload,
  onSave,
}) {
  const { user } = useContext(AuthContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!cards?.length) return null;

  const card = cards[currentIndex];

  const goPrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  };

  const goNext = () => {
    setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  const reset = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  const downloadContent = () => {
    return cards.map((c, i) => `Card ${i + 1}\nFront: ${c.front}\nBack: ${c.back}\n`).join("\n");
  };

  const handleSaveSet = async () => {
    setSaving(true);
    try {
      const setId = await saveSetOffline(user?.id ?? 'guest', 'Generated Set', 'General', cards);
      toast.success('Flashcard set saved! Access it offline anytime.');
      const savedSet = await getSetWithCards(setId);
      syncSetToSupabase(savedSet);
    } catch (err) {
      toast.error('Failed to save flashcard set.');
    } finally {
      setSaving(false);
    }
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
        <div className="mb-4 text-center font-hub-sans text-sm text-hub-muted">
          Card {currentIndex + 1} of {cards.length}
        </div>

        <div className="perspective-1000">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="relative mx-auto flex h-64 w-full max-w-md cursor-pointer touch-manipulation flex-col items-center justify-center rounded-2xl border border-hub-border bg-hub-elevated p-6 text-center transition hover:border-hub-border"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 transition-transform duration-300 ease-out"
              style={{
                backfaceVisibility: "hidden",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <p className="font-hub-mono text-base leading-relaxed text-hub-text">
                {card.front}
              </p>
              <span className="mt-2 font-hub-sans text-sm md:text-xs text-hub-muted">Click to flip</span>
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-hub-accent/30 bg-hub-bg p-6 transition-transform duration-300 ease-out"
              style={{
                backfaceVisibility: "hidden",
                transform: flipped ? "rotateY(0deg)" : "rotateY(-180deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <p className="font-hub-sans text-base leading-relaxed text-hub-text">
                {card.back}
              </p>
            </div>
          </button>
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
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-elevated px-4 py-2 font-hub-sans text-sm text-hub-text transition hover:bg-hub-bg"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
            className="flex items-center gap-2 rounded-xl bg-hub-accent px-4 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleSaveSet}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-elevated px-5 py-2 font-hub-sans text-sm text-hub-text transition hover:bg-hub-bg disabled:opacity-50"
          >
            <BookmarkPlus className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Set'}
          </button>
        </div>
      </div>
    </div>
  );
}
