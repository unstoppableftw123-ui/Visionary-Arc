import { AnimatePresence, motion } from "framer-motion";
import { Coins, Sparkles, Trophy } from "lucide-react";
import { Button } from "../ui/button";

export default function MissionCard({
  mission,
  onClaim,
  claiming = false,
  celebrate = false,
  dailyLimitReached = false,
}) {
  const progress = mission?.progress ?? 0;
  const target = Math.max(1, mission?.target ?? 1);
  const progressPercent = Math.min(100, Math.round((progress / target) * 100));
  const readyToClaim = progress >= target && !mission?.claimed;
  const typeLabel = mission?.type === "weekly" ? "Weekly" : "Daily";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <AnimatePresence>
        {celebrate && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.7 }}
              className="pointer-events-none absolute inset-0 rounded-full bg-yellow-400/10 blur-2xl"
            />
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.3, 1, 0.6],
                  x: [0, (index - 2.5) * 16],
                  y: [0, index % 2 === 0 ? -26 : 26],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: index * 0.04 }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-yellow-400"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
              {typeLabel}
            </span>
            <h3 className="mt-3 font-[Clash_Display] text-2xl text-white">{mission?.title}</h3>
            <p className="mt-2 font-[Satoshi] text-sm leading-6 text-white/65">{mission?.description}</p>
          </div>

          {mission?.claimed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Trophy className="h-3.5 w-3.5" />
              Claimed
            </span>
          ) : readyToClaim ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              <Sparkles className="h-3.5 w-3.5" />
              Ready
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/50">
              In Progress
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Reward</p>
            <p className="mt-2 font-[Clash_Display] text-lg text-white">{mission?.xp_reward ?? 0} XP</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Coins</p>
            <p className="mt-2 flex items-center gap-1 font-[Clash_Display] text-lg text-yellow-300">
              <Coins className="h-4 w-4" />
              {mission?.coins_reward ?? 0}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Progress</span>
            <span>
              {progress}/{target}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={() => onClaim?.(mission)}
          disabled={!readyToClaim || claiming || (dailyLimitReached && mission?.type === "daily")}
          className={
            readyToClaim
              ? "w-full bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              : "w-full border border-white/10 bg-white/5 text-white/45 hover:bg-white/5"
          }
        >
          {mission?.claimed
            ? "Claimed"
            : claiming
            ? "Claiming..."
            : readyToClaim
            ? dailyLimitReached && mission?.type === "daily"
              ? "Daily Limit Reached"
              : "Claim Rewards"
            : "Keep Going"}
        </Button>
      </div>
    </motion.div>
  );
}
