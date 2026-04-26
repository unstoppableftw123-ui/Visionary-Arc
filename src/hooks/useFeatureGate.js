import { useEffect, useState } from 'react';
import { getCommunityStats, getFeatureUnlocks } from '../services/communityService';

const ALWAYS_UNLOCKED = new Set([
  'study_hub',
  'ai_tutor',
  'flashcards',
  'notes_studio',
]);

/**
 * Checks whether a community-gated feature is unlocked.
 *
 * @param {string} featureKey
 * @returns {{ unlocked: boolean, threshold: number|null, currentUsers: number, loading: boolean }}
 */
export function useFeatureGate(featureKey) {
  const [state, setState] = useState({
    unlocked: ALWAYS_UNLOCKED.has(featureKey),
    threshold: null,
    currentUsers: 0,
    loading: !ALWAYS_UNLOCKED.has(featureKey),
  });

  useEffect(() => {
    if (ALWAYS_UNLOCKED.has(featureKey)) return;

    let mounted = true;
    let intervalId = null;

    async function loadGate() {
      try {
        const [stats, unlocks] = await Promise.all([getCommunityStats(), getFeatureUnlocks()]);
        if (!mounted) return;

        const currentUsers = stats?.total_users ?? 0;
        const unlock = unlocks.find((u) => u.feature_key === featureKey);

        if (!unlock) {
          setState({ unlocked: true, threshold: null, currentUsers, loading: false });
          return;
        }

        const unlocked = unlock.unlocked_at !== null || currentUsers >= unlock.threshold;
        setState({
          unlocked,
          threshold: unlock.threshold,
          currentUsers,
          loading: false,
        });
      } catch {
        if (mounted) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadGate();
    intervalId = window.setInterval(loadGate, 30000);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [featureKey]);

  return state;
}
