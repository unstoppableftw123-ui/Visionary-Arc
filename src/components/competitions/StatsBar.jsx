import { motion } from "framer-motion";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";

/**
 * Sticky bottom bar: XP, Level, Coins, Streak with animated XP progress toward next level.
 */
export default function StatsBar({ playerStats, className }) {
  const { xp, level, coins, streak, xpToNextLevel = 2500, xpInCurrentLevel = 0 } = playerStats || {};
  const progressPercent = xpToNextLevel > 0 ? Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100) : 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky bottom-0 left-0 right-0 z-10 border-t border-[var(--border)] bg-[var(--bg-base)] px-4 py-3",
        "flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>🏅</span>
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{xp ?? 0}</span>
        <span className="text-sm md:text-xs text-[var(--text-secondary)]">XP</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>⭐</span>
        <span className="font-semibold text-[var(--text-primary)]">Lvl {level ?? 1}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>🪙</span>
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{coins ?? 0}</span>
        <span className="text-sm md:text-xs text-[var(--text-secondary)]">Coins</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>🔥</span>
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{streak ?? 0}</span>
        <span className="text-sm md:text-xs text-[var(--text-secondary)]">Day Streak</span>
      </div>

      <div className="w-full max-w-[200px] flex-shrink-0">
        <Progress value={progressPercent} className="h-2 bg-[var(--surface-2)]" />
        <p className="text-sm md:text-[10px] text-[var(--text-secondary)] mt-0.5 text-center">
          {xpInCurrentLevel ?? 0} / {xpToNextLevel} to next level
        </p>
      </div>
    </motion.div>
  );
}
