/**
 * founder.js — Single source of truth for all founder-tier logic.
 *
 * Import this wherever you need to gate features, render badges, or display
 * tier-specific copy.  Nothing here makes network calls; it only reads the
 * `user` object that lives in AuthContext.
 */

// ─── Ordered tier list (lowest → highest) ────────────────────────────────────
export const TIER_ORDER = ["seed", "bronze", "silver", "gold"];

// ─── Visual + copy metadata per tier ─────────────────────────────────────────
export const TIER_META = {
  seed: {
    label:       "Seed Founder",
    emoji:       "🌱",
    gradient:    "from-emerald-400 to-teal-500",
    text:        "text-emerald-400",
    bg:          "bg-emerald-400/10",
    border:      "border-emerald-400/30",
    hoverBorder: "hover:border-emerald-400/70",
    glow:        "shadow-emerald-500/25",
    ringColor:   "ring-emerald-400/50",
    // Feature flags
    unlimitedGames:    false,
    gamesPerWeek:      10,
    unlimitedAI:       true,
    hideAds:           true,
    skinCount:         0,
    coinsOnLaunch:     100,
    allBattlePasses:   false,
    revenueShare:      false,
    nameInCredits:     false,
    perks: [
      "Exclusive Seed founder badge",
      "10 games per week — forever",
      "100 coins on launch day",
      "Early access to every new feature",
      "Private founders community",
    ],
  },
  bronze: {
    label:       "Bronze Founder",
    emoji:       "🛡️",
    gradient:    "from-amber-600 to-orange-500",
    text:        "text-amber-500",
    bg:          "bg-amber-500/10",
    border:      "border-amber-500/30",
    hoverBorder: "hover:border-amber-500/70",
    glow:        "shadow-orange-500/25",
    ringColor:   "ring-amber-500/50",
    unlimitedGames:    true,
    gamesPerWeek:      Infinity,
    unlimitedAI:       true,
    hideAds:           true,
    skinCount:         5,
    coinsOnLaunch:     500,
    allBattlePasses:   false,
    revenueShare:      false,
    nameInCredits:     false,
    perks: [
      "Unlimited games forever",
      "5 exclusive launch skins",
      "500 coins on launch day",
      "Bronze animated profile frame",
      "Priority support queue",
    ],
  },
  silver: {
    label:       "Silver Founder",
    emoji:       "⭐",
    gradient:    "from-slate-300 to-slate-500",
    text:        "text-slate-300",
    bg:          "bg-slate-400/10",
    border:      "border-slate-400/40",
    hoverBorder: "hover:border-slate-300",
    glow:        "shadow-slate-400/30",
    ringColor:   "ring-slate-400/50",
    unlimitedGames:    true,
    gamesPerWeek:      Infinity,
    unlimitedAI:       true,
    hideAds:           true,
    skinCount:         20,
    coinsOnLaunch:     2000,
    allBattlePasses:   true,
    revenueShare:      false,
    nameInCredits:     false,
    perks: [
      "20 exclusive launch skins",
      "2,000 coins on launch day",
      "All current & future battle passes",
      "Silver animated profile frame",
      "2× XP boost for 30 days post-launch",
    ],
  },
  gold: {
    label:       "Gold Founder",
    emoji:       "👑",
    gradient:    "from-yellow-400 to-amber-500",
    text:        "text-yellow-400",
    bg:          "bg-yellow-400/10",
    border:      "border-yellow-400/40",
    hoverBorder: "hover:border-yellow-400/80",
    glow:        "shadow-yellow-500/30",
    ringColor:   "ring-yellow-400/50",
    unlimitedGames:    true,
    gamesPerWeek:      Infinity,
    unlimitedAI:       true,
    hideAds:           true,
    skinCount:         30,
    coinsOnLaunch:     10000,
    allBattlePasses:   true,
    revenueShare:      true,
    nameInCredits:     true,
    perks: [
      "30 exclusive launch skins",
      "10,000 coins on launch day",
      "Name in the credits forever",
      "2% revenue share on referrals",
      "Gold animated profile frame",
      "Direct line to the founding team",
    ],
  },
};

// ─── Core utilities ───────────────────────────────────────────────────────────

/** Returns true if the user holds any founder tier. */
export function isFounder(user) {
  return !!(user?.founder_tier && TIER_ORDER.includes(user.founder_tier));
}

/** Returns the tier string ("seed" | "bronze" | "silver" | "gold") or null. */
export function getFounderTier(user) {
  return isFounder(user) ? user.founder_tier : null;
}

/** Returns the full TIER_META entry for the user's tier, or null. */
export function getFounderMeta(user) {
  const tier = getFounderTier(user);
  return tier ? TIER_META[tier] : null;
}

/** Returns the numeric tier index (0-3) or -1 for non-founders. */
export function getTierIndex(user) {
  const tier = getFounderTier(user);
  return tier ? TIER_ORDER.indexOf(tier) : -1;
}

/** Returns true if the user can upgrade to a higher tier. */
export function canUpgrade(user) {
  const idx = getTierIndex(user);
  return idx < TIER_ORDER.length - 1; // non-founders (idx=-1) can also upgrade
}

/** Returns the next tier above the user's current tier, or null for Gold. */
export function nextTier(user) {
  const idx = getTierIndex(user);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

// ─── Feature gates ────────────────────────────────────────────────────────────

/** Founders never see upgrade banners / ads. */
export function shouldHideAds(user) {
  return isFounder(user);
}

/** Unlimited AI generation for all founders. */
export function hasUnlimitedAI(user) {
  return getFounderMeta(user)?.unlimitedAI ?? false;
}

/** True for Bronze+ (Seed is capped at 10 games/week). */
export function hasUnlimitedGames(user) {
  return getFounderMeta(user)?.unlimitedGames ?? false;
}

/** Number of games per week; Infinity for Bronze+. */
export function gamesPerWeek(user) {
  return getFounderMeta(user)?.gamesPerWeek ?? 0;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Formats the founder_paid_at ISO string to a readable date, e.g. "Jan 15, 2025". */
export function formatPurchaseDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    });
  } catch {
    return null;
  }
}
