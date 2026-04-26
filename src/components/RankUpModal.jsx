import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

const RANK_META = {
  E: { label: 'E',  color: 'var(--rank-e)', glow: 'var(--glow-e)', bg: 'from-slate-400 to-slate-600' },
  D: { label: 'D',  color: 'var(--rank-d)', glow: 'var(--glow-d)', bg: 'from-green-400 to-emerald-600' },
  C: { label: 'C',  color: 'var(--rank-c)', glow: 'var(--glow-c)', bg: 'from-blue-400 to-blue-600' },
  B: { label: 'B',  color: 'var(--rank-b)', glow: 'var(--glow-b)', bg: 'from-orange-700 to-orange-600' },
  A: { label: 'A',  color: 'var(--rank-a)', glow: 'var(--glow-a)', bg: 'from-amber-400 to-orange-500' },
  S: { label: 'S',  color: 'var(--rank-s)', glow: 'var(--glow-s)', bg: 'from-yellow-400 to-amber-500' },
};

const AUTO_DISMISS_MS = 4000;

/**
 * Listens for visionary:rank-up custom events.
 * Also checks profile.rank_up_pending on mount if a userId is passed.
 *
 * Usage — dispatch event:
 *   window.dispatchEvent(new CustomEvent('visionary:rank-up', { detail: { rank: 'B' } }))
 *
 * Or pass userId and the component will clear rank_up_pending automatically.
 */
export default function RankUpModal({ userId }) {
  const [rank, setRank] = useState(null);
  const timerRef = useRef(null);

  function show(rankLetter) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRank(rankLetter);
    fireConfetti();
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
  }

  async function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRank(null);
    if (userId) {
      await supabase
        .from('profiles')
        .update({ rank_up_pending: false })
        .eq('id', userId);
    }
  }

  // Check rank_up_pending from DB on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('current_rank, rank_up_pending')
        .eq('id', userId)
        .single();
      if (data?.rank_up_pending && data?.current_rank) {
        show(data.current_rank);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Listen for programmatic triggers
  useEffect(() => {
    function handleEvent(e) {
      if (e.detail?.rank) show(e.detail.rank);
    }
    window.addEventListener('visionary:rank-up', handleEvent);
    return () => {
      window.removeEventListener('visionary:rank-up', handleEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const meta = rank ? (RANK_META[rank] ?? RANK_META.E) : null;

  return (
    <AnimatePresence>
      {rank && meta && (
        <motion.div
          key="rank-up-overlay"
          className="rank-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            {/* Rank badge */}
            <motion.div
              className={`badge-rank xl rank-up-badge-reveal bg-gradient-to-br ${meta.bg}`}
              style={{ width: 160, height: 160, fontSize: '4.5rem', borderColor: meta.color }}
              animate={{
                boxShadow: [
                  `0 0 24px 8px ${meta.glow}`,
                  `0 0 56px 24px ${meta.glow}`,
                  `0 0 24px 8px ${meta.glow}`,
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {meta.label}
            </motion.div>

            {/* Text */}
            <div className="rank-up-text space-y-2">
              <p style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                Rank Up
              </p>
              <p style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
                You've reached{' '}
                <span style={{ color: meta.color }}>Rank {meta.label}</span>
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                Tap anywhere to continue
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fireConfetti() {
  const colors = ['#e8722a', '#F97316', '#e8722a', '#3B82F6', '#22C55E'];
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors,
    scalar: 1.1,
  });
  setTimeout(() => {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 }, colors, angle: 60 });
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 }, colors, angle: 120 });
  }, 250);
}
