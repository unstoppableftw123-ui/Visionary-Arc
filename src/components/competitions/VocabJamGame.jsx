import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { XPFloatAnimation, StreakCounter } from "./shared";
import { cn } from "../../lib/utils";

const ROUND_TIME_SEC = 25;
const CORRECT_XP = 10;
const STREAK_BONUS_PER = 5;
const SPEED_BONUS_MAX = 5;
const GAME_COMPLETION_XP = 25;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export default function VocabJamGame({
  questions,
  currentIndex,
  score,
  streak,
  onAnswer,
  onComplete,
  addXP,
  addCoins,
  jamId,
  myName,
}) {
  const [remaining, setRemaining] = useState(ROUND_TIME_SEC);
  const [selected, setSelected] = useState(null);
  const [floatingXP, setFloatingXP] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [answered, setAnswered] = useState(false);

  // Multiplayer leaderboard (only used when jamId is provided)
  const wsRef = useRef(null);
  const [liveScores, setLiveScores] = useState([]);

  useEffect(() => {
    if (!jamId) return;
    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/jam/' + jamId;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'roster' || msg.type === 'score_update') {
          setLiveScores([...msg.players].sort((a, b) => b.score - a.score));
        }
      } catch (_) {}
    };
    return () => { ws.close(); wsRef.current = null; };
  }, [jamId]);

  const emitScore = useCallback((newScore) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: 'score_update', playerId: 'me', score: newScore }));
  }, []);

  const card = questions?.[currentIndex];
  const total = questions?.length ?? 0;
  const isLast = currentIndex >= total - 1;

  const options = card
    ? shuffle([card.definition, ...(card.distractors || []).slice(0, 3)])
    : [];

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r <= 1) {
        if (!answered) {
          setAnswered(true);
          setFeedback("timeout");
          setTimeout(() => {
            if (isLast) {
              addXP(GAME_COMPLETION_XP);
              addCoins(5);
              onComplete?.({ score, streak });
            } else {
              onAnswer?.({ correct: false, skipped: true });
            }
          }, 600);
        }
        return 0;
      }
      return r - 1;
    });
  }, [answered, isLast, score, streak, onAnswer, onComplete, addXP, addCoins]);

  useEffect(() => {
    if (!card || answered) return;
    setRemaining(ROUND_TIME_SEC);
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, card?.term, answered, tick]);

  const handleSelect = (option) => {
    if (answered) return;
    setAnswered(true);
    setSelected(option);
    const correct = option === card.definition;
    setFeedback(correct ? "correct" : "wrong");

    if (correct) {
      const roundStart = ROUND_TIME_SEC - remaining;
      const speedBonus = roundStart <= 5 ? SPEED_BONUS_MAX : Math.max(1, 6 - Math.floor(roundStart / 4));
      const streakBonus = (streak + 1) * STREAK_BONUS_PER;
      const xpGain = CORRECT_XP + speedBonus + streakBonus;
      setFloatingXP(xpGain);
      addXP(xpGain);
      addCoins(1);
      emitScore(score + xpGain);
      setTimeout(() => {
        if (isLast) {
          addXP(GAME_COMPLETION_XP);
          addCoins(5);
          onComplete?.({ score: score + xpGain, streak: streak + 1 });
        } else {
          onAnswer?.({ correct: true, xp: xpGain, newStreak: streak + 1 });
        }
      }, 800);
    } else {
      setTimeout(() => {
        if (isLast) {
          addXP(GAME_COMPLETION_XP);
          onComplete?.({ score, streak: 0 });
        } else {
          onAnswer?.({ correct: false, newStreak: 0 });
        }
      }, 800);
    }
  };

  if (!card) return null;

  return (
    <div className={cn(
      "px-4 py-6",
      jamId ? "max-w-3xl mx-auto flex gap-6 items-start" : "max-w-lg mx-auto"
    )}>
      {/* Game area */}
      <div className={jamId ? "flex-1 min-w-0" : ""}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <span className="text-[var(--text-secondary)] text-sm">
          Round {currentIndex + 1} of {total}
        </span>
        <div className="flex items-center gap-4">
          <div
            className="h-2 flex-1 min-w-[80px] max-w-[120px] rounded-full bg-[var(--surface-2)] overflow-hidden"
            style={{ width: (remaining / ROUND_TIME_SEC) * 100 + "%" }}
          >
            <motion.div
              className="h-full bg-[#6e5ff0]"
              initial={{ width: "100%" }}
              animate={{ width: (remaining / ROUND_TIME_SEC) * 100 + "%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-mono text-[var(--text-primary)] w-8">{remaining}s</span>
        </div>
        <div className="flex items-center gap-2">
          <StreakCounter count={streak} />
        </div>
        <span className="text-sm text-[#f59e0b]">XP: +{score}</span>
      </div>

      {/* Term card */}
      <div className="relative mb-8 flex justify-center">
        <XPFloatAnimation xpGain={floatingXP} className="top-0 left-1/2 -translate-x-1/2" />
        <motion.div
          key={card.term}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: feedback === "correct" ? 1.05 : 1,
            x: feedback === "wrong" ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          transition={
            feedback === "wrong"
              ? { x: { duration: 0.4 }, scale: { duration: 0.2 } }
              : { duration: 0.2 }
          }
          className={cn(
            "w-full max-w-md rounded-2xl border-2 p-6 text-center text-xl font-semibold text-[var(--text-primary)]",
            "bg-[var(--surface-2)] border-[var(--border)]",
            feedback === "correct" && "border-[#3ecf8e] bg-[#3ecf8e]/10",
            feedback === "wrong" && "border-[#f87171] bg-[#f87171]/10"
          )}
        >
          {card.term}
        </motion.div>
      </div>

      {/* Definition options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <motion.button
            key={opt}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            disabled={answered}
            onClick={() => handleSelect(opt)}
            className={cn(
              "rounded-xl border-2 p-4 text-left text-sm font-medium transition-all min-h-[80px]",
              "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-primary)]",
              "hover:border-[#6e5ff0]/50 hover:bg-[#6e5ff0]/10 disabled:pointer-events-none",
              selected === opt && opt === card.definition && "border-[#3ecf8e] bg-[#3ecf8e]/10",
              selected === opt && opt !== card.definition && "border-[#f87171] bg-[#f87171]/10"
            )}
          >
            {opt}
          </motion.button>
        ))}
      </div>
      </div>{/* end game area */}

      {/* Live leaderboard sidebar — only in jam mode */}
      {jamId && (
        <div className="w-44 shrink-0 sticky top-4">
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-sm md:text-xs font-semibold text-[var(--text-primary)]">Live Scores</span>
            </div>
            {liveScores.length === 0 ? (
              <p className="text-sm md:text-xs text-[var(--text-muted)]">Connecting...</p>
            ) : (
              <div className="space-y-1.5">
                {liveScores.map((p, i) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 text-sm md:text-xs rounded-lg px-2 py-1.5",
                      p.id === 'me' ? "bg-[#6e5ff0]/20 text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    <span className="w-4 shrink-0 text-center font-bold text-[var(--text-secondary)]">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">
                      {p.id === 'me' ? (myName || 'You') : p.name}
                    </span>
                    <span className="font-mono font-semibold">{p.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function VocabJamResults({ score, totalRounds, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto px-4 py-12 text-center"
    >
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Round complete</h2>
      <p className="text-[var(--text-secondary)] mb-6">You earned {score} XP this game.</p>
      <Button onClick={onBack} className="bg-[#6e5ff0] hover:bg-[#6e5ff0]/90">
        Back to Lobby
      </Button>
    </motion.div>
  );
}
