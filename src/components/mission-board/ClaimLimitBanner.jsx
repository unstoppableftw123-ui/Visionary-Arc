import { motion } from "framer-motion";
import { Target } from "lucide-react";

export default function ClaimLimitBanner({ dailyCount, dailyLimit = 3 }) {
  const remaining = Math.max(0, dailyLimit - dailyCount);
  const progress = Math.min(100, (dailyCount / dailyLimit) * 100);
  const limitReached = dailyCount >= dailyLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10">
            <Target className="h-5 w-5 text-yellow-300" />
          </div>
          <div>
            <p className="font-[Clash_Display] text-xl text-white">Daily Claim Limit</p>
            <p className="font-[Satoshi] text-sm text-white/60">
              {dailyCount}/{dailyLimit} daily missions claimed today.
              {limitReached ? " You’ve hit the cap." : ` ${remaining} slot${remaining === 1 ? "" : "s"} left.`}
            </p>
          </div>
        </div>

        <div className="min-w-[180px]">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
