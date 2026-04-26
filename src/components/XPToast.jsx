import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Module-level dispatcher so showXPToast can be called from anywhere ────────
let _dispatch = null;

export function showXPToast({ xp = 0, coins = 0, levelUp = false, tier = '' }) {
  if (_dispatch) _dispatch({ xp, coins, levelUp, tier });
}

// ── Animated count-up number ──────────────────────────────────────────────────
function CountUp({ target, duration = 600 }) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return <span>{value}</span>;
}

// ── XPToast component — mount once in App.js ──────────────────────────────────
export default function XPToast() {
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    _dispatch = (data) => {
      clearTimeout(timerRef.current);
      setCurrent(data);
      timerRef.current = setTimeout(
        () => setCurrent(null),
        data.levelUp ? 3200 : 2200
      );
    };
    return () => {
      _dispatch = null;
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {current && (
        <>
          {/* XP + coins pill */}
          <motion.div
            key="xp-pill"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="toast success"
            style={{ zIndex: 50 }}
          >
            <span style={{ color: 'var(--rank-s)', fontWeight: 700, fontSize: '0.875rem' }}>
              +<CountUp target={current.xp} /> XP
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.875rem' }}>
              +<CountUp target={current.coins} /> coins
            </span>
          </motion.div>

          {/* Level-up full-screen flash */}
          {current.levelUp && (
            <motion.div
              key="level-up-overlay"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.35 }}
              className="rank-up-overlay"
              style={{ zIndex: 200 }}
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="rank-up-text text-center select-none"
              >
                <p style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                  LEVEL UP!
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>
                  You're now a {current.tier}
                </p>
                <motion.div
                  style={{ marginTop: '1.5rem', height: 4, width: 128, margin: '1.5rem auto 0', borderRadius: 9999, background: 'var(--accent)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                />
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
