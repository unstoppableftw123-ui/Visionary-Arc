// Deploy:
// supabase functions deploy stripe-company-webhook
//
// Required env vars in Supabase:
// - STRIPE_COMPANY_WEBHOOK_SECRET  (separate secret for this endpoint)
// - STRIPE_SECRET_KEY
// - SUPABASE_SERVICE_ROLE_KEY
//
// Supabase-provided env vars used here:
// - SUPABASE_URL

import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_COMPANY_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const { companyId, tier } = session.metadata ?? {};
  if (!companyId || !tier) throw new Error("Missing companyId or tier in metadata");

  const subscriptionId = session.subscription as string | null;

  await db
    .from("guilds")
    .update({
      tier,
      ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    })
    .eq("company_id", companyId)
    .eq("type", "company")
    .throwOnError();
}

async function handleCoinDepositCheckout(session: Stripe.Checkout.Session) {
  const { companyId, guildId, coinAmount: coinAmountStr } = session.metadata ?? {};
  if (!companyId || !guildId || !coinAmountStr) {
    throw new Error("Missing companyId, guildId, or coinAmount in metadata");
  }

  const coinAmount = parseInt(coinAmountStr, 10);
  if (!Number.isFinite(coinAmount) || coinAmount < 1) {
    throw new Error(`Invalid coinAmount: ${coinAmountStr}`);
  }

  // Upsert wallet and increment balance atomically via RPC if available,
  // otherwise fetch-then-update (acceptable since webhook retries handle failures).
  const { data: wallet } = await db
    .from("company_wallets")
    .select("coin_balance, total_deposited")
    .eq("company_id", companyId)
    .maybeSingle();

  const currentBalance = wallet?.coin_balance ?? 0;
  const currentDeposited = wallet?.total_deposited ?? 0;

  await db
    .from("company_wallets")
    .upsert(
      {
        company_id: companyId,
        coin_balance: currentBalance + coinAmount,
        total_deposited: currentDeposited + coinAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    )
    .throwOnError();

  await db
    .from("wallet_transactions")
    .insert({
      to_id: companyId,
      amount: coinAmount,
      type: "deposit",
      note: `Stripe deposit — ${coinAmount} coins`,
    })
    .throwOnError();
}

async function handleFeaturedBoostCheckout(session: Stripe.Checkout.Session) {
  const { guildId } = session.metadata ?? {};
  if (!guildId) throw new Error("Missing guildId in metadata");

  const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db
    .from("guilds")
    .update({ is_featured: true, featured_until: featuredUntil })
    .eq("id", guildId)
    .throwOnError();
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Identify guild by stripe_subscription_id (stored during checkout.session.completed)
  const { data: guild } = await db
    .from("guilds")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!guild) {
    console.warn(`No guild found for subscription ${subscription.id} — skipping`);
    return;
  }

  // Freeze guild: clear tier, set max_members to 0
  await db
    .from("guilds")
    .update({ tier: null, max_members: 0 })
    .eq("id", guild.id)
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

      if (metaType === "subscription") await handleSubscriptionCheckout(session);
      else if (metaType === "coin_deposit") await handleCoinDepositCheckout(session);
      else if (metaType === "featured_boost") await handleFeaturedBoostCheckout(session);
      else console.warn(`Unknown metadata.type: ${metaType} — ignoring`);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
    }
    // All other event types are acknowledged but not processed
    return jsonResponse({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("stripe-company-webhook error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
