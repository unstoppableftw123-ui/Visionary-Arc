import axios from "axios";
import { toast } from "sonner";
import { BADGES, getBadgeById, getEligibleBadgeIds } from "../data/rewardsProgram";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

function mergeAwardIntoUser(user, badgeId, earnedAt) {
  if (!user) return user;

  const nextBadges = Array.isArray(user.badges) ? user.badges : [];
  const nextEarnedAt = user.badge_earned_at ? { ...user.badge_earned_at } : {};

  if (!nextBadges.includes(badgeId)) {
    nextBadges.push(badgeId);
  }
  nextEarnedAt[badgeId] = nextEarnedAt[badgeId] || earnedAt;

  return {
    ...user,
    badges: nextBadges,
    badge_earned_at: nextEarnedAt,
  };
}

export async function awardBadge(userId, badgeId) {
  const { data } = await axios.post(`${API_BASE_URL}/api/badges/award`, { userId, badgeId });
  return data;
}

export async function checkAndAwardBadges({ user, stats, onUserUpdate } = {}) {
  if (!user?.user_id) {
    return { unlocked: [], user };
  }

  const badgeIds = getEligibleBadgeIds({ ...stats, user });
  const unlocked = [];
  let nextUser = user;

  for (const badgeId of badgeIds) {
    if (Array.isArray(nextUser?.badges) && nextUser.badges.includes(badgeId)) {
      continue;
    }

    const result = await awardBadge(nextUser.user_id, badgeId);
    const badge = result?.badge || getBadgeById(badgeId);
    const earnedAt = result?.earnedAt || new Date().toISOString();

    nextUser = result?.user ? result.user : mergeAwardIntoUser(nextUser, badgeId, earnedAt);
    if (result?.awarded !== false) {
      unlocked.push({ badge, earnedAt });
    }
  }

  if (unlocked.length > 0 && typeof onUserUpdate === "function") {
    onUserUpdate(nextUser);
  }

  return { unlocked, user: nextUser };
}

export function showBadgeUnlockToast(badge) {
  if (!badge) return;

  toast.success(`${badge.name} unlocked!`, {
    description: badge.description,
    icon: <span className="text-lg leading-none">{badge.icon}</span>,
    position: "bottom-right",
  });
}

export function getBadgeColorClasses(color, unlocked) {
  if (!unlocked) {
    return "bg-muted text-muted-foreground border-border";
  }

  switch (color) {
    case "emerald":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "blue":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "yellow":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "orange":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "red":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "cyan":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    case "violet":
      return "bg-orange-600/15 text-orange-400 border-orange-500/30";
    case "rose":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "amber":
    default:
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }
}

export { BADGES };
