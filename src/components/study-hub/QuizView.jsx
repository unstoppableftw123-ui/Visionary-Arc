import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Copy, RefreshCw, Download } from "lucide-react";
import { OutputToolbar } from "./SummaryView";

export default function QuizView({
  questions,
  onCopy,
  onRegenerate,
  onDownload,
  onSave,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(new Set());

  if (!questions?.length) return null;

  const q = questions[currentIndex];
  const options = q.options || [];
  const correctIndex = q.correct_answer;
  const isCorrect = selectedOption === correctIndex;

  const handleSelect = (index) => {
    if (revealed) return;
    setSelectedOption(index);
    setRevealed(true);
    if (index === correctIndex) setScore((s) => s + 1);
    setAnswered((prev) => new Set(prev).add(currentIndex));
  };

  const goPrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setSelectedOption(null);
    setRevealed(false);
  };

  const goNext = () => {
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
    setSelectedOption(null);
    setRevealed(false);
  };

  const reset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setRevealed(false);
    setScore(0);
    setAnswered(new Set());
  };

  const downloadContent = () => {
    const text = questions
      .map((qu, i) => `${i + 1}. ${qu.question}\n${(qu.options || []).map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join("\n")}\n   Answer: ${(qu.options || [])[qu.correct_answer]}\n`)
      .join("\n");
    return text;
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
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-hub-sans text-sm font-medium text-hub-text">
            Score: {score} / {questions.length}
          </span>
        </div>

        <p className="mb-6 font-hub-sans text-lg font-medium text-hub-text">{q.question}</p>

        <div className="space-y-2">
          {options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = revealed && index === correctIndex;
            const showWrong = revealed && isSelected && !isCorrect;
            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleSelect(index)}
                disabled={revealed}
                className={`
                  w-full rounded-xl border px-4 py-3 text-left font-hub-sans text-sm transition
                  ${revealed
                    ? showCorrect
                      ? "border-hub-success bg-hub-success/10 text-hub-text"
                      : showWrong
                        ? "border-hub-error bg-hub-error/10 text-hub-text animate-shake"
                        : "border-hub-border bg-hub-elevated text-hub-muted"
                    : "border-hub-border bg-hub-elevated text-hub-text hover:bg-hub-bg hover:border-hub-border"
                  }
                `}
                whileTap={!revealed ? { scale: 0.98 } : {}}
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-hub-elevated/30 font-hub-mono text-sm md:text-xs">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </motion.button>
            );
          })}
        </div>

        {revealed && q.explanation && (
          <div className="mt-4 rounded-xl border border-hub-border bg-hub-bg/50 p-4 font-hub-sans text-sm text-hub-muted">
            <span className="font-medium text-hub-text">Explanation: </span>
            {q.explanation}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-elevated px-4 py-2 font-hub-sans text-sm text-hub-text transition hover:bg-hub-bg disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {currentIndex === questions.length - 1 ? (
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
              disabled={!revealed}
              className="flex items-center gap-2 rounded-xl bg-hub-accent px-4 py-2 font-hub-sans text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
