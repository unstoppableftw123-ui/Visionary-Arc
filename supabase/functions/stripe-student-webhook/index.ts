// Deploy:
// supabase functions deploy stripe-student-webhook
//
// Required env vars in Supabase:
// - STRIPE_STUDENT_WEBHOOK_SECRET  (separate secret for this endpoint)
// - STRIPE_SECRET_KEY
// - SUPABASE_SERVICE_ROLE_KEY
//
// Supabase-provided env vars used here:
// - SUPABASE_URL

import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_STUDENT_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Season end date: 90 days from activation
function seasonEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString();
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleSeasonPass(session: Stripe.Checkout.Session) {
  const { userId } = session.metadata ?? {};
  if (!userId) throw new Error("Missing userId in metadata");

  const { data: profile, error: fetchError } = await db
    .from("profiles")
    .select("badges")
    .eq("id", userId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const currentBadges: string[] = profile?.badges ?? [];
  const seasonBadge = `season_pass_${new Date().getFullYear()}_q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const updatedBadges = currentBadges.includes(seasonBadge)
    ? currentBadges
    : [...currentBadges, seasonBadge];

  await db
    .from("profiles")
    .update({
      season_pass_active: true,
      season_pass_expires_at: seasonEndDate(),
      xp_multiplier: 1.25,
      badges: updatedBadges,
    })
    .eq("id", userId)
    .throwOnError();
}

async function handleCoinTopUp(session: Stripe.Checkout.Session) {
  const { userId, coins: coinsStr } = session.metadata ?? {};
  if (!userId || !coinsStr) throw new Error("Missing userId or coins in metadata");

  const coins = parseInt(coinsStr, 10);
  if (!Number.isFinite(coins) || coins < 1) throw new Error(`Invalid coins: ${coinsStr}`);

  const { data: profile, error: fetchError } = await db
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const currentCoins: number = profile?.coins ?? 0;
  const balanceAfter = currentCoins + coins;

  await db
    .from("profiles")
    .update({ coins: balanceAfter })
    .eq("id", userId)
    .throwOnError();

  await db
    .from("transactions")
    .insert({
      user_id: userId,
      amount: coins,
      reason: `coin_top_up:${session.metadata?.packId ?? "unknown"}`,
      balance_after: balanceAfter,
    })
    .throwOnError();
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Missing Stripe signature" }, 400);

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return jsonResponse({ error: message }, 400);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metaType = session.metadata?.type;

      if (metaType === "season_pass") await handleSeasonPass(session);
      else if (metaType === "coin_top_up") await handleCoinTopUp(session);
      else console.warn(`Unknown metadata.type: ${metaType} — ignoring`);
    }
    return jsonResponse({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("stripe-student-webhook error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
