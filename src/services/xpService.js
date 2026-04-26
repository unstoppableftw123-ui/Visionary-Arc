import { awardXP } from './db';
import { supabase } from './supabaseClient';
import { awardReferralMilestone } from './referralService';
import { awardCoins } from './coinService';

// ── Rank system ───────────────────────────────────────────────────────────────

export const RANK_THRESHOLDS = { E: 0, D: 500, C: 1500, B: 4000, A: 10000, S: 25000 };
export const DIFFICULTY_BASE_XP = { E: 50, D: 100, C: 250, B: 500, A: 1000, S: 2500 };
export const STAR_MULTIPLIERS = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.5 };
export const TRACK_TO_STAT = {
  tech: 'technical',
  design: 'creativity',
  content: 'communication',
  business: 'leadership',
  impact: 'impact',
};

/** Returns XP for a project submission: base * star multiplier, rounded. */
export function calculateXP(difficulty, starRating) {
  const base = DIFFICULTY_BASE_XP[difficulty] ?? 100;
  const mult = STAR_MULTIPLIERS[starRating] ?? 1.0;
  return Math.round(base * mult);
}

/** Returns the rank letter for a given total XP. */
export function getRankFromXP(totalXp) {
  const entries = Object.entries(RANK_THRESHOLDS).sort((a, b) => b[1] - a[1]);
  for (const [rank, threshold] of entries) {
    if (totalXp >= threshold) return rank;
  }
  return 'E';
}

/**
 * Returns the new rank letter if a threshold was crossed going from oldXp to newXp,
 * otherwise null.
 */
export function checkRankUp(oldXp, newXp) {
  const oldRank = getRankFromXP(oldXp);
  const newRank = getRankFromXP(newXp);
  return oldRank !== newRank ? newRank : null;
}

/** Increments the relevant stat_radar dimension in the profiles table. */
export async function updateStatRadar(userId, track, xpGained) {
  if (!userId) return;
  const statKey = TRACK_TO_STAT[track];
  if (!statKey) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stat_radar')
    .eq('id', userId)
    .single();

  const radar = profile?.stat_radar ?? {
    technical: 0, creativity: 0, communication: 0, leadership: 0, impact: 0,
  };
  radar[statKey] = (radar[statKey] ?? 0) + xpGained;

  await supabase.from('profiles').update({ stat_radar: radar }).eq('id', userId);
}

/**
 * Updates streak_current / streak_longest / last_active_date on profiles.
 * Uses profiles columns (not the streaks table).
 */
export async function updateStreak(userId) {
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, streak_longest, last_active_date')
    .eq('id', userId)
    .single();

  if (!profile) return;
  if (profile.last_active_date === today) return;

  let streakCurrent =
    profile.last_active_date === yesterdayStr ? (profile.streak_current ?? 0) + 1 : 1;
  const streakLongest = Math.max(streakCurrent, profile.streak_longest ?? 0);

  await supabase.from('profiles').update({
    streak_current: streakCurrent,
    streak_longest: streakLongest,
    last_active_date: today,
  }).eq('id', userId);
}

// ── Activity reward table (CLAUDE.md §5) ─────────────────────────────────────

export const ACTIVITY_REWARDS = {
  flashcards: { xp: 15, coins: 5 },
  quiz:        { xp: 20, coins: 8 },
  summary:     { xp: 10, coins: 3 },
  notes:       { xp: 10, coins: 3 },
  whiteboard:  { xp: 10, coins: 3 },
  vocab:       { xp: 15, coins: 5 },
  practice:    { xp: 30, coins: 10 },
  login:       { xp: 5,  coins: 2 },
};

// ── Tier thresholds (CLAUDE.md §6) ───────────────────────────────────────────

export const TIERS = [
  { name: 'Elite',    xp: 15000 },
  { name: 'Pro',      xp: 6000  },
  { name: 'Creator',  xp: 2000  },
  { name: 'Builder',  xp: 500   },
  { name: 'Beginner', xp: 0     },
];

export function getTierForXP(xp) {
  for (const tier of TIERS) {
    if (xp >= tier.xp) return tier.name;
  }
  return 'Beginner';
}

export function getNextTier(currentXP) {
  const ordered = [...TIERS].reverse(); // ascending
  for (let i = 0; i < ordered.length; i++) {
    if (currentXP < ordered[i].xp) {
      return {
        nextTier: ordered[i].name,
        xpNeeded: ordered[i].xp,
        xpRemaining: ordered[i].xp - currentXP,
      };
    }
  }
  return { nextTier: 'Elite', xpNeeded: 15000, xpRemaining: 0 };
}

export function canAccessBriefDifficulty(tier, difficulty) {
  const normalized = String(difficulty ?? '').toLowerCase();
  if (normalized === 'starter') return true;
  if (normalized === 'standard') return ['Builder', 'Creator', 'Pro', 'Elite'].includes(tier);
  if (normalized === 'advanced') return ['Creator', 'Pro', 'Elite'].includes(tier);
  if (normalized === 'expert') return ['Pro', 'Elite'].includes(tier);
  return false;
}

export function canAccessChallengeBoard(tier) {
  return ['Creator', 'Pro', 'Elite'].includes(tier);
}

export async function awardBonusXP(userId, amount, reason = 'bonus') {
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return { awarded: false, reason: 'invalid_input' };
  }

  await awardXP(userId, amount);
  await supabase.from('study_sessions').insert({
    user_id: userId,
    activity_type: reason,
    subject: null,
    xp_earned: amount,
    coins_earned: 0,
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();
  const xpAfter = profile?.xp ?? amount;

  return {
    awarded: true,
    xpGained: amount,
    newTier: getTierForXP(xpAfter),
  };
}

export async function awardCustomReward(userId, rewardKey, reward, options = {}) {
  if (!userId) return { awarded: false, reason: 'no_user' };
  if (!reward?.xp && !reward?.coins) return { awarded: false, reason: 'invalid_reward' };

  const storageKey = options.storageKey;
  if (storageKey && typeof localStorage !== 'undefined') {
    if (localStorage.getItem(storageKey)) {
      return { awarded: false, reason: 'reward_already_claimed' };
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  const xpBefore = profile?.xp ?? 0;
  const tierBefore = getTierForXP(xpBefore);

  if (reward.xp) {
    await awardXP(userId, reward.xp);
  }

  if (reward.coins) {
    await awardCoins(userId, reward.coins, options.coinReason ?? rewardKey);
  }

  await supabase.from('study_sessions').insert({
    user_id: userId,
    activity_type: rewardKey,
    subject: options.subject ?? null,
    xp_earned: reward.xp ?? 0,
    coins_earned: reward.coins ?? 0,
  });

  if (storageKey && typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey, '1');
  }

  const xpAfter = xpBefore + (reward.xp ?? 0);
  const tierAfter = getTierForXP(xpAfter);

  return {
    awarded: true,
    xpGained: reward.xp ?? 0,
    coinsGained: reward.coins ?? 0,
    levelUp: tierAfter !== tierBefore,
    newTier: tierAfter,
  };
}

// ── Award XP + coins for a study activity ────────────────────────────────────

export async function awardActivityXP(userId, activityType, subject) {
  if (!userId) return { awarded: false, reason: 'no_user' };

  const rewards = ACTIVITY_REWARDS[activityType];
  if (!rewards) return { awarded: false, reason: 'unknown_activity' };

  // Daily-limit guard via localStorage
  const today = new Date().toISOString().split('T')[0];
  const limitKey = `xp_limit_${userId}_${activityType}_${subject ?? ''}_${today}`;
  if (localStorage.getItem(limitKey)) {
    return { awarded: false, reason: 'daily_limit' };
  }
  localStorage.setItem(limitKey, '1');

  // Snapshot XP before award to detect tier change
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();
  const xpBefore = profile?.xp ?? 0;
  const tierBefore = getTierForXP(xpBefore);

  // Log to study_sessions
  await supabase.from('study_sessions').insert({
    user_id: userId,
    activity_type: activityType,
    subject: subject ?? null,
    xp_earned: rewards.xp,
    coins_earned: rewards.coins,
  });

  // Award XP and coins via db helpers (handles RPC + fallback)
  await awardXP(userId, rewards.xp);
  await awardCoins(userId, rewards.coins, `${activityType}_activity`);

  const xpAfter = xpBefore + rewards.xp;
  const tierAfter = getTierForXP(xpAfter);
  const levelUp = tierAfter !== tierBefore;

  return {
    awarded: true,
    xpGained: rewards.xp,
    coinsGained: rewards.coins,
    levelUp,
    newTier: tierAfter,
  };
}

export async function awardProjectSubmissionXP(userId, xpAmount) {
  if (!userId || !xpAmount) return { awarded: false, reason: 'invalid_input' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  const xpBefore = profile?.xp ?? 0;
  const tierBefore = getTierForXP(xpBefore);

  await awardXP(userId, xpAmount);

  const xpAfter = xpBefore + xpAmount;
  const tierAfter = getTierForXP(xpAfter);
  const levelUp = tierAfter !== tierBefore;

  return {
    awarded: true,
    xpGained: xpAmount,
    levelUp,
    newTier: tierAfter,
  };
}

// ── Friend streak bonuses ─────────────────────────────────────────────────────

export async function updateFriendStreaks(userId) {
  if (!userId) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  // Check if this user was active yesterday
  const { data: userStreak } = await supabase
    .from('streaks')
    .select('last_activity_date')
    .eq('user_id', userId)
    .single();

  if (userStreak?.last_activity_date !== yesterdayStr) return;

  // Get accepted friendships
  const { data: friendships } = await supabase
    .from('friends')
    .select('id, friend_id, friend_streak, last_both_active')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) return;

  for (const friendship of friendships) {
    // Skip if already processed today
    if (friendship.last_both_active === today) continue;

    // Check if friend was also active yesterday
    const { data: friendStreak } = await supabase
      .from('streaks')
      .select('last_activity_date')
      .eq('user_id', friendship.friend_id)
      .single();

    if (friendStreak?.last_activity_date !== yesterdayStr) continue;

    // Both active yesterday — increment friend streak
    const newStreak = (friendship.friend_streak ?? 0) + 1;
    await supabase
      .from('friends')
      .update({ friend_streak: newStreak, last_both_active: today })
      .eq('id', friendship.id);

    // Award XP + coins to both users (CLAUDE.md §5: +20 XP, +10 coins)
    await awardXP(userId, 20);
    await awardCoins(userId, 10, 'friend_streak_bonus');
    await awardXP(friendship.friend_id, 20);
    await awardCoins(friendship.friend_id, 10, 'friend_streak_bonus');

    if (newStreak === 7) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)
        .eq('referred_id', friendship.friend_id)
        .maybeSingle();

      if (referral?.id) {
        await awardReferralMilestone(userId, friendship.friend_id, 'streak_7');
      }
    }
  }
}

export async function awardFriendStreakBonus(userId) {
  if (!userId) return { awarded: false, reason: 'no_user' };
  await awardXP(userId, 20);
  await awardCoins(userId, 10, 'friend_streak_bonus');
  return { awarded: true, xpGained: 20, coinsGained: 10 };
}

// ── Streak check + milestone bonuses ─────────────────────────────────────────

export async function checkAndUpdateStreak(userId) {
  if (!userId) return { streak: 0, milestone: null };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  let currentStreak = existing?.current_streak ?? 0;
  const lastActivity = existing?.last_activity_date;

  if (lastActivity === today) {
    return { streak: currentStreak, milestone: null };
  } else if (lastActivity === yesterdayStr) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const maxStreak = Math.max(currentStreak, existing?.max_streak ?? 0);

  await supabase.from('streaks').upsert({
    user_id: userId,
    current_streak: currentStreak,
    max_streak: maxStreak,
    last_activity_date: today,
  });

  // Milestone bonuses
  let milestone = null;
  if (currentStreak === 7) {
    await awardXP(userId, 200);
    await awardCoins(userId, 50, 'streak_7_day_milestone');
    milestone = '7_day';
  } else if (currentStreak === 30) {
    await awardXP(userId, 1000);
    await awardCoins(userId, 200, 'streak_30_day_milestone');
    milestone = '30_day';
  }

  return { streak: currentStreak, milestone };
}
