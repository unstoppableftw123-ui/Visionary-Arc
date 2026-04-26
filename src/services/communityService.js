import { supabase } from './supabaseClient';

const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

// ─── Mock data ────────────────────────────────────────────────────────────────

const _mockStats = { id: 1, total_users: 47, redemptions_enabled: false, subscriber_count: 2 };
const _mockUnlocks = [
  { threshold: 100,  feature_key: 'quiz_generator',       label: 'Advanced Quiz Generator', unlocked_at: null },
  { threshold: 250,  feature_key: 'challenge_board',      label: 'Company Challenge Board',  unlocked_at: null },
  { threshold: 500,  feature_key: 'competitions',         label: 'Guild Competitions',       unlocked_at: null },
  { threshold: 1000, feature_key: 'gift_card_redemption', label: 'Gift Card Redemptions',    unlocked_at: null },
  { threshold: 1000, feature_key: 'sat_act_practice',     label: 'SAT / ACT Practice',        unlocked_at: null },
  { threshold: 2500, feature_key: 'live_study_rooms',     label: 'Live Study Rooms',         unlocked_at: null },
  { threshold: 5000, feature_key: 'hiring_pipeline',      label: 'Company Hiring Pipeline',  unlocked_at: null },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the community_stats singleton row.
 * @returns {{ id, total_users, redemptions_enabled, subscriber_count }}
 */
export async function getCommunityStats() {
  if (USE_MOCK) return { ..._mockStats };

  const { data, error } = await supabase
    .from('community_stats')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch all feature_unlocks ordered by threshold ascending.
 * @returns {Array<{ threshold, feature_key, label, unlocked_at }>}
 */
export async function getFeatureUnlocks() {
  if (USE_MOCK) return _mockUnlocks.map((u) => ({ ...u }));

  const { data, error } = await supabase
    .from('feature_unlocks')
    .select('*')
    .order('threshold', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Returns true if featureKey is already unlocked (unlocked_at set OR count >= threshold).
 * Unknown feature keys return true (don't accidentally lock anything unexpected).
 */
export async function isFeatureUnlocked(featureKey) {
  if (USE_MOCK) {
    const unlock = _mockUnlocks.find((u) => u.feature_key === featureKey);
    if (!unlock) return true;
    return unlock.unlocked_at !== null || _mockStats.total_users >= unlock.threshold;
  }

  const [{ data: stats }, { data: unlock }] = await Promise.all([
    supabase.from('community_stats').select('total_users').eq('id', 1).single(),
    supabase.from('feature_unlocks').select('threshold, unlocked_at').eq('feature_key', featureKey).maybeSingle(),
  ]);

  if (!unlock) return true;
  return unlock.unlocked_at !== null || (stats?.total_users ?? 0) >= unlock.threshold;
}

/**
 * Atomically increments community total_users by 1.
 * Call on new user signup. Auto-unlocks any newly crossed thresholds.
 * @returns {number} New total
 */
export async function incrementUserCount() {
  if (USE_MOCK) {
    _mockStats.total_users += 1;
    await checkAndUnlockFeatures(_mockStats.total_users);
    return _mockStats.total_users;
  }

  const { data, error } = await supabase.rpc('increment_community_users');
  if (error) throw error;
  await checkAndUnlockFeatures(data);
  return data;
}

/**
 * Sets unlocked_at on all feature_unlocks where threshold <= currentCount and
 * unlocked_at is still null.
 */
export async function checkAndUnlockFeatures(currentCount) {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    for (const u of _mockUnlocks) {
      if (u.unlocked_at === null && currentCount >= u.threshold) {
        u.unlocked_at = now;
      }
    }
    return;
  }

  await supabase
    .from('feature_unlocks')
    .update({ unlocked_at: new Date().toISOString() })
    .lte('threshold', currentCount)
    .is('unlocked_at', null);
}
