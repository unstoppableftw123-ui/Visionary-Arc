import { supabase } from "./supabaseClient";

export interface ProfileLeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  school: string | null;
  xp: number;
  coins: number;
  streak: number;
  level: number;
}

/** Top 100 profiles ordered by XP (descending). */
export async function getProfilesLeaderboard(
  orderBy: "xp" | "coins" | "streak" = "xp"
): Promise<ProfileLeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar, school, xp, coins, streak, level")
    .order(orderBy, { ascending: false })
    .limit(100);

  if (error) {
    console.error("getProfilesLeaderboard error:", error);
    return [];
  }

  return (data ?? []) as ProfileLeaderboardEntry[];
}

export interface LeaderboardEntry {
  user_id: string;
  season_score: number;
  weekly_score: number;
  last_active: string | null;
  profiles: {
    name: string;
    avatar: string | null;
    school: string | null;
    xp: number;
    level: number;
    streak: number;
  };
}

export interface HallOfFameEntry {
  id: string;
  season_id: string;
  user_id: string;
  position: number;
  season_score: number;
  rank_achieved: string;
  captured_at: string;
  seasons: { name: string };
  profiles: {
    name: string;
    avatar: string | null;
  };
}

/** Top 100 by weekly_score for the active season. */
export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!season) return [];

  const { data, error } = await supabase
    .from("leaderboard_seasons")
    .select(
      `user_id, season_score, weekly_score, last_active,
       profiles ( name, avatar, school, xp, level, streak )`
    )
    .eq("season_id", season.id)
    .order("weekly_score", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getWeeklyLeaderboard error:", error);
    return [];
  }

  return (data ?? []) as unknown as LeaderboardEntry[];
}

/** Top 100 by season_score for the active season. */
export async function getSeasonLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!season) return [];

  const { data, error } = await supabase
    .from("leaderboard_seasons")
    .select(
      `user_id, season_score, weekly_score, last_active,
       profiles ( name, avatar, school, xp, level, streak )`
    )
    .eq("season_id", season.id)
    .order("season_score", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getSeasonLeaderboard error:", error);
    return [];
  }

  return (data ?? []) as unknown as LeaderboardEntry[];
}

/** All hall of fame entries across all seasons, newest first. */
export async function getHallOfFame(): Promise<HallOfFameEntry[]> {
  const { data, error } = await supabase
    .from("hall_of_fame")
    .select(
      `id, season_id, user_id, position, season_score, rank_achieved, captured_at,
       seasons ( name ),
       profiles ( name, avatar )`
    )
    .order("captured_at", { ascending: false });

  if (error) {
    console.error("getHallOfFame error:", error);
    return [];
  }

  return (data ?? []) as unknown as HallOfFameEntry[];
}

/**
 * Called after any XP-awarding event (mission approval, study activity, etc.).
 * Upserts the user's row in leaderboard_seasons for the current active season,
 * incrementing both season_score and weekly_score.
 */
export async function addSeasonXP(userId: string, xpGained: number): Promise<void> {
  if (!userId || xpGained <= 0) return;

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!season) return;

  // Upsert with increment — use RPC if available, else fetch-then-update
  const { data: existing } = await supabase
    .from("leaderboard_seasons")
    .select("id, season_score, weekly_score")
    .eq("user_id", userId)
    .eq("season_id", season.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("leaderboard_seasons")
      .update({
        season_score: existing.season_score + xpGained,
        weekly_score: existing.weekly_score + xpGained,
        last_active: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("leaderboard_seasons").insert({
      user_id: userId,
      season_id: season.id,
      season_score: xpGained,
      weekly_score: xpGained,
      last_active: new Date().toISOString(),
    });
  }
}
