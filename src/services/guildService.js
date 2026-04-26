import { supabase } from './supabaseClient';

// ── XP tables for reviewSubmission ────────────────────────────────────────────
const BASE_XP = { E: 100, D: 200, C: 400, B: 700, A: 1000, S: 1500 };
const STAR_MULTIPLIER = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.5 };

// XP rank thresholds (must match CLAUDE.md)
const RANK_XP_THRESHOLDS = [
  { rank: 'S', xp: 15000 },
  { rank: 'A', xp: 6000 },
  { rank: 'B', xp: 2000 },
  { rank: 'C', xp: 500 },
  { rank: 'D', xp: 100 },
  { rank: 'E', xp: 0 },
];

function xpToRank(totalXp) {
  for (const { rank, xp } of RANK_XP_THRESHOLDS) {
    if (totalXp >= xp) return rank;
  }
  return 'E';
}

// ── Existing ──────────────────────────────────────────────────────────────────

export async function autoJoinAdventurersGuild(userId) {
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id')
    .eq('slug', 'adventurers-guild')
    .single();

  if (guildError || !guild) {
    console.error('autoJoinAdventurersGuild: guild not found', guildError);
    return;
  }

  const { error } = await supabase
    .from('guild_members')
    .upsert(
      { guild_id: guild.id, user_id: userId, status: 'active' },
      { onConflict: 'guild_id,user_id', ignoreDuplicates: true }
    );

  if (error) {
    console.error('autoJoinAdventurersGuild error:', error);
  }
}

// ── Company guild management ──────────────────────────────────────────────────

/**
 * Create a new company-owned guild.
 * @param {string} companyId
 * @param {{ name, description, tier, entryMinRank, entryMinStars, entryTrack, bannerUrl, colorTheme }} opts
 * @returns {Promise<object>} created guild row
 */
export async function createCompanyGuild(companyId, {
  name,
  description,
  tier,
  entryMinRank = 'E',
  entryMinStars = 0,
  entryTrack = null,
  bannerUrl = null,
  colorTheme = '#EAB308',
}) {
  if (!['basic', 'elite'].includes(tier)) {
    throw new Error("tier must be 'basic' or 'elite'");
  }

  const maxMembers = tier === 'elite' ? 200 : 50;
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const { data: guild, error } = await supabase
    .from('guilds')
    .insert({
      name,
      slug,
      description,
      type: 'company',
      company_id: companyId,
      tier,
      max_members: maxMembers,
      banner_url: bannerUrl,
      color_theme: colorTheme,
      entry_min_rank: entryMinRank,
      entry_min_stars: entryMinStars,
      entry_track: entryTrack,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-join the company as an active member
  const { error: memberError } = await supabase
    .from('guild_members')
    .insert({ guild_id: guild.id, user_id: companyId, status: 'active' });

  if (memberError) throw memberError;

  return guild;
}

/**
 * Post a mission draft to a guild. Company must own the guild.
 * @param {string} companyId
 * @param {string} guildId
 * @param {{ title, description, difficulty, type, track, xp_reward, coin_reward, min_rank_required, max_claims, is_repeatable, expiry_at }} missionData
 * @returns {Promise<object>} created guild_missions row
 */
export async function postMission(companyId, guildId, missionData) {
  // Verify ownership
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('id, company_id, coin_budget')
    .eq('id', guildId)
    .single();

  if (guildError || !guild) throw new Error('Guild not found');
  if (guild.company_id !== companyId) throw new Error('Not the guild owner');

  // Verify coin budget
  const { data: wallet, error: walletError } = await supabase
    .from('company_wallets')
    .select('coin_balance')
    .eq('company_id', companyId)
    .single();

  if (walletError || !wallet) throw new Error('Wallet not found');
  if (wallet.coin_balance < (missionData.coin_reward || 0)) {
    throw new Error('Insufficient coin budget');
  }

  const { data: mission, error } = await supabase
    .from('guild_missions')
    .insert({
      ...missionData,
      guild_id: guildId,
      created_by: companyId,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return mission;
}

/**
 * Publish a draft mission so students can see and claim it.
 * @param {string} companyId
 * @param {string} missionId
 */
export async function publishMission(companyId, missionId) {
  // Verify ownership via mission → guild → company
  const { data: mission, error: fetchError } = await supabase
    .from('guild_missions')
    .select('id, guild_id, guilds(company_id)')
    .eq('id', missionId)
    .single();

  if (fetchError || !mission) throw new Error('Mission not found');
  if (mission.guilds?.company_id !== companyId) throw new Error('Not the guild owner');

  const { error } = await supabase
    .from('guild_missions')
    .update({ status: 'published' })
    .eq('id', missionId);

  if (error) throw error;
}

/**
 * Review a submission and award/reject XP + coins.
 * @param {string} companyId
 * @param {string} assignmentId
 * @param {{ starRating: number, feedback: string, approved: boolean }} review
 */
export async function reviewSubmission(companyId, assignmentId, { starRating, feedback, approved }) {
  // Load assignment with mission and guild info
  const { data: assignment, error: assignError } = await supabase
    .from('mission_assignments')
    .select('id, user_id, mission_id, guild_id, guild_missions(difficulty, coin_reward, title, track, guild_id, guilds(company_id))')
    .eq('id', assignmentId)
    .single();

  if (assignError || !assignment) throw new Error('Assignment not found');

  const mission = assignment.guild_missions;
  if (mission?.guilds?.company_id !== companyId) throw new Error('Not authorized');

  if (!approved) {
    const { error } = await supabase
      .from('mission_assignments')
      .update({ status: 'rejected', reviewer_feedback: feedback })
      .eq('id', assignmentId);
    if (error) throw error;
    return;
  }

  // Calculate XP
  const difficulty = mission.difficulty ?? 'E';
  const baseXp = BASE_XP[difficulty] ?? 100;
  const multiplier = STAR_MULTIPLIER[starRating] ?? 1.0;
  const xpAwarded = Math.round(baseXp * multiplier);
  const coinReward = mission.coin_reward ?? 0;
  const studentCut = Math.round(coinReward * 0.8);
  const platformCut = coinReward - studentCut;
  const studentId = assignment.user_id;

  // Update assignment
  const { error: assignUpdateError } = await supabase
    .from('mission_assignments')
    .update({
      status: 'approved',
      star_rating: starRating,
      reviewer_feedback: feedback,
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId);
  if (assignUpdateError) throw assignUpdateError;

  // Award XP and check rank-up
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('xp, rank')
    .eq('id', studentId)
    .single();
  if (profileError) throw profileError;

  const oldXp = profile?.xp ?? 0;
  const newXp = oldXp + xpAwarded;
  const oldRank = xpToRank(oldXp);
  const newRank = xpToRank(newXp);
  const rankUp = newRank !== oldRank;

  const { error: xpError } = await supabase
    .from('profiles')
    .update({
      xp: newXp,
      ...(rankUp ? { rank: newRank, rank_up: true } : {}),
    })
    .eq('id', studentId);
  if (xpError) throw xpError;

  // Deduct coins from company wallet
  const { error: walletDeductError } = await supabase.rpc('deduct_coins', {
    p_company_id: companyId,
    p_amount: coinReward,
  });
  if (walletDeductError) throw walletDeductError;

  // Add student's share of coins
  const { error: coinError } = await supabase.rpc('award_coins', {
    p_user_id: studentId,
    p_amount: studentCut,
  });
  if (coinError) throw coinError;

  // Platform cut wallet transaction
  const { error: platformTxError } = await supabase
    .from('wallet_transactions')
    .insert({
      from_id: companyId,
      amount: platformCut,
      type: 'platform_cut',
      mission_assignment_id: assignmentId,
      note: `Platform 20% cut — mission: ${mission.title ?? assignmentId}`,
    });
  if (platformTxError) throw platformTxError;

  // Student wallet transaction
  const { error: studentTxError } = await supabase
    .from('wallet_transactions')
    .insert({
      from_id: companyId,
      to_id: studentId,
      amount: studentCut,
      type: 'reward',
      mission_assignment_id: assignmentId,
      note: `Mission reward — ${mission.title ?? assignmentId}`,
    });
  if (studentTxError) throw studentTxError;

  // Auto-insert portfolio entry
  const { error: portfolioError } = await supabase
    .from('portfolio_entries')
    .insert({
      user_id: studentId,
      track: mission.track,
      title: mission.title,
      description: feedback || '',
      is_public: true,
    });
  if (portfolioError) {
    console.warn('Portfolio insert failed (non-fatal):', portfolioError);
  } else {
    const { awardCustomReward } = await import('./xpService');
    await awardCustomReward(
      studentId,
      'portfolio_publish',
      { xp: 25, coins: 5 },
      {
        storageKey: `portfolio_publish_${studentId}_${assignmentId}`,
        subject: mission.track ?? null,
        coinReason: 'portfolio_publish',
      },
    ).catch(() => {});
  }
}

/**
 * Approve a pending guild membership application.
 * @param {string} companyId
 * @param {string} guildId
 * @param {string} userId
 */
export async function approveApplication(companyId, guildId, userId) {
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('company_id, max_members')
    .eq('id', guildId)
    .single();

  if (guildError || !guild) throw new Error('Guild not found');
  if (guild.company_id !== companyId) throw new Error('Not the guild owner');

  // Count current active members
  const { count, error: countError } = await supabase
    .from('guild_members')
    .select('id', { count: 'exact', head: true })
    .eq('guild_id', guildId)
    .eq('status', 'active');

  if (countError) throw countError;
  if (count >= guild.max_members) throw new Error('Guild full');

  const { error } = await supabase
    .from('guild_members')
    .update({ status: 'active' })
    .eq('guild_id', guildId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Reject a pending guild membership application.
 * @param {string} companyId
 * @param {string} guildId
 * @param {string} userId
 */
export async function rejectApplication(companyId, guildId, userId) {
  const { data: guild, error: guildError } = await supabase
    .from('guilds')
    .select('company_id')
    .eq('id', guildId)
    .single();

  if (guildError || !guild) throw new Error('Guild not found');
  if (guild.company_id !== companyId) throw new Error('Not the guild owner');

  const { error } = await supabase
    .from('guild_members')
    .update({ status: 'rejected' })
    .eq('guild_id', guildId)
    .eq('user_id', userId);

  if (error) throw error;
}
