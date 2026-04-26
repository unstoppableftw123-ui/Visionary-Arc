// Deploy:
// supabase functions deploy stripe-company-checkout
//
// Required env vars in Supabase:
// - STRIPE_SECRET_KEY
// - STRIPE_PRICE_BASIC      (recurring $49/mo price ID from Stripe dashboard)
// - STRIPE_PRICE_ELITE      (recurring $149/mo price ID from Stripe dashboard)
// - FRONTEND_URL            (e.g. https://your-app.vercel.app)
//
// Supabase-provided env vars used here:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const priceBasic = Deno.env.get("STRIPE_PRICE_BASIC")!;
const priceElite = Deno.env.get("STRIPE_PRICE_ELITE")!;
const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  // Authenticate caller via JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { type } = body;

  try {
    if (type === "subscription") {
      const tier = body.tier as "basic" | "elite";
      if (tier !== "basic" && tier !== "elite") {
        return jsonResponse({ error: "tier must be 'basic' or 'elite'" }, 400);
      }

      const priceId = tier === "basic" ? priceBasic : priceElite;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${frontendUrl}/company/dashboard?subscribed=true`,
        cancel_url: `${frontendUrl}/company/dashboard`,
        metadata: {
          type: "subscription",
          companyId: body.companyId as string,
          tier,
        },
      });

      return jsonResponse({ url: session.url });
    }

    if (type === "coin_deposit") {
      const coinAmount = Number(body.coinAmount);
      if (!Number.isInteger(coinAmount) || coinAmount < 500) {
        return jsonResponse({ error: "Minimum deposit is 500 coins" }, 400);
      }

      // 1 coin = $0.02 → coinAmount * 2 cents
      const unitAmount = coinAmount * 2;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              product_data: {
                name: `${coinAmount} Coin Budget Deposit`,
                description: `Adds ${coinAmount} coins to your guild wallet`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/company/dashboard?deposited=true`,
        cancel_url: `${frontendUrl}/company/dashboard`,
        metadata: {
          type: "coin_deposit",
          companyId: body.companyId as string,
          guildId: body.guildId as string,
          coinAmount: String(coinAmount),
        },
      });

      return jsonResponse({ url: session.url });
    }

    if (type === "featured_boost") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: 2900, // $29.00
              product_data: {
                name: "Guild Featured Boost (7 days)",
                description: "Your guild appears at the top of the discovery feed for 7 days",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/company/dashboard?featured=true`,
        cancel_url: `${frontendUrl}/company/dashboard`,
        metadata: {
          type: "featured_boost",
          guildId: body.guildId as string,
        },
      });

      return jsonResponse({ url: session.url });
    }

    return jsonResponse({ error: `Unknown checkout type: ${type}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout creation failed";
    return jsonResponse({ error: message }, 500);
  }
});
