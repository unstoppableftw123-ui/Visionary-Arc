import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AuthContext } from "../App";
import { supabase } from "../services/supabaseClient";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";
import {
  Store as StoreIcon,
  Crown,
  Coins,
  Zap,
  Star,
  Loader2
} from "lucide-react";

// REPLACE with real Stripe Price IDs from dashboard
const PRODUCTS = {
  coins_100: { priceId: "price_coins_100", label: "100 Coins", coins: 100, price: "$0.99", color: "from-brand-orange to-brand-deep" },
  coins_500: { priceId: "price_coins_500", label: "500 Coins", coins: 500, price: "$3.99", color: "from-brand-orange to-orange-500", popular: true },
  coins_2000: { priceId: "price_coins_2000", label: "2000 Coins", coins: 2000, price: "$12.99", color: "from-orange-400 to-red-500" },
  founder_bronze: { priceId: "price_founder_bronze", label: "Bronze Founder", tier: "bronze", price: "$9/mo", color: "from-brand-deep to-brand-orange", icon: "🥉" },
  founder_silver: { priceId: "price_founder_silver", label: "Silver Founder", tier: "silver", price: "$19/mo", color: "from-slate-400 to-slate-600", icon: "🥈", popular: true },
  founder_gold: { priceId: "price_founder_gold", label: "Gold Founder", tier: "gold", price: "$39/mo", color: "from-brand-orange to-brand-deep", icon: "🥇" },
};

const COIN_PACKS = ["coins_100", "coins_500", "coins_2000"];
const FOUNDER_TIERS = ["founder_bronze", "founder_silver", "founder_gold"];

const FOUNDER_BENEFITS = {
  bronze: ["500 coins/month", "Priority support", "Bronze badge", "Ad-free experience"],
  silver: ["1,500 coins/month", "All Bronze perks", "Silver badge", "Early feature access"],
  gold: ["10,000 coins/month", "All Silver perks", "Gold badge", "1-on-1 onboarding call"],
};

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function Store() {
  const { user } = useContext(AuthContext);
  const [loadingProduct, setLoadingProduct] = useState(null);

  const handleBuyWithStripe = async (productKey) => {
    if (!user?.id) {
      toast.error("Please log in to make a purchase.");
      return;
    }
    const product = PRODUCTS[productKey];
    setLoadingProduct(productKey);
    try {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: product.priceId, quantity: 1 }],
        mode: "payment",
        successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&product=${productKey}`,
        cancelUrl: `${window.location.origin}/store`,
        clientReferenceId: user.id,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto" data-testid="store-page">

        {/* Hero Header */}
        <div className="relative mb-8 p-6 md:p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-orange via-orange-500 to-red-500">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StoreIcon className="w-8 h-8 text-[var(--text-primary)]" />
                  <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Store</h1>
                </div>
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] max-w-lg">
                  Buy coin packs to power your AI tools, or upgrade to a Founder tier for monthly coins + exclusive perks.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur-sm rounded-xl px-4 py-3">
                <Coins className="w-6 h-6 text-brand-tan" />
                <span className="text-2xl font-bold text-[var(--text-primary)]">{user?.coins || 0}</span>
                <span className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">coins</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Coin Packs */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-orange" /> Coin Packs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COIN_PACKS.map((key) => {
              const p = PRODUCTS[key];
              const isLoading = loadingProduct === key;
              return (
                <Card key={key} className="relative border-border hover:shadow-md transition-all overflow-hidden">
                  {p.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-brand-orange to-orange-500 text-[var(--text-primary)] text-sm md:text-xs">Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                      <Coins className="w-8 h-8 text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{p.coins.toLocaleString()} Coins</p>
                      <p className="text-2xl font-bold text-brand-orange">{p.price}</p>
                    </div>
                    <Button
                      className={`w-full bg-gradient-to-r ${p.color} text-[var(--text-primary)] hover:opacity-90`}
                      onClick={() => handleBuyWithStripe(key)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      {isLoading ? "Redirecting…" : "Buy Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* Founder Tiers */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-brand-orange" /> Founder Passes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FOUNDER_TIERS.map((key) => {
              const p = PRODUCTS[key];
              const isLoading = loadingProduct === key;
              const isCurrentTier = user?.founder_tier === p.tier;
              const benefits = FOUNDER_BENEFITS[p.tier];
              return (
                <Card
                  key={key}
                  className={`relative border-2 hover:shadow-md transition-all overflow-hidden ${isCurrentTier ? "border-brand-orange" : "border-border"}`}
                >
                  {p.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-orange-700 to-orange-600 text-[var(--text-primary)] text-sm md:text-xs">Best Value</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl`}>
                      {p.icon}
                    </div>
                    <div>
                      <p className="font-bold text-lg capitalize">{p.tier} Founder</p>
                      <p className="text-2xl font-bold text-brand-orange">{p.price}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {isCurrentTier ? (
                      <Badge className="w-fit bg-brand-orange/20 text-brand-deep border-brand-orange/30">Current Plan</Badge>
                    ) : (
                      <Button
                        className={`w-full bg-gradient-to-r ${p.color} text-[var(--text-primary)] hover:opacity-90`}
                        onClick={() => handleBuyWithStripe(key)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                        {isLoading ? "Redirecting…" : "Get Pass"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

      </main>
    </div>
  );
}
