// Deploy:
// supabase functions deploy stripe-student-checkout
//
// Required env vars in Supabase:
// - STRIPE_SECRET_KEY
// - STRIPE_SEASON_PASS_PRICE_ID   (one-time $9.99 price from Stripe dashboard)
// - FRONTEND_URL                  (e.g. https://your-app.vercel.app)
//
// Supabase-provided env vars used here:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const seasonPassPriceId = Deno.env.get("STRIPE_SEASON_PASS_PRICE_ID");
const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

const COIN_PACKS = {
  starter:  { coins: 200,  unitAmount:  399, label: "Starter Coin Pack (200 coins)" },
  standard: { coins: 600,  unitAmount:  999, label: "Standard Coin Pack (600 coins)" },
  pro:      { coins: 1500, unitAmount: 1999, label: "Pro Coin Pack (1,500 coins)" },
} as const;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

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
    if (type === "season_pass") {
      if (!seasonPassPriceId) {
        // Fallback: create price dynamically if no price ID configured
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: 999, // $9.99
                product_data: {
                  name: "Visionary Arc Season Pass",
                  description: "25% XP boost + exclusive season badge for the full season",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${frontendUrl}/shop?season_pass=success`,
          cancel_url: `${frontendUrl}/shop`,
          metadata: {
            type: "season_pass",
            userId: user.id,
          },
        });
        return jsonResponse({ url: session.url });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: seasonPassPriceId, quantity: 1 }],
        success_url: `${frontendUrl}/shop?season_pass=success`,
        cancel_url: `${frontendUrl}/shop`,
        metadata: {
          type: "season_pass",
          userId: user.id,
        },
      });
      return jsonResponse({ url: session.url });
    }

    if (type === "coin_top_up") {
      const packId = body.packId as keyof typeof COIN_PACKS;
      const pack = COIN_PACKS[packId];
      if (!pack) {
        return jsonResponse({ error: "packId must be 'starter', 'standard', or 'pro'" }, 400);
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: pack.unitAmount,
              product_data: {
                name: pack.label,
                description: `Adds ${pack.coins} coins to your Visionary Arc wallet`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/shop?coin_topup=success&pack=${packId}`,
        cancel_url: `${frontendUrl}/shop`,
        metadata: {
          type: "coin_top_up",
          userId: user.id,
          packId,
          coins: String(pack.coins),
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
