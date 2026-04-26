import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { PlayerAvatar } from "./shared";
import { cn } from "../../lib/utils";

const MAX_HP = 10;
const ROUNDS_TO_WIN = 5;

export default function AccuracyDuelGame({
  questions,
  opponent,
  currentIndex,
  myHP,
  opponentHP,
  myWins,
  opponentWins,
  onRoundResult,
  onDuelComplete,
  addXP,
  addCoins,
}) {
  const [selected, setSelected] = useState(null);
  const [roundPhase, setRoundPhase] = useState("playing"); // 'playing' | 'result' | 'next'
  const [roundWinner, setRoundWinner] = useState(null); // 'me' | 'opponent' | null
  const [opponentAnswered, setOpponentAnswered] = useState(false);

  const question = questions?.[currentIndex];
  const total = questions?.length ?? 0;
  const options = question?.options || [];
  const correctIndex = question?.correct_index ?? 0;

  const handleSelect = useCallback(
    (index) => {
      if (roundPhase !== "playing" || selected !== null) return;
      setSelected(index);
      const correct = index === correctIndex;
      if (correct) {
        setRoundWinner("me");
        setRoundPhase("result");
        setOpponentAnswered(true);
        setTimeout(() => {
          onRoundResult?.({ winner: "me", myNewHP: myHP, opponentNewHP: opponentHP - 1 });
        }, 1500);
      } else {
        setRoundWinner("opponent");
        setRoundPhase("result");
        setTimeout(() => {
          onRoundResult?.({ winner: "opponent", myNewHP: myHP - 1, opponentNewHP: opponentHP });
        }, 1500);
      }
    },
    [roundPhase, selected, correctIndex, myHP, opponentHP, onRoundResult]
  );

  useEffect(() => {
    setRoundPhase("playing");
    setSelected(null);
    setRoundWinner(null);
    setOpponentAnswered(false);
  }, [currentIndex]);

  // Bot answers after random delay
  useEffect(() => {
    if (!question || roundPhase !== "playing" || opponentAnswered || selected !== null) return;
    const delay = 2000 + Math.random() * 6000;
    const t = setTimeout(() => {
      if (selected !== null) return;
      setOpponentAnswered(true);
      const correct = Math.random() < 0.75;
      const botChoice = correct ? correctIndex : (correctIndex + 1) % Math.max(1, options.length);
      if (correct) {
        setRoundWinner("opponent");
        setRoundPhase("result");
        setTimeout(() => {
          onRoundResult?.({ winner: "opponent", myNewHP: myHP - 1, opponentNewHP: opponentHP });
        }, 1500);
      } else {
        setRoundWinner("me");
        setRoundPhase("result");
        setTimeout(() => {
          onRoundResult?.({ winner: "me", myNewHP: myHP, opponentNewHP: opponentHP - 1 });
        }, 1500);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [question, roundPhase, opponentAnswered, selected, correctIndex, options.length, myHP, opponentHP, onRoundResult]);

  if (!question) return null;

  const gameOver = myHP <= 0 || opponentHP <= 0;
  const myWonDuel = opponentHP <= 0;

  if (gameOver) {
    return (
      <DuelFinalScreen
        won={myWonDuel}
        myWins={myWonDuel ? myWins + 1 : myWins}
        opponentWins={opponentWins}
        opponent={opponent}
        onBack={() => onDuelComplete?.({ rematch: false })}
        onRematch={() => onDuelComplete?.({ rematch: true })}
        onBack={() => onDuelComplete?.({ rematch: false })}
        addXP={addXP}
        addCoins={addCoins}
      />
    );
  }

  if (roundPhase === "result") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-md mx-auto px-4 py-16 text-center"
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={cn(
              "text-2xl font-bold",
              roundWinner === "me" ? "text-[#3ecf8e]" : "text-[#f87171]"
            )}
          >
            {roundWinner === "me" ? "YOU WIN THIS ROUND" : "OPPONENT WINS THIS ROUND"}
          </motion.p>
          <p className="text-[var(--text-secondary)] mt-2">Best of {ROUNDS_TO_WIN}</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <Button
              onClick={() => {
                setRoundPhase("next");
                setSelected(null);
                setRoundWinner(null);
                setOpponentAnswered(false);
                onRoundResult?.({ advance: true });
              }}
            >
              Next round
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* HP bars */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <p className="text-sm md:text-xs text-[var(--text-secondary)] mb-1">You</p>
          <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                myHP > 6 ? "bg-[#3ecf8e]" : myHP > 3 ? "bg-[#f59e0b]" : "bg-[#f87171]"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${(myHP / MAX_HP) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm md:text-xs text-[var(--text-secondary)] mt-0.5">{myHP} HP</p>
        </div>
        <span className="text-[var(--text-secondary)] font-medium">vs</span>
        <div className="flex-1 text-right">
          <p className="text-sm md:text-xs text-[var(--text-secondary)] mb-1">Opponent</p>
          <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full ml-auto",
                opponentHP > 6 ? "bg-[#3ecf8e]" : opponentHP > 3 ? "bg-[#f59e0b]" : "bg-[#f87171]"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${(opponentHP / MAX_HP) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm md:text-xs text-[var(--text-secondary)] mt-0.5">{opponentHP} HP</p>
        </div>
      </div>
      <p className="text-center text-[var(--text-secondary)] text-sm mb-6">
        Round {currentIndex + 1} — Best of {ROUNDS_TO_WIN}
      </p>

      <p className="text-xl font-semibold text-[var(--text-primary)] text-center mb-6">{question.question}</p>
      <p className="text-center text-sm md:text-xs text-[var(--text-secondary)] mb-4">First to answer correctly wins the round</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <motion.button
            key={i}
            type="button"
            disabled={selected !== null}
            onClick={() => handleSelect(i)}
            className={cn(
              "rounded-xl border-2 p-4 text-left text-sm font-medium transition-all",
              "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-primary)]",
              "hover:border-[#6e5ff0]/50 disabled:pointer-events-none",
              selected === i && i === correctIndex && "border-[#3ecf8e] bg-[#3ecf8e]/10",
              selected === i && i !== correctIndex && "border-[#f87171] bg-[#f87171]/10"
            )}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function DuelFinalScreen({
  won,
  myWins,
  opponentWins,
  opponent,
  onRematch,
  onBack,
  addXP,
  addCoins,
}) {
  useEffect(() => {
    if (won) {
      addXP?.(50);
      addCoins?.(15);
    }
  }, [won, addXP, addCoins]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto px-4 py-12 text-center"
    >
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        {won ? "You win the duel!" : "Duel over"}
      </h2>
      <p className="text-[var(--text-secondary)] mb-6">
        {myWins} — {opponentWins}
      </p>
      {opponent && (
        <div className="flex justify-center gap-3 mb-6">
          <PlayerAvatar name="You" size="lg" />
          <span className="text-[var(--text-secondary)] self-center">vs</span>
          <PlayerAvatar name={opponent.name} size="lg" />
        </div>
      )}
      {won && <p className="text-[#f59e0b] font-semibold mb-4">+50 XP · Duel Win</p>}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onBack} className="border-[var(--border)]">
          Back to Lobby
        </Button>
        <Button onClick={onRematch} className="bg-[#6e5ff0]">
          Rematch
        </Button>
      </div>
    </motion.div>
  );
}
