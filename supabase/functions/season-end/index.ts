// Deploy:
// supabase functions deploy season-end
//
// Schedule via pg_cron — set this to fire at seasons.end_date.
// Easiest approach: call from a pg_cron job that checks daily:
//
// select cron.schedule('season-end-check', '0 0 * * *', $$
//   select net.http_post(
//     url := '<SUPABASE_URL>/functions/v1/season-end',
//     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
//   )
//   where exists (
//     select 1 from seasons where is_active = true and end_date <= now()
//   );
// $$);
//
// Required env vars:
// - SUPABASE_URL (auto-provided)
// - SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEASON_BADGE_NAMES: Record<number, string> = {
  1: "season_champion",
  2: "season_runner_up",
  3: "season_third_place",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req) => {
  try {
    // 1. Find the active season that has ended
    const { data: season, error: seasonErr } = await supabase
      .from("seasons")
      .select("id, name, end_date")
      .eq("is_active", true)
      .lte("end_date", new Date().toISOString())
      .single();

    if (seasonErr || !season) {
      return jsonResponse({ ok: true, message: "No season to end" });
    }

    const seasonId = season.id;

    // 2. Snapshot top 10 into hall_of_fame
    const { data: topEntries, error: topErr } = await supabase
      .from("leaderboard_seasons")
      .select("user_id, season_score")
      .eq("season_id", seasonId)
      .order("season_score", { ascending: false })
      .limit(10);

    if (topErr) throw new Error(topErr.message);

    // Fetch rank info for each top user
    const userIds = (topEntries ?? []).map((e) => e.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, xp")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const hofRows = (topEntries ?? []).map((entry, idx) => {
      const position = idx + 1;
      const profile = profileMap.get(entry.user_id);
      const xp = profile?.xp ?? 0;
      const rank =
        xp >= 15000 ? "Elite" :
        xp >= 6000  ? "Pro" :
        xp >= 2000  ? "Creator" :
        xp >= 500   ? "Builder" : "Beginner";

      return {
        season_id: seasonId,
        user_id: entry.user_id,
        position,
        season_score: entry.season_score,
        rank_achieved: rank,
      };
    });

    if (hofRows.length > 0) {
      const { error: hofErr } = await supabase
        .from("hall_of_fame")
        .insert(hofRows);
      if (hofErr) throw new Error(`hall_of_fame insert: ${hofErr.message}`);
    }

    // 3. Award exclusive badges to top 3
    for (const row of hofRows.slice(0, 3)) {
      const badge = SEASON_BADGE_NAMES[row.position];
      if (!badge) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("badges")
        .eq("id", row.user_id)
        .single();

      const badges: string[] = profile?.badges ?? [];
      if (!badges.includes(badge)) {
        await supabase
          .from("profiles")
          .update({ badges: [...badges, badge] })
          .eq("id", row.user_id);
      }
    }

    // 4. Mark current season inactive
    const { error: closeErr } = await supabase
      .from("seasons")
      .update({ is_active: false })
      .eq("id", seasonId);

    if (closeErr) throw new Error(closeErr.message);

    // 5. Insert new season starting now, ending in 90 days
    const newStart = new Date().toISOString();
    const newEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const seasonNumber = parseInt(season.name.replace(/\D/g, ""), 10) || 1;

    const { error: newSeasonErr } = await supabase.from("seasons").insert({
      name: `Season ${seasonNumber + 1}`,
      start_date: newStart,
      end_date: newEnd,
      is_active: true,
    });

    if (newSeasonErr) throw new Error(newSeasonErr.message);

    // 6. Log in resets_log
    await supabase.from("resets_log").insert({
      season_id: seasonId,
      reset_type: "season_end",
      users_affected: hofRows.length,
      decayed_count: 0,
    });

    return jsonResponse({
      ok: true,
      ended_season: seasonId,
      hall_of_fame_count: hofRows.length,
      badges_awarded: Math.min(hofRows.length, 3),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
