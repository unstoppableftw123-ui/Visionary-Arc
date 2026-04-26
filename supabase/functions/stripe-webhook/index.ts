// Deploy:
// supabase functions deploy stripe-webhook
//
// Required env vars in Supabase:
// - STRIPE_WEBHOOK_SECRET
// - STRIPE_SECRET_KEY
// - SUPABASE_SERVICE_ROLE_KEY
//
// Supabase-provided env vars used here:
// - SUPABASE_URL

import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!stripeWebhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ProductCode =
  | "coins_100"
  | "coins_500"
  | "coins_2000"
  | "founder_bronze"
  | "founder_silver"
  | "founder_gold";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function addCoins(userId: string, amount: number) {
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("coins")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load user coins: ${fetchError.message}`);
  }

  const nextCoins = (user?.coins ?? 0) + amount;

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ coins: nextCoins })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Failed to update coins: ${updateError.message}`);
  }
}

async function applyPurchase(userId: string, product: ProductCode) {
  switch (product) {
    case "coins_100":
      await addCoins(userId, 100);
      return;
    case "coins_500":
      await addCoins(userId, 500);
      return;
    case "coins_2000":
      await addCoins(userId, 2000);
      return;
    case "founder_bronze": {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          founder_tier: "bronze",
          is_premium: true,
        })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to apply bronze founder tier: ${error.message}`);
      }

      return;
    }
    case "founder_silver": {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          founder_tier: "silver",
          is_premium: true,
        })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to apply silver founder tier: ${error.message}`);
      }

      return;
    }
    case "founder_gold": {
      const { data: user, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("coins")
        .eq("id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to load user for gold tier: ${fetchError.message}`);
      }

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          founder_tier: "gold",
          is_premium: true,
          coins: (user?.coins ?? 0) + 10000,
        })
        .eq("id", userId);

      if (updateError) {
        throw new Error(`Failed to apply gold founder tier: ${updateError.message}`);
      }

      return;
    }
    default:
      throw new Error(`Unsupported product: ${product}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return jsonResponse({ error: "Missing Stripe signature" }, 400);
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return jsonResponse({ error: message }, 400);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const product = session.metadata?.product as ProductCode | undefined;

      if (!userId) {
        throw new Error("Missing metadata.userId on checkout session");
      }

      if (!product) {
        throw new Error("Missing metadata.product on checkout session");
      }

      await applyPurchase(userId, product);
    }

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    return jsonResponse({ error: message }, 500);
  }
});
