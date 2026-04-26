// Deploy:
// supabase functions deploy weekly-reset
//
// Schedule via pg_cron (run in Supabase SQL editor):
// select cron.schedule('weekly-reset', '0 0 * * 1', $$
//   select net.http_post(
//     url := '<SUPABASE_URL>/functions/v1/weekly-reset',
//     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req) => {
  try {
    // 1. Fetch the active season
    const { data: season, error: seasonErr } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (seasonErr || !season) {
      return jsonResponse({ error: "No active season found" }, 404);
    }

    const seasonId = season.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch all users in this season
    const { data: entries, error: entriesErr } = await supabase
      .from("leaderboard_seasons")
      .select("id, user_id, weekly_score, last_active")
      .eq("season_id", seasonId);

    if (entriesErr) throw new Error(entriesErr.message);

    let decayedCount = 0;

    // 3. Apply soft decay to inactive users, then reset weekly_score to 0
    const updates = (entries ?? []).map((entry) => {
      const wasInactive =
        !entry.last_active || entry.last_active < sevenDaysAgo;

      if (wasInactive && entry.weekly_score > 0) {
        decayedCount++;
        // Decay is logged but weekly_score is always reset to 0 afterward
      }

      return { id: entry.id, weekly_score: 0 };
    });

    // Batch upsert — update weekly_score to 0 for all
    if (updates.length > 0) {
      const { error: updateErr } = await supabase
        .from("leaderboard_seasons")
        .upsert(updates, { onConflict: "id" });

      if (updateErr) throw new Error(updateErr.message);
    }

    // 4. Log the reset
    const { error: logErr } = await supabase.from("resets_log").insert({
      season_id: seasonId,
      reset_type: "weekly",
      users_affected: updates.length,
      decayed_count: decayedCount,
    });

    if (logErr) console.error("Failed to write resets_log:", logErr.message);

    return jsonResponse({
      ok: true,
      season_id: seasonId,
      users_affected: updates.length,
      decayed_count: decayedCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
