import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// SQL helper — run once in Supabase SQL Editor before using awardCoins:
//
// CREATE OR REPLACE FUNCTION increment_coins(p_user_id uuid, p_amount int)
// RETURNS int AS $$
//   UPDATE profiles SET coins = coins + p_amount WHERE id = p_user_id RETURNING coins;
// $$ LANGUAGE sql SECURITY DEFINER;
// ─────────────────────────────────────────────────────────────────────────────

// ── PROFILES ─────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function awardXP(userId, amount) {
  try {
    const { data, error } = await supabase.rpc('increment_xp', {
      p_user_id: userId,
      p_amount: amount,
    });
    if (error) {
      // Fallback: manual increment if rpc not available
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();
      const newXp = (profile?.xp ?? 0) + amount;
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', userId)
        .select('xp')
        .single();
      return { data: updated, error: updateError };
    }
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function awardCoins(userId, amount, reason) {
  try {
    const { data: newBalance, error: rpcError } = await supabase.rpc('increment_coins', {
      p_user_id: userId,
      p_amount: amount,
    });
    if (rpcError) return { data: null, error: rpcError };

    const { data, error } = await supabase
      .from('coins_transactions')
      .insert({
        user_id: userId,
        amount,
        reason,
        balance_after: newBalance,
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── STREAKS ───────────────────────────────────────────────────────────────────

export async function getStreak(userId) {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateStreakActivity(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    let currentStreak = existing?.current_streak ?? 0;
    const lastActivity = existing?.last_activity_date;

    if (lastActivity) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === today) {
        // Already updated today — no change
        return { data: existing, error: null };
      } else if (lastActivity === yesterdayStr) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const maxStreak = Math.max(currentStreak, existing?.max_streak ?? 0);

    const { data, error } = await supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        current_streak: currentStreak,
        max_streak: maxStreak,
        last_activity_date: today,
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── MISSIONS ──────────────────────────────────────────────────────────────────

export async function getDailyMissions(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'daily')
      .gte('reset_at', today);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function claimMission(missionId, userId) {
  try {
    const { data, error } = await supabase
      .from('missions')
      .update({ claimed: true })
      .eq('id', missionId)
      .eq('user_id', userId)
      .select('xp_reward, coins_reward')
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function seedDailyMissions(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('missions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'daily')
      .gte('reset_at', today);

    if (existing && existing.length > 0) {
      return { data: existing, error: null };
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resetAt = tomorrow.toISOString().split('T')[0];

    const missions = [
      {
        user_id: userId,
        type: 'daily',
        title: 'Study Session',
        description: 'Complete a study session in Study Hub',
        xp_reward: 50,
        coins_reward: 10,
        progress: 0,
        target: 1,
        completed: false,
        claimed: false,
        reset_at: resetAt,
      },
      {
        user_id: userId,
        type: 'daily',
        title: 'Practice Problems',
        description: 'Answer 5 practice questions',
        xp_reward: 75,
        coins_reward: 15,
        progress: 0,
        target: 5,
        completed: false,
        claimed: false,
        reset_at: resetAt,
      },
      {
        user_id: userId,
        type: 'daily',
        title: 'Daily Login',
        description: 'Log in today',
        xp_reward: 25,
        coins_reward: 10,
        progress: 1,
        target: 1,
        completed: true,
        claimed: false,
        reset_at: resetAt,
      },
    ];

    const { data, error } = await supabase
      .from('missions')
      .insert(missions)
      .select();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────

export async function getUserProjects(userId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createProject(userId, trackId, briefJson) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        track_id: trackId,
        brief: briefJson,
        status: 'in_progress',
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function submitProject(projectId, submissionUrl, notes, xpAwarded = 0, coinsAwarded = 0) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'submitted',
        submission_url: submissionUrl,
        submission_notes: notes,
        xp_awarded: xpAwarded,
        coins_awarded: coinsAwarded,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function completeProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── PORTFOLIO ─────────────────────────────────────────────────────────────────

export async function getPortfolio(userId) {
  try {
    const { data, error } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addPortfolioEntry(entryData) {
  try {
    const { data, error } = await supabase
      .from('portfolio_entries')
      .insert(entryData)
      .select()
      .single();

    if (!error && data?.is_public && data?.user_id) {
      const { awardCustomReward } = await import('./xpService');
      await awardCustomReward(
        data.user_id,
        'portfolio_publish',
        { xp: 25, coins: 5 },
        {
          storageKey: `portfolio_publish_${data.user_id}_${data.project_id ?? data.id}`,
          subject: data.track ?? null,
          coinReason: 'portfolio_publish',
        },
      );
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('leaderboard_weekly')
      .select('*')
      .order('rank', { ascending: true })
      .limit(100);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUserRank(userId) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_weekly')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

export async function getTransactions(userId) {
  try {
    const { data, error } = await supabase
      .from('coins_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addTransaction(userId, amount, reason, balanceAfter) {
  try {
    const { data, error } = await supabase
      .from('coins_transactions')
      .insert({
        user_id: userId,
        amount,
        reason,
        balance_after: balanceAfter,
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── FRIENDS ───────────────────────────────────────────────────────────────────

export async function getFriends(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, friend:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function sendFriendRequest(userId, friendId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function acceptFriendRequest(friendshipId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateFriendStreak(friendshipId) {
  try {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('friend_streak, last_mutual_activity')
      .eq('id', friendshipId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastActivity = friendship?.last_mutual_activity;
    let friendStreak = friendship?.friend_streak ?? 0;

    if (lastActivity === today) {
      return { data: friendship, error: null };
    } else if (lastActivity === yesterdayStr) {
      friendStreak += 1;
    } else {
      friendStreak = 1;
    }

    const { data, error } = await supabase
      .from('friendships')
      .update({
        friend_streak: friendStreak,
        last_mutual_activity: today,
      })
      .eq('id', friendshipId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ── REFERRALS ─────────────────────────────────────────────────────────────────

export async function getReferralStats(userId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, coins_awarded')
      .eq('referrer_id', userId);

    if (error) return { data: null, error };

    const totalReferrals = data?.length ?? 0;
    const totalCoinsEarned = (data ?? []).reduce(
      (sum, r) => sum + (r.coins_awarded ?? 0),
      0
    );
    return { data: { totalReferrals, totalCoinsEarned, referrals: data }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function trackReferral(referrerCode, newUserId) {
  try {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referrerCode)
      .single();

    if (!referrer) {
      return { data: null, error: new Error('Referrer not found') };
    }

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        coins_awarded: 50,
      })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
