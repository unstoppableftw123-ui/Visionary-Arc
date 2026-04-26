import { supabase } from './supabaseClient';
import { MOCK_REFERRALS, getMockProfile } from '../db/mockData';
import { awardXP } from './db';

const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

// ─── Mock referral store (in-memory for the session) ────────────────────────
let mockReferrals = MOCK_REFERRALS.map((r) => ({ ...r }));
let mockBadges = [];

const STATUS_ORDER = { pending: 0, signed_up: 1, streak_7: 2, upgraded: 3 };
const MILESTONE_REWARDS = {
  streak_7: { xp: 100, coins: 50 },
  upgraded:  { xp: 500, coins: 250 },
};

export const REFERRAL_MILESTONES = [
  { count: 1,  coins: 50,   xp: 100,  badge: null,       frame: null,           label: '1 referral' },
  { count: 5,  coins: 300,  xp: 500,  badge: null,       frame: 'anime_gold',   label: '5 referrals' },
  { count: 10, coins: 500,  xp: 1000, badge: null,       frame: null,           toolUnlock: true, label: '10 referrals' },
  { count: 25, coins: 1000, xp: 2500, badge: 'pioneer',  frame: 'pioneer_aura', label: '25 referrals' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a user's referral code from their profile.
 * Falls back to first 8 chars of userId if no referral_code column yet.
 */
export function getReferralCode(userIdOrProfile) {
  if (typeof userIdOrProfile === 'object' && userIdOrProfile?.referral_code) {
    return userIdOrProfile.referral_code;
  }
  return (String(userIdOrProfile ?? '')).slice(0, 8).toUpperCase();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get referral stats for a referrer.
 * Returns { total, signed_up, streak_7, upgraded, coins_earned }.
 */
export async function getReferralStats(userId) {
  if (USE_MOCK) {
    const rows = mockReferrals.filter((r) => r.referrer_id === userId);
    const stats = { total: rows.length, signed_up: 0, streak_7: 0, upgraded: 0, coins_earned: 0 };
    for (const r of rows) {
      if (r.status === 'signed_up') stats.signed_up += 1;
      if (r.status === 'streak_7')  stats.streak_7  += 1;
      if (r.status === 'upgraded')  stats.upgraded  += 1;
      stats.coins_earned += r.coins_awarded ?? 0;
    }
    return stats;
  }

  const { data, error } = await supabase
    .from('referrals')
    .select('status, coins_awarded')
    .eq('referrer_id', userId);

  if (error) throw error;

  const stats = { total: data?.length ?? 0, signed_up: 0, streak_7: 0, upgraded: 0, coins_earned: 0 };
  for (const row of data ?? []) {
    if (row.status === 'signed_up') stats.signed_up += 1;
    if (row.status === 'streak_7')  stats.streak_7  += 1;
    if (row.status === 'upgraded')  stats.upgraded  += 1;
    stats.coins_earned += row.coins_awarded ?? 0;
  }
  return stats;
}

/**
 * Get the profile whose referral_code matches the given code.
 */
export async function getProfile(userId) {
  if (USE_MOCK) {
    return getMockProfile(userId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Record a new referral when a new user signs up via a referral code.
 * Awards XP + coins to the referrer immediately on sign-up.
 */
export async function trackReferral(referralCode, newUserId) {
  const code = (referralCode ?? '').toUpperCase().trim();
  if (!code || !newUserId) return { success: false };

  if (USE_MOCK) {
    const referrer = MOCK_REFERRALS.find(
      (r) => getMockProfile(r.referrer_id)?.referral_code === code
    );
    if (!referrer) return { success: false };
    const referrerId = referrer.referrer_id;
    if (referrerId === newUserId) return { success: false };

    const existing = mockReferrals.find(
      (r) => r.referrer_id === referrerId && r.referred_id === newUserId
    );
    if (existing && (STATUS_ORDER[existing.status] ?? 0) >= STATUS_ORDER.signed_up) {
      return { success: true };
    }
    if (!existing) {
      mockReferrals.push({
        id: `mock-referral-${Date.now()}`,
        referrer_id: referrerId,
        referred_id: newUserId,
        status: 'signed_up',
        coins_awarded: 100,
        created_at: new Date().toISOString(),
      });
    }
    return { success: true, referrerId };
  }

  // Look up referrer by referral_code
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .limit(1);

  if (profileErr) throw profileErr;
  if (!profiles || profiles.length === 0) return { success: false };

  const referrerId = profiles[0].id;
  if (referrerId === newUserId) return { success: false };

  const { data: existing } = await supabase
    .from('referrals')
    .select('id, status, coins_awarded')
    .eq('referrer_id', referrerId)
    .eq('referred_id', newUserId)
    .maybeSingle();

  if (existing && (STATUS_ORDER[existing.status] ?? 0) >= STATUS_ORDER.signed_up) {
    return { success: true };
  }

  if (!existing) {
    const { error: insertErr } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_id: newUserId,
      status: 'pending',
      coins_awarded: 0,
    });
    if (insertErr) throw insertErr;
  }

  // Award XP + coins to referrer
  const { awardCoins } = await import('./coinService');
  await awardCoins(referrerId, 100, 'referral_signed_up');
  await awardXP(referrerId, 300);

  await supabase
    .from('referrals')
    .update({ status: 'signed_up', coins_awarded: 100 })
    .eq('referrer_id', referrerId)
    .eq('referred_id', newUserId);

  return { success: true, referrerId };
}

/**
 * Advance a referral to a milestone (streak_7 or upgraded) and award rewards.
 */
export async function awardReferralMilestone(referrerId, referredId, milestone) {
  const reward = MILESTONE_REWARDS[milestone];
  if (!reward) return { success: false };

  if (USE_MOCK) {
    const referral = mockReferrals.find(
      (r) => r.referrer_id === referrerId && r.referred_id === referredId
    );
    if (!referral) return { success: false };
    if ((STATUS_ORDER[referral.status] ?? 0) >= (STATUS_ORDER[milestone] ?? 0)) {
      return { success: true };
    }
    referral.status = milestone;
    referral.coins_awarded = (referral.coins_awarded ?? 0) + reward.coins;
    return { success: true };
  }

  const { data: referral, error: fetchErr } = await supabase
    .from('referrals')
    .select('id, status, coins_awarded')
    .eq('referrer_id', referrerId)
    .eq('referred_id', referredId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!referral) return { success: false };

  const currentOrder = STATUS_ORDER[referral.status] ?? 0;
  const targetOrder  = STATUS_ORDER[milestone] ?? 0;
  if (targetOrder <= currentOrder) return { success: true };

  const { awardCoins } = await import('./coinService');
  const { awardXP } = await import('./db');
  await awardCoins(referrerId, reward.coins, `referral_${milestone}`);
  await awardXP(referrerId, reward.xp);

  const { error: updateErr } = await supabase
    .from('referrals')
    .update({
      status: milestone,
      coins_awarded: (referral.coins_awarded ?? 0) + reward.coins,
    })
    .eq('id', referral.id);

  if (updateErr) throw updateErr;
  return { success: true };
}

// ─── Referral milestone system ────────────────────────────────────────────────

/**
 * Check how many confirmed referrals a user has and award any newly crossed
 * REFERRAL_MILESTONES. Returns the list of newly awarded milestone objects.
 */
export async function checkReferralMilestones(userId) {
  if (USE_MOCK) {
    const count = mockReferrals.filter(
      (r) => r.referrer_id === userId && r.status !== 'pending'
    ).length;
    const currentMilestone = mockReferrals.find((r) => r.referrer_id === userId)?._milestone_count ?? 0;
    const newlyAwarded = [];
    for (const m of REFERRAL_MILESTONES) {
      if (count >= m.count && currentMilestone < m.count) {
        newlyAwarded.push(m);
        if (m.frame) await awardAvatarFrame(userId, m.frame);
        if (m.badge) await awardAvatarFrame(userId, m.badge);
      }
    }
    // Update mock milestone_count
    for (const r of mockReferrals) {
      if (r.referrer_id === userId) r._milestone_count = count;
    }
    return newlyAwarded;
  }

  const { data: referral } = await supabase
    .from('referrals')
    .select('milestone_count')
    .eq('referrer_id', userId)
    .limit(1)
    .maybeSingle();

  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .neq('status', 'pending');

  const currentMilestoneCount = referral?.milestone_count ?? 0;
  const total = count ?? 0;

  const newlyAwarded = [];
  for (const m of REFERRAL_MILESTONES) {
    if (total >= m.count && currentMilestoneCount < m.count) {
      newlyAwarded.push(m);
      if (m.frame) await awardAvatarFrame(userId, m.frame);
      if (m.badge) await awardAvatarFrame(userId, `badge_${m.badge}`);
    }
  }

  if (newlyAwarded.length > 0) {
    await supabase
      .from('referrals')
      .update({ milestone_count: total })
      .eq('referrer_id', userId);
  }

  return newlyAwarded;
}

/**
 * Insert a badge/frame key into referral_badges for a user.
 * Silently skips if already present (ON CONFLICT DO NOTHING handled by PK).
 */
export async function awardAvatarFrame(userId, frameKey) {
  if (USE_MOCK) {
    if (!mockBadges.find((b) => b.user_id === userId && b.badge_key === frameKey)) {
      mockBadges.push({ user_id: userId, badge_key: frameKey, earned_at: new Date().toISOString() });
    }
    return;
  }

  await supabase
    .from('referral_badges')
    .upsert({ user_id: userId, badge_key: frameKey }, { onConflict: 'user_id,badge_key', ignoreDuplicates: true });
}

/**
 * Fetch all referral_badges for a user.
 * @returns {Array<{ user_id, badge_key, earned_at }>}
 */
export async function getUserBadges(userId) {
  if (USE_MOCK) {
    return mockBadges.filter((b) => b.user_id === userId);
  }

  const { data, error } = await supabase
    .from('referral_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
