/**
 * Hook for Competitions XP, level, coins, streak.
 * Persists in React state for the session; level-up callback for full-screen animation.
 */

import { useState, useCallback, useEffect, useRef } from "react";

// Level thresholds: LVL 1 = 0, LVL 2 = 500, LVL 3 = 1250, LVL 4 = 2500, LVL 5 = 5000, then exponential
const LEVEL_THRESHOLDS = [0, 500, 1250, 2500, 5000, 8500, 13000, 18500, 25000, 33000];

function getLevelAndProgress(totalXp) {
  let level = 1;
  let xpInCurrentLevel = totalXp;
  let xpToNextLevel = 500;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    const threshold = LEVEL_THRESHOLDS[i];
    const next = LEVEL_THRESHOLDS[i + 1];
    if (totalXp >= next) {
      level = i + 2;
      xpInCurrentLevel = totalXp - next;
      xpToNextLevel = (LEVEL_THRESHOLDS[i + 2] ?? next + 5000) - next;
    } else {
      level = i + 1;
      xpInCurrentLevel = totalXp - threshold;
      xpToNextLevel = next - threshold;
      break;
    }
  }
  return { level, xpInCurrentLevel, xpToNextLevel };
}

const DEFAULT_STATS = {
  xp: 1250,
  level: 3,
  coins: 350,
  streak: 12,
  xpToNextLevel: 2500,
  xpInCurrentLevel: 0,
};

/**
 * @param {object} initial - optional initial stats (e.g. from user profile)
 * @param {function} onLevelUp - (newLevel) => void, called when level increases
 */
export function useGameXP(initial = {}, onLevelUp) {
  const [stats, setStats] = useState(() => {
    const base = { ...DEFAULT_STATS, ...initial };
    const { level, xpInCurrentLevel, xpToNextLevel } = getLevelAndProgress(base.xp);
    return {
      ...base,
      level,
      xpInCurrentLevel,
      xpToNextLevel,
    };
  });

  const prevLevelRef = useRef(stats.level);
  useEffect(() => {
    if (stats.level > prevLevelRef.current && typeof onLevelUp === "function") {
      onLevelUp(stats.level);
    }
    prevLevelRef.current = stats.level;
  }, [stats.level, onLevelUp]);

  const addXP = useCallback((amount) => {
    setStats((prev) => {
      const totalXp = prev.xp + amount;
      const { level, xpInCurrentLevel, xpToNextLevel } = getLevelAndProgress(totalXp);
      return {
        ...prev,
        xp: totalXp,
        level,
        xpInCurrentLevel,
        xpToNextLevel,
      };
    });
  }, []);

  const addCoins = useCallback((amount) => {
    setStats((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const setStreak = useCallback((days) => {
    setStats((prev) => ({ ...prev, streak: Math.max(0, days) }));
  }, []);

  const incrementStreak = useCallback(() => {
    setStats((prev) => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  return {
    playerStats: stats,
    setPlayerStats: setStats,
    addXP,
    addCoins,
    setStreak,
    incrementStreak,
    getLevelAndProgress,
  };
}
