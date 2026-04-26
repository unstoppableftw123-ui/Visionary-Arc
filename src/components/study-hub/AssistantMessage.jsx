import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SummaryView from "./SummaryView";
import QuizView from "./QuizView";
import FlashcardView from "./FlashcardView";
import SlidesView from "./SlidesView";

export default function AssistantMessage({
  message,
  onCopy,
  onRegenerate,
  onDownload,
  onSave,
}) {
  const { loading, error, mode, content, data } = message;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hub-elevated">
          <Sparkles className="h-4 w-4 text-hub-accent" />
        </div>
        <div className="min-h-[80px] flex-1 rounded-2xl border border-hub-border bg-hub-surface/50 px-4 py-4">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-hub-accent [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-hub-accent [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-hub-accent [animation-delay:300ms]" />
          </div>
          <p className="mt-2 font-hub-sans text-sm text-hub-muted">Generating...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hub-elevated">
          <Sparkles className="h-4 w-4 text-hub-accent" />
        </div>
        <div className="flex-1 rounded-2xl border border-hub-error/30 bg-hub-surface px-4 py-4">
          <p className="font-hub-sans font-medium text-hub-error">Something went wrong</p>
          <p className="mt-1 font-hub-sans text-sm text-hub-muted">{error}</p>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-3 rounded-xl bg-hub-accent px-4 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] hover:opacity-90"
            >
              Try again
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const handleCopy = async () => {
    const text =
      mode === "summarize" || mode === "notes"
        ? content
        : Array.isArray(data) && mode === "slides"
        ? data.map((s) => (typeof s === "string" ? s : `${s.title || ""}\n${s.content ?? s.text ?? ""}`).trim()).join("\n\n")
        : JSON.stringify(data);
    await navigator.clipboard.writeText(text || "");
    onCopy?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hub-elevated">
        <Sparkles className="h-4 w-4 text-hub-accent" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border-l-2 border-transparent pl-1 transition-colors hover:border-hub-accent/40">
        <AnimatePresence mode="wait">
          {(mode === "summarize" || mode === "notes") && (
            <motion.div
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SummaryView
                content={content || ""}
                streaming={false}
                onCopy={handleCopy}
                onRegenerate={onRegenerate}
                onDownload={(text) => onDownload?.(text)}
                onSave={onSave ? () => onSave(mode === "notes" ? "notes" : "summary", content) : undefined}
              />
            </motion.div>
          )}
          {mode === "slides" && Array.isArray(data) && data.length > 0 && (
            <motion.div
              key="slides"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SlidesView
                slides={data}
                onCopy={handleCopy}
                onRegenerate={onRegenerate}
                onDownload={(text) => onDownload?.(text)}
                onSave={onSave ? () => onSave("slides", data) : undefined}
              />
            </motion.div>
          )}
          {mode === "quiz" && data?.length !== undefined && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <QuizView
                questions={data || []}
                onCopy={handleCopy}
                onRegenerate={onRegenerate}
                onDownload={(text) => onDownload?.(text)}
                onSave={onSave ? () => onSave("quiz", { questions: data }) : undefined}
              />
            </motion.div>
          )}
          {mode === "flashcards" && data?.length !== undefined && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FlashcardView
                cards={data || []}
                onCopy={handleCopy}
                onRegenerate={onRegenerate}
                onDownload={(text) => onDownload?.(text)}
                onSave={onSave ? () => onSave("flashcards", data) : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
