/**
 * rewardsProgram.js — Single source of truth for level-based rewards.
 *
 * Each entry is a milestone the user reaches as they level up.
 * Import REWARDS wherever you need to check, display, or award level rewards.
 */

// Founder pass multipliers STACK with level rewards:
// - Seed: base level rewards as normal
// - Bronze: +5 coins on every level reward
// - Silver: 2× coins on every level reward
// - Gold: 3× coins on every level reward
// Example: Level 10 reward is 150 coins base.
// Gold founder receives 450 coins instead.
// AI call bonuses do NOT stack with founder
// pass AI allowances — take whichever is higher.

export const REWARDS = [
  {
    level: 1,
    title: "Newcomer",
    emoji: null,
    isMilestone: false,
    coins: 100,
    note: "Signup bonus — awarded automatically on account creation",
    unlocks: ["Access to daily missions"],
    badge: null,
    bonuses: ["6 AI calls/day"],
    specials: [],
  },
  {
    level: 3,
    title: "Curious",
    emoji: null,
    isMilestone: false,
    coins: 25,
    note: null,
    unlocks: ["2nd subject access"],
    badge: '"Curious" badge on profile',
    bonuses: [],
    specials: [],
  },
  {
    level: 5,
    title: "Scholar",
    emoji: null,
    isMilestone: false,
    coins: 50,
    note: null,
    unlocks: ["Custom profile bio"],
    badge: '"Scholar" badge',
    bonuses: ["+1 AI call/day permanently (now 7/day)"],
    specials: [],
  },
  {
    level: 8,
    title: "Dedicated",
    emoji: null,
    isMilestone: false,
    coins: 75,
    note: null,
    unlocks: ["Study Rooms access"],
    badge: '"Dedicated" badge',
    bonuses: ["Access to all competitions"],
    specials: [],
  },
  {
    level: 10,
    title: "Rising Star",
    emoji: "⭐",
    isMilestone: true,
    coins: 150,
    note: null,
    unlocks: ["All 5 subjects"],
    badge: 'Animated "Rising Star" badge',
    bonuses: ["+2 AI calls/day (now 9/day)"],
    specials: ["Profile glow effect unlocked"],
  },
  {
    level: 15,
    title: "Achiever",
    emoji: null,
    isMilestone: false,
    coins: 200,
    note: null,
    unlocks: ["Notes Studio full access"],
    badge: '"Achiever" badge',
    bonuses: ["Leaderboard visibility boost"],
    specials: [],
  },
  {
    level: 20,
    title: "Expert",
    emoji: "🎯",
    isMilestone: true,
    coins: 300,
    note: null,
    unlocks: ["Custom avatar frame (free basic one)"],
    badge: 'Animated "Expert" badge',
    bonuses: ["+3 AI calls/day (now 12/day free tier)"],
    specials: ["Investor profile visibility unlocked"],
  },
  {
    level: 25,
    title: "Elite",
    emoji: null,
    isMilestone: false,
    coins: 400,
    note: null,
    unlocks: ["Priority in competition matchmaking"],
    badge: '"Elite" badge with shimmer',
    bonuses: ["Coin decay protection (coins last 120 days instead of 90)"],
    specials: [],
  },
  {
    level: 30,
    title: "Master",
    emoji: "👑",
    isMilestone: true,
    coins: 500,
    note: null,
    unlocks: ["Create own study servers"],
    badge: 'Animated crown "Master" badge',
    bonuses: ["+5 AI calls/day (now 17/day free tier)"],
    specials: ['"Master" title shown next to name everywhere'],
  },
  {
    level: 40,
    title: "Legend",
    emoji: "🔥",
    isMilestone: true,
    coins: 750,
    note: null,
    unlocks: ["Exclusive Legend avatar frame"],
    badge: 'Animated flame "Legend" badge',
    bonuses: ["Early access to all new features (same as Seed founder but earned not paid)"],
    specials: ["Legend profile background unlocked"],
  },
  {
    level: 50,
    title: "EduVault OG",
    emoji: "🏆",
    isMilestone: true,
    coins: 1000,
    note: "Less than 1% of users will reach this",
    unlocks: ["Permanent gold name color in app"],
    badge: 'Animated trophy "OG" badge',
    bonuses: [
      "Real Rewards early access (first to redeem when it launches)",
      "+10 AI calls/day forever (now 16/day)",
    ],
    specials: ["Name added to in-app Hall of Fame"],
  },
];

export const DEFAULT_CLASS_RANK_TITLES = {
  level1: "Rookie",
  level2: "Scholar",
  level3: "Elite",
  level4: "Master",
  level5: "Legend",
};

export const CLASS_RANK_LEVELS = [
  { key: "level1", minLevel: 1, label: "Levels 1-9" },
  { key: "level2", minLevel: 10, label: "Levels 10-19" },
  { key: "level3", minLevel: 20, label: "Levels 20-29" },
  { key: "level4", minLevel: 30, label: "Levels 30-39" },
  { key: "level5", minLevel: 40, label: "Levels 40+" },
];

const LEVEL_BADGE_META = {
  3: { id: "curious", icon: "🔎", color: "amber" },
  5: { id: "scholar", icon: "📘", color: "blue" },
  8: { id: "dedicated", icon: "💪", color: "emerald" },
  10: { id: "rising_star", icon: "⭐", color: "yellow" },
  15: { id: "achiever", icon: "🏅", color: "orange" },
  20: { id: "expert", icon: "🎯", color: "red" },
  25: { id: "elite", icon: "💎", color: "cyan" },
  30: { id: "master", icon: "👑", color: "violet" },
  40: { id: "legend", icon: "🔥", color: "rose" },
  50: { id: "eduvault_og", icon: "🏆", color: "amber" },
};

export const BADGES = [
  {
    id: "first_login",
    name: "First Login",
    description: "Created your Visionary Academy account.",
    icon: "🌱",
    color: "emerald",
    condition: { type: "account_created" },
  },
  ...REWARDS.filter((reward) => reward.badge).map((reward) => ({
    id: LEVEL_BADGE_META[reward.level]?.id ?? `level_${reward.level}`,
    name: reward.title,
    description: `Reach Level ${reward.level} to unlock the ${reward.title} badge.`,
    icon: LEVEL_BADGE_META[reward.level]?.icon ?? reward.emoji ?? "🏅",
    color: LEVEL_BADGE_META[reward.level]?.color ?? "amber",
    condition: { type: "level", level: reward.level },
  })),
];

export function getBadgeById(badgeId) {
  return BADGES.find((badge) => badge.id === badgeId) ?? null;
}

export function getEarnedBadgeMap(user) {
  return user?.badge_earned_at ?? {};
}

export function hasBadge(user, badgeId) {
  return Array.isArray(user?.badges) && user.badges.includes(badgeId);
}

export function isBadgeUnlocked(badge, stats) {
  if (!badge?.condition) return false;

  switch (badge.condition.type) {
    case "account_created":
      return Boolean(stats?.created_at || stats?.createdAt || stats?.user?.created_at);
    case "level":
      return (stats?.level ?? stats?.user?.level ?? 0) >= badge.condition.level;
    default:
      return false;
  }
}

export function getEligibleBadgeIds(stats) {
  return BADGES.filter((badge) => isBadgeUnlocked(badge, stats)).map((badge) => badge.id);
}

export function getNormalizedRankTitles(rankTitles = {}) {
  return CLASS_RANK_LEVELS.reduce((acc, { key }) => {
    const value = typeof rankTitles[key] === "string" ? rankTitles[key].trim() : "";
    acc[key] = value || DEFAULT_CLASS_RANK_TITLES[key];
    return acc;
  }, {});
}

export function getRankTitleForLevel(level, rankTitles = DEFAULT_CLASS_RANK_TITLES) {
  const resolvedTitles = getNormalizedRankTitles(rankTitles);
  const matchedRank = [...CLASS_RANK_LEVELS]
    .reverse()
    .find((entry) => level >= entry.minLevel);

  return resolvedTitles[matchedRank?.key || "level1"];
}

export function getXpForLevel(level) {
  if (level <= 1) return 0;

  let total = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += 100 + (currentLevel - 1) * 50;
  }
  return total;
}

export function getXpForNextLevel(level) {
  return 100 + (Math.max(1, level) - 1) * 50;
}

export function getLevelFromXp(xp = 0) {
  let level = 1;
  let remainingXp = Math.max(0, xp);
  let threshold = getXpForNextLevel(level);

  while (remainingXp >= threshold) {
    remainingXp -= threshold;
    level += 1;
    threshold = getXpForNextLevel(level);
  }

  return level;
}

/**
 * Returns the coins a founder earns at a given base reward.
 * Bronze is additive (+5), Silver/Gold are multiplicative.
 */
export function founderCoins(baseCoins, founderTier) {
  if (!founderTier) return baseCoins;
  switch (founderTier) {
    case "gold":   return baseCoins * 3;
    case "silver": return baseCoins * 2;
    case "bronze": return baseCoins + 5;
    default:       return baseCoins; // seed: base as normal
  }
}

/** Returns the next reward milestone above currentLevel, or null. */
export function getNextMilestone(currentLevel) {
  return REWARDS.find((r) => r.level > currentLevel) ?? null;
}

/** Returns the latest reward milestone at or below currentLevel, or null. */
export function getLatestReachedMilestone(currentLevel) {
  return [...REWARDS].reverse().find((r) => r.level <= currentLevel) ?? null;
}

/** Returns all upcoming reward milestones above currentLevel. */
export function getUpcomingRewards(currentLevel) {
  return REWARDS.filter((r) => r.level > currentLevel);
}
