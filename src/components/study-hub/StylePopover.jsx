import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const AGENTS = [
  { id: "deep", label: "Deep Analysis" },
  { id: "quick", label: "Quick Summary" },
  { id: "study", label: "Study Notes" },
];
const SUMMARY_STYLES = ["Concise", "Detailed", "Bullet Points", "ELI5"];
const SUMMARY_LENGTHS = ["Short", "Medium", "Long"];
const QUESTION_TYPES = [
  { id: "multiple_choice", label: "Multiple Choice" },
  { id: "true_false", label: "True or False" },
  { id: "short_answer", label: "Short Answer" },
  { id: "mixed", label: "Mixed" },
];
const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const CARD_COUNTS = [10, 20, 30];
const CARD_STYLES = [
  { id: "term_def", label: "Term → Definition" },
  { id: "question_answer", label: "Question → Answer" },
  { id: "cloze", label: "Cloze (fill-in-the-blank)" },
];
const NOTES_STYLES = ["Outline", "Cornell", "Detailed"];
const SLIDE_COUNTS = [5, 8, 10, 12];

function Segment({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-hub-bg p-1">
      {options.map((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        const id = typeof opt === "string" ? opt : opt.id;
        const isActive = value === id || value === opt;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-md px-2.5 py-1.5 font-hub-sans text-sm md:text-xs transition ${
              isActive ? "bg-hub-accent text-[var(--text-primary)]" : "text-hub-muted hover:bg-hub-elevated hover:text-hub-text"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function StylePopover({
  open,
  onClose,
  mode,
  options,
  onChange,
  anchorRef,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const summarizeOpts = options.summarize || {};
  const quizOpts = options.quiz || {};
  const flashcardOpts = options.flashcards || {};
  const notesOpts = options.notes || {};
  const slidesOpts = options.slides || {};

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="rounded-xl border border-hub-border bg-hub-elevated p-3 shadow-xl"
    >
      {mode === "summarize" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Style</p>
            <select
              value={summarizeOpts.summaryStyle ?? "Concise"}
              onChange={(e) => onChange("summarize", { ...summarizeOpts, summaryStyle: e.target.value })}
              className="w-full rounded-lg border border-hub-border bg-hub-bg px-3 py-2 font-hub-sans text-sm text-hub-text outline-none focus:ring-2 focus:ring-hub-accent/40"
            >
              {SUMMARY_STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Length</p>
            <Segment
              options={SUMMARY_LENGTHS}
              value={summarizeOpts.summaryLength ?? "Medium"}
              onChange={(v) => onChange("summarize", { ...summarizeOpts, summaryLength: v })}
            />
          </div>
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Agent</p>
            <Segment
              options={AGENTS}
              value={summarizeOpts.agent ?? "deep"}
              onChange={(v) => onChange("summarize", { ...summarizeOpts, agent: v })}
            />
          </div>
        </div>
      )}
      {mode === "quiz" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Type</p>
            <Segment
              options={QUESTION_TYPES}
              value={quizOpts.questionType ?? "multiple_choice"}
              onChange={(v) => onChange("quiz", { ...quizOpts, questionType: v })}
            />
          </div>
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Count</p>
            <div className="flex gap-1">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange("quiz", { ...quizOpts, numQuestions: n })}
                  className={`h-8 w-8 rounded-lg font-hub-sans text-sm md:text-xs font-medium transition ${
                    (quizOpts.numQuestions ?? 5) === n ? "bg-hub-accent text-[var(--text-primary)]" : "bg-hub-bg text-hub-muted hover:bg-hub-elevated hover:text-hub-text"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Difficulty</p>
            <Segment
              options={DIFFICULTIES}
              value={quizOpts.difficulty ?? "Medium"}
              onChange={(v) => onChange("quiz", { ...quizOpts, difficulty: v })}
            />
          </div>
        </div>
      )}
      {mode === "flashcards" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Count</p>
            <div className="flex gap-1">
              {CARD_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange("flashcards", { ...flashcardOpts, numCards: n })}
                  className={`h-8 w-10 rounded-lg font-hub-sans text-sm md:text-xs font-medium transition ${
                    (flashcardOpts.numCards ?? 10) === n ? "bg-hub-accent text-[var(--text-primary)]" : "bg-hub-bg text-hub-muted hover:bg-hub-elevated hover:text-hub-text"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Format</p>
            <Segment
              options={CARD_STYLES}
              value={flashcardOpts.cardStyle ?? "term_def"}
              onChange={(v) => onChange("flashcards", { ...flashcardOpts, cardStyle: v })}
            />
          </div>
        </div>
      )}
      {mode === "notes" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Style</p>
            <Segment
              options={NOTES_STYLES}
              value={notesOpts.notesStyle ?? "Outline"}
              onChange={(v) => onChange("notes", { ...notesOpts, notesStyle: v })}
            />
          </div>
        </div>
      )}
      {mode === "slides" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-hub-sans text-sm md:text-xs font-medium text-hub-muted">Slide count</p>
            <div className="flex flex-wrap gap-1">
              {SLIDE_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange("slides", { ...slidesOpts, slideCount: n })}
                  className={`h-8 w-10 rounded-lg font-hub-sans text-sm md:text-xs font-medium transition ${
                    (slidesOpts.slideCount ?? 5) === n ? "bg-hub-accent text-[var(--text-primary)]" : "bg-hub-bg text-hub-muted hover:bg-hub-elevated hover:text-hub-text"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function getStylePillLabel(mode, options) {
  if (mode === "summarize") return options.summarize?.summaryStyle || "Concise";
  if (mode === "quiz") {
    const id = options.quiz?.questionType || "multiple_choice";
    return QUESTION_TYPES.find((t) => t.id === id)?.label || "Multiple Choice";
  }
  if (mode === "flashcards") {
    const id = options.flashcards?.cardStyle || "term_def";
    return CARD_STYLES.find((c) => c.id === id)?.label || "Term → Definition";
  }
  if (mode === "notes") return options.notes?.notesStyle || "Outline";
  if (mode === "slides") return `${options.slides?.slideCount ?? 5} slides`;
  return "Options";
}
