import { motion } from 'framer-motion';
import { Lock, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export default function LockedFeatureOverlay({ featureName, threshold, currentUsers }) {
  const totalUsers = currentUsers ?? 0;
  const unlockThreshold = threshold ?? 0;
  const usersNeeded = Math.max(0, unlockThreshold - totalUsers);
  const progress = unlockThreshold > 0 ? Math.min(100, (totalUsers / unlockThreshold) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-[#09090bcc] p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center shadow-[0_18px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/25 bg-yellow-500/10">
          <Lock className="h-7 w-7 text-yellow-400" />
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="font-[Clash_Display] text-2xl text-white">{featureName}</h3>
          <p className="font-[Satoshi] text-sm leading-6 text-white/65">
            This unlocks when the community reaches{' '}
            <span className="font-semibold text-yellow-300">
              {unlockThreshold.toLocaleString()} users
            </span>
            .
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-left">
          <div className="flex items-center justify-between gap-3 font-[Satoshi] text-sm">
            <span className="inline-flex items-center gap-2 text-white/60">
              <Users className="h-4 w-4 text-yellow-400" />
              {totalUsers.toLocaleString()} users joined
            </span>
            <span className="inline-flex items-center gap-2 text-yellow-300">
              <TrendingUp className="h-4 w-4" />
              {usersNeeded.toLocaleString()} needed
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        </div>

        <Link to="/referral" className="mt-5 block">
          <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            Invite Friends to Unlock Faster
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
