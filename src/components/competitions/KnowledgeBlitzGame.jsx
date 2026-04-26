import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { CountdownTimer, PlayerAvatar } from "./shared";
import { cn } from "../../lib/utils";

const QUESTION_TIME_SEC = 20;
const BASE_POINTS = 1000;
const POINTS_PER_SEC = 50;

const TILE_COLORS = [
  { bg: "#e21b3c", label: "A" },
  { bg: "#1368ce", label: "B" },
  { bg: "#26890c", label: "C" },
  { bg: "#ffa602", label: "D" },
];

function shuffleOptions(question) {
  const opts = (question.options || []).map((text, i) => ({ text, index: i }));
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

export default function KnowledgeBlitzGame({
  questions,
  players,
  currentIndex,
  onAnswer,
  onComplete,
  onBack,
  addXP,
  addCoins,
  updatePlayerScore,
}) {
  const [remaining, setRemaining] = useState(QUESTION_TIME_SEC);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState("question"); // 'question' | 'reveal' | 'leaderboard'
  const [answered, setAnswered] = useState(false);
  const [leaderboard, setLeaderboard] = useState(players || []);

  const question = questions?.[currentIndex];
  const total = questions?.length ?? 0;
  const options = question ? shuffleOptions(question) : [];
  const isLast = currentIndex >= total - 1;

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r <= 1 && !answered) {
        setAnswered(true);
        setSelected(null);
        setPhase("reveal");
        setTimeout(() => {
          if (isLast) setPhase("final");
          else setPhase("leaderboard");
        }, 2500);
        return 0;
      }
      return Math.max(0, r - 1);
    });
  }, [answered, isLast]);

  useEffect(() => {
    if (!question || phase !== "question") return;
    setRemaining(QUESTION_TIME_SEC);
    setAnswered(false);
    setSelected(null);
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, question?.question, phase, tick]);

  useEffect(() => {
    setPhase((p) => (p === "leaderboard" ? "question" : p));
  }, [currentIndex]);

  // Simulate bot answers
  useEffect(() => {
    if (!question || phase !== "question" || answered) return;
    const bots = (players || []).filter((p) => p.isBot);
    const timeouts = bots.map((bot) => {
      const delay = 2000 + Math.random() * 6000;
      return setTimeout(() => {
        if (answered) return;
        const correct = Math.random() < 0.75;
        const choice = correct ? question.correct_index : (question.correct_index + 1) % 4;
        const points = correct ? BASE_POINTS + remaining * POINTS_PER_SEC : 0;
        updatePlayerScore?.(bot.id, points);
        setLeaderboard((prev) =>
          prev.map((p) => (p.id === bot.id ? { ...p, score: (p.score || 0) + points } : p))
        );
      }, delay);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [question, phase, answered, remaining, players, updatePlayerScore]);

  const handleSelect = (optionIndex) => {
    if (answered) return;
    setAnswered(true);
    setSelected(optionIndex);
    const correct = optionIndex === question.correct_index;
    const points = correct ? BASE_POINTS + remaining * POINTS_PER_SEC : 0;
    if (correct) {
      updatePlayerScore?.("me", points);
      setLeaderboard((prev) =>
        prev.map((p) => (p.id === "me" ? { ...p, score: (p.score || 0) + points } : p))
      );
    }
    setPhase("reveal");
    setTimeout(() => {
      if (isLast) {
        addXP?.(50);
        addCoins?.(15);
        setPhase("final");
      } else {
        setPhase("leaderboard");
      }
    }, 2500);
  };

  if (!question) return null;

  if (phase === "leaderboard") {
    return (
      <BetweenRoundsLeaderboard
        leaderboard={[...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0))}
        currentQuestion={currentIndex + 1}
        totalQuestions={total}
        onNext={() => {
          setPhase("question");
          onAnswer?.();
        }}
      />
    );
  }

  if (phase === "final") {
    const sorted = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));
    return (
      <FinalPodium
        leaderboard={sorted}
        onBack={onBack || onComplete}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[var(--text-secondary)] text-sm">
          Q{currentIndex + 1} of {total}
        </span>
        <span className="text-[var(--text-secondary)] text-sm">Players: {players?.length ?? 0}</span>
        <div className="flex items-center gap-2">
          <CountdownTimer
            seconds={QUESTION_TIME_SEC}
            remaining={remaining}
            size={48}
            strokeColor="#6e5ff0"
          />
          <span className="font-mono text-[var(--text-primary)] w-10">{remaining}s</span>
        </div>
      </div>

      <motion.p
        key={question.question}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-[var(--text-primary)] text-center mb-8 min-h-[3rem]"
      >
        {question.question}
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const color = TILE_COLORS[i] || TILE_COLORS[0];
          const isCorrect = question.correct_index === opt.index;
          const isChosen = selected === opt.index;
          const showCorrect = phase === "reveal" && isCorrect;
          const showWrong = phase === "reveal" && isChosen && !isCorrect;
          return (
            <motion.button
              key={opt.index}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              disabled={answered}
              onClick={() => handleSelect(opt.index)}
              className={cn(
                "rounded-xl border-2 p-4 text-left font-semibold text-[var(--text-primary)] min-h-[88px]",
                "border-black/20 shadow-lg transition-all",
                showCorrect && "ring-4 ring-[#3ecf8e]",
                showWrong && "opacity-60 ring-4 ring-[#f87171]"
              )}
              style={{
                backgroundColor: color.bg,
              }}
            >
              <span className="text-lg opacity-90">{color.label}</span>
              <p className="mt-1 text-sm leading-tight">{opt.text.replace(/^[A-D]\)\s*/, "")}</p>
            </motion.button>
          );
        })}
      </div>

      {phase === "reveal" && question.explanation && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-sm text-[var(--text-secondary)]"
        >
          {question.explanation}
        </motion.p>
      )}
    </div>
  );
}

function BetweenRoundsLeaderboard({ leaderboard, currentQuestion, totalQuestions, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto px-4 py-8"
    >
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Leaderboard</h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        Question {currentQuestion} of {totalQuestions} complete
      </p>
      <ul className="space-y-2 mb-8">
        {leaderboard.slice(0, 8).map((p, i) => (
          <motion.li
            key={p.id}
            layout
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]"
          >
            <span className="w-6 text-center font-bold text-[var(--text-secondary)]">{i + 1}</span>
            <PlayerAvatar name={p.name} size="sm" />
            <span className="flex-1 truncate text-[var(--text-primary)]">{p.name}</span>
            <span className="font-mono font-semibold text-brand-orange">{p.score || 0}</span>
          </motion.li>
        ))}
      </ul>
      <Button onClick={onNext} className="w-full bg-[#6e5ff0]">
        Next question
      </Button>
    </motion.div>
  );
}

function FinalPodium({ leaderboard, onBack }) {
  const top3 = leaderboard.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto px-4 py-12 text-center"
    >
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Game over</h2>
      <p className="text-[var(--text-secondary)] mb-8">Final standings</p>
      <div className="mb-8 flex min-h-[140px] flex-col justify-center gap-4 sm:flex-row sm:items-end">
        {top3.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className={cn(
              "flex w-full flex-col items-center rounded-t-xl border-2 border-[var(--border)] px-4 pb-2 pt-4 sm:w-auto",
              i === 0 && "bg-brand-orange/20 sm:order-2",
              i === 1 && "bg-slate-400/20 sm:order-1",
              i === 2 && "bg-amber-700/20 sm:order-3"
            )}
          >
            <span className="text-2xl mb-1">{medals[i]}</span>
            <PlayerAvatar name={p.name} size="sm" className="mb-2" />
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-[80px]">{p.name}</p>
            <p className="text-sm text-brand-orange font-mono md:text-xs">{p.score || 0} pts</p>
          </motion.div>
        ))}
      </div>
      <Button onClick={onBack} className="bg-[#6e5ff0]">
        Back to Lobby
      </Button>
    </motion.div>
  );
}
