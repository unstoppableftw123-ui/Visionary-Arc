import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Users } from 'lucide-react';
import { getCommunityStats, getFeatureUnlocks } from '../services/communityService';

function ProgressSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4">
      <motion.div
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-40 rounded-full bg-white/10" />
          <div className="h-5 w-24 rounded-full bg-white/10" />
        </div>
        <div className="h-2 w-full rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-12 rounded-xl bg-white/10" />
          <div className="h-12 rounded-xl bg-white/10" />
          <div className="h-12 rounded-xl bg-white/10" />
        </div>
      </motion.div>
    </div>
  );
}

export default function CommunityProgressBar() {
  const [stats, setStats] = useState(null);
  const [unlocks, setUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        const [nextStats, nextUnlocks] = await Promise.all([
          getCommunityStats(),
          getFeatureUnlocks(),
        ]);

        if (!mounted) return;
        setStats(nextStats);
        setUnlocks(nextUnlocks ?? []);
      } catch {
        if (!mounted) return;
        setStats(null);
        setUnlocks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProgress();
    const intervalId = window.setInterval(loadProgress, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const derived = useMemo(() => {
    const currentUsers = stats?.total_users ?? 0;
    const lockedUnlocks = unlocks.filter(
      (unlock) => unlock.unlocked_at === null && currentUsers < unlock.threshold
    );
    const unlockedUnlocks = unlocks.filter(
      (unlock) => unlock.unlocked_at !== null || currentUsers >= unlock.threshold
    );

    const nextThreshold = lockedUnlocks[0]?.threshold ?? null;
    const previousThreshold = unlockedUnlocks.length
      ? unlockedUnlocks[unlockedUnlocks.length - 1].threshold
      : 0;

    const progress = nextThreshold
      ? Math.min(
          100,
          ((currentUsers - previousThreshold) / (nextThreshold - previousThreshold)) * 100
        )
      : 100;

    return {
      currentUsers,
      lockedUnlocks,
      nextThreshold,
      progress: Number.isFinite(progress) ? Math.max(progress, 0) : 0,
      upcoming: lockedUnlocks.slice(0, 3),
    };
  }, [stats, unlocks]);

  if (loading) {
    return <ProgressSkeleton />;
  }

  if (!stats || unlocks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10">
            <Users className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <p className="font-[Clash_Display] text-xl text-white">Community Unlocks</p>
            <p className="font-[Satoshi] text-sm text-white/55">
              Live member count and upcoming milestones
            </p>
          </div>
        </div>

        <motion.div
          key={derived.currentUsers}
          initial={{ opacity: 0.6, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="text-right"
        >
          <p className="font-[Clash_Display] text-2xl text-white">
            {derived.currentUsers.toLocaleString()}
          </p>
          <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">
            users
          </p>
        </motion.div>
      </div>

      {derived.nextThreshold ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 font-[Satoshi] text-sm text-white/60">
            <span>
              {derived.currentUsers.toLocaleString()} / {derived.nextThreshold.toLocaleString()} users
            </span>
            <span className="text-yellow-300">
              {(derived.nextThreshold - derived.currentUsers).toLocaleString()} to next unlock
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${derived.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-[Satoshi] text-sm text-emerald-300">
          <Unlock className="h-4 w-4" />
          All current community unlocks are live.
        </div>
      )}

      {derived.upcoming.length > 0 ? (
        <div className="space-y-3">
          <p className="font-[Satoshi] text-xs uppercase tracking-[0.2em] text-white/40">
            Next 3 unlocks
          </p>
          <div className="space-y-2">
            {derived.upcoming.map((unlock, index) => (
              <motion.div
                key={unlock.feature_key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  index === 0
                    ? 'border-yellow-500/25 bg-yellow-500/10'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <Lock className={`h-4 w-4 ${index === 0 ? 'text-yellow-300' : 'text-white/35'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[Clash_Display] text-lg text-white">{unlock.label}</p>
                  <p className="font-[Satoshi] text-sm text-white/55">
                    Unlocks at {unlock.threshold.toLocaleString()} users
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
