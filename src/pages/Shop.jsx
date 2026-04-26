import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AuthContext } from "../App";
import { supabase } from "../services/supabaseClient";
import {
  getBalance as getCoinBalance,
  spendCoins as spendUserCoins,
} from "../services/coinService";
import {
  purchaseSeasonPass,
  purchaseCoinTopUp,
} from "../services/stripeService";
import { checkRedemptionEligibility } from "../services/usageService";
import { useFeatureGate } from "../hooks/useFeatureGate";
import LockedFeatureOverlay from "../components/LockedFeatureOverlay";
import { toast } from "sonner";
import {
  Coins,
  Sparkles,
  Zap,
  Palette,
  Star,
  Crown,
  ShoppingBag,
  Check,
  Gift,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import CoinIcon from "../components/ui/CoinIcon";
import Icon from "../components/ui/Icon";
import { Icons } from "../assets/icons";

// ── Cosmetics catalogue ───────────────────────────────────────────────────────

const BORDER_OPTIONS = [
  { id: "default",      label: "Default",       price: 0,   preview: "border-border",                       style: {} },
  { id: "neon-purple",  label: "Neon Purple",   price: 150, preview: "border-orange-500/30",                   style: { borderColor: "#e8722a", boxShadow: "0 0 8px rgba(232,114,42,0.5)" } },
  { id: "gold",         label: "Gold",          price: 200, preview: "border-brand-orange",                   style: { borderColor: "#e8722a", boxShadow: "0 0 8px #e8722a88" } },
  { id: "fire",         label: "Fire",          price: 300, preview: "border-orange-500",                   style: { borderColor: "#f97316", boxShadow: "0 0 8px #f9731688" } },
  { id: "frost",        label: "Frost",         price: 300, preview: "border-cyan-400",                     style: { borderColor: "#22d3ee", boxShadow: "0 0 8px #22d3ee88" } },
  { id: "galaxy",       label: "Galaxy",        price: 500, preview: "border-orange-500/30",                   style: { borderColor: "#6366f1", boxShadow: "0 0 12px #6366f188, 0 0 24px rgba(232,114,42,0.5)" } },
];

const CARD_BG_OPTIONS = [
  { id: "default",      label: "Default",       price: 0,   bg: "bg-card",                                  style: {} },
  { id: "dark-carbon",  label: "Dark Carbon",   price: 150, bg: "bg-zinc-900",                              style: { background: "repeating-linear-gradient(45deg,#18181b,#18181b 4px,#27272a 4px,#27272a 8px)" } },
  { id: "aurora",       label: "Aurora",        price: 250, bg: "bg-emerald-950",                           style: { background: "linear-gradient(135deg,#064e3b,#1e3a5f,#312e81)" } },
  { id: "sunset",       label: "Sunset",        price: 250, bg: "bg-rose-950",                              style: { background: "linear-gradient(135deg,#450a0a,#7c2d12,#4c1d95)" } },
  { id: "ocean",        label: "Ocean",         price: 200, bg: "bg-sky-950",                               style: { background: "linear-gradient(135deg,#0c4a6e,#164e63,#0f172a)" } },
];

// ── Coin packs ────────────────────────────────────────────────────────────────

const COIN_PACKS = [
  { id: "starter",  coins: 200,  price: "$3.99",  label: "Starter",  color: "from-slate-600 to-slate-800" },
  { id: "standard", coins: 600,  price: "$9.99",  label: "Standard", color: "from-orange-700 to-orange-600", bestValue: true },
  { id: "pro",      coins: 1500, price: "$19.99", label: "Pro",       color: "from-brand-orange to-orange-700" },
];

// ─────────────────────────────────────────────────────────────────────────────

const COIN_TO_DOLLAR = 1000;
const GIFT_CARD_MIN = 5000;
export default function Shop() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("season");
  const [buying, setBuying] = useState(null);
  const [equipping, setEquipping] = useState(null);
  const [giftAmount, setGiftAmount] = useState(GIFT_CARD_MIN);
  const [giftSubmitted, setGiftSubmitted] = useState(false);
  const [giftLoading, setGiftLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibility, setEligibility] = useState({ eligible: false, reason: null, coinsNeeded: 0 });
  const [coinBalance, setCoinBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const giftGate = useFeatureGate('gift_card_redemption');

  const cosmetics = user?.cosmetics ?? { border: "default", card_bg: "default", badge_frame: "default" };
  const effectiveCoins = coinBalance ?? 0;
  const maxGiftAmount = Math.floor(effectiveCoins / COIN_TO_DOLLAR) * COIN_TO_DOLLAR;
  const giftAmountOptions = Array.from(
    { length: Math.max(0, (maxGiftAmount - GIFT_CARD_MIN) / COIN_TO_DOLLAR + 1) },
    (_, index) => GIFT_CARD_MIN + index * COIN_TO_DOLLAR,
  );

  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      if (!user?.id) {
        if (mounted) {
          setCoinBalance(0);
          setBalanceLoading(false);
        }
        return;
      }
      setBalanceLoading(true);
      try {
        const balance = await getCoinBalance(user.id);
        if (mounted) setCoinBalance(balance ?? 0);
      } catch {
        if (mounted) setCoinBalance(user.coins ?? 0);
      } finally {
        if (mounted) setBalanceLoading(false);
      }
    };
    loadBalance();
    return () => {
      mounted = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    const loadEligibility = async () => {
      if (!user?.id || !giftGate.unlocked) return;
      setEligibilityLoading(true);
      try {
        const result = await checkRedemptionEligibility(user.id);
        if (mounted) setEligibility(result);
      } catch {
        if (mounted) setEligibility({ eligible: false, reason: "error", coinsNeeded: 0 });
      } finally {
        if (mounted) setEligibilityLoading(false);
      }
    };
    loadEligibility();
    return () => { mounted = false; };
  }, [user?.id, giftGate.unlocked]);

  useEffect(() => {
    if (giftAmountOptions.length === 0) {
      setGiftAmount(GIFT_CARD_MIN);
      return;
    }

    if (!giftAmountOptions.includes(giftAmount)) {
      setGiftAmount(giftAmountOptions[giftAmountOptions.length - 1]);
    }
  }, [giftAmount, giftAmountOptions]);

  const handleGiftRedemption = async () => {
    if (!user?.id) return;
    setGiftLoading(true);
    try {
      const eligibilityResult = await checkRedemptionEligibility(user.id);
      if (!eligibilityResult.eligible) {
        setEligibility(eligibilityResult);
        throw new Error("Not eligible for redemption yet.");
      }

      const newBalance = await spendUserCoins(user.id, giftAmount, "gift_card_redemption");
      if (newBalance == null) {
        throw new Error("Insufficient coins.");
      }

      const { error } = await supabase.from("gift_card_requests").insert({
        user_id: user.id,
        coin_amount: giftAmount,
        dollar_value: giftAmount / COIN_TO_DOLLAR,
        status: "pending",
      });
      if (error) throw error;

      setCoinBalance(newBalance);
      setUser((prev) => ({ ...prev, coins: newBalance }));
      setGiftSubmitted(true);
      toast.success("Request submitted! Processing within 48 hours");
      setEligibility({ eligible: newBalance >= GIFT_CARD_MIN, reason: null, coinsNeeded: Math.max(0, GIFT_CARD_MIN - newBalance) });
    } catch (err) {
      toast.error(err.message ?? "Redemption failed.");
    } finally {
      setGiftLoading(false);
    }
  };

  // Owned cosmetics are those the user has previously equipped or purchased.
  // We store equipped state in profile.cosmetics. For "owned" tracking we check
  // if the item id is the currently equipped one OR if it's "default" (always free).
  // A stricter approach would require a separate owned_cosmetics array — kept simple here.
  const ownedBorders  = new Set([cosmetics.border,  "default"]);
  const ownedCardBgs  = new Set([cosmetics.card_bg, "default"]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSeasonPass() {
    if (!user) return;
    setBuying("season_pass");
    try {
      const url = await purchaseSeasonPass(user.id);
      window.location.href = url;
    } catch (err) {
      toast.error(err.message ?? "Failed to start checkout");
      setBuying(null);
    }
  }

  async function handleCoinTopUp(packId) {
    if (!user) return;
    setBuying(packId);
    try {
      const url = await purchaseCoinTopUp(user.id, packId);
      window.location.href = url;
    } catch (err) {
      toast.error(err.message ?? "Failed to start checkout");
      setBuying(null);
    }
  }

  async function handleBuyCosmetic(type, item) {
    if (!user) return;
    const key = `${type}:${item.id}`;
    setEquipping(key);
    try {
      // Deduct coins
      const newBalance = await spendUserCoins(user.id, item.price, `cosmetic:${type}:${item.id}`);
      if (newBalance == null) throw new Error("Insufficient coin balance");
      // Equip immediately after purchase
      await equipCosmetic(type, item.id, true);
      setCoinBalance(newBalance);
      setUser((prev) => ({ ...prev, coins: newBalance }));
    } catch (err) {
      toast.error(err.message ?? "Purchase failed");
    } finally {
      setEquipping(null);
    }
  }

  async function handleEquipCosmetic(type, itemId) {
    const key = `${type}:${itemId}`;
    setEquipping(key);
    await equipCosmetic(type, itemId, false);
    setEquipping(null);
  }

  async function equipCosmetic(type, itemId, wasPurchased) {
    const field = type === "border" ? "border" : "card_bg";
    const updatedCosmetics = { ...cosmetics, [field]: itemId };

    const { error } = await supabase
      .from("profiles")
      .update({ cosmetics: updatedCosmetics })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save cosmetic");
      return;
    }

    // Refresh local user state
    setUser((prev) => ({ ...prev, cosmetics: updatedCosmetics, coins: wasPurchased ? coinBalance : prev.coins }));
    toast.success(wasPurchased ? "Purchased and equipped!" : "Equipped!");
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto" data-testid="shop-page">
      {/* Hero */}
      <div className="relative mb-8 p-6 md:p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-700 via-orange-700 to-orange-600">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[var(--text-primary)]" />
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Shop</h1>
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] text-sm">Season Pass · Coins · Cosmetics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur rounded-lg px-4 py-2">
              <CoinIcon animated={true} size={20} />
              {balanceLoading ? (
                <span className="inline-block h-5 w-16 rounded bg-white/20 animate-pulse" />
              ) : (
                <span className="text-[var(--text-primary)] font-bold">{effectiveCoins.toLocaleString()}</span>
              )}
              <span className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm">coins</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 max-w-xl mb-8">
          <TabsTrigger value="season"><Crown className="w-4 h-4 mr-2" />Season Pass</TabsTrigger>
          <TabsTrigger value="coins"><Coins className="w-4 h-4 mr-2" />Coins</TabsTrigger>
          <TabsTrigger value="cosmetics"><Palette className="w-4 h-4 mr-2" />Cosmetics</TabsTrigger>
          <TabsTrigger value="giftcards"><Gift className="w-4 h-4 mr-2" />Gift Cards</TabsTrigger>
        </TabsList>

        {/* ── Season Pass ── */}
        <TabsContent value="season">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            <Card className="border-2 border-orange-500/30 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-700 to-orange-600 p-6 text-[var(--text-primary)]">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8 text-brand-tan" />
                  <h2 className="text-2xl font-bold">Season Pass</h2>
                </div>
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] text-sm">One-time purchase · Active for 90 days</p>
                <p className="text-3xl font-bold mt-4">$9.99</p>
              </div>
              <CardContent className="p-6 space-y-4">
                {user.season_pass_active ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-medium">
                    <Check className="w-5 h-5" />
                    Season Pass active — expires {new Date(user.season_pass_expires_at).toLocaleDateString()}
                  </div>
                ) : null}

                <ul className="space-y-3">
                  {[
                    { icon: <Zap className="w-5 h-5 text-brand-orange" />, text: "25% XP boost on all activities" },
                    { icon: <Star className="w-5 h-5 text-brand-orange" />, text: "Exclusive season badge on your profile" },
                    { icon: <Crown className="w-5 h-5 text-orange-400" />, text: "Priority display on the weekly leaderboard" },
                    { icon: <Sparkles className="w-5 h-5 text-pink-400" />, text: "Early access to new career tracks" },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-sm">
                      {icon}
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-700 hover:to-orange-600 text-[var(--text-primary)]"
                  disabled={!!user.season_pass_active || buying === "season_pass"}
                  onClick={handleSeasonPass}
                >
                  {user.season_pass_active
                    ? "Already Active"
                    : buying === "season_pass"
                    ? "Redirecting…"
                    : "Buy Season Pass — $9.99"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Coin Packs ── */}
        <TabsContent value="coins">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {COIN_PACKS.map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative"
              >
                {pack.bestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-brand-orange text-[var(--text-primary)] px-3 py-0.5 text-sm md:text-xs font-bold">Best Value</Badge>
                  </div>
                )}
                <Card className={`border-2 overflow-hidden h-full ${pack.bestValue ? "border-brand-orange/70" : "border-border"}`}>
                  <div className={`bg-gradient-to-br ${pack.color} p-6 text-[var(--text-primary)] text-center`}>
                    <div className="flex justify-center mb-2">
                      <CoinIcon animated={true} size={40} variant="stack" />
                    </div>
                    <p className="text-3xl font-bold">{pack.coins.toLocaleString()}</p>
                    <p className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm">coins</p>
                  </div>
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{pack.price}</p>
                      <p className="text-muted-foreground text-sm">{pack.label} Pack</p>
                    </div>
                    <Button
                      className="w-full"
                      variant={pack.bestValue ? "default" : "outline"}
                      disabled={buying === pack.id}
                      onClick={() => handleCoinTopUp(pack.id)}
                    >
                      {buying === pack.id ? "Redirecting…" : `Buy for ${pack.price}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm md:text-xs text-muted-foreground mt-6">
            Coins can be spent on cosmetics and extra mission claim slots.
            Coins earned through studying also qualify for Real Rewards (coming soon).
          </p>
        </TabsContent>

        {/* ── Cosmetics ── */}
        <TabsContent value="cosmetics">
          <div className="space-y-10">
            {/* Profile Borders */}
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-400" /> Profile Borders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {BORDER_OPTIONS.map((item, i) => {
                  const owned   = ownedBorders.has(item.id);
                  const equipped = cosmetics.border === item.id;
                  const key = `border:${item.id}`;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`overflow-hidden border-2 ${equipped ? "border-orange-500/30" : "border-border"}`}>
                        {/* Preview */}
                        <div className="p-3 flex items-center justify-center bg-card/80">
                          <div
                            className="w-14 h-14 rounded-full border-4 bg-muted flex items-center justify-center text-lg"
                            style={item.style}
                          >
                            👤
                          </div>
                        </div>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm md:text-xs font-medium text-center">{item.label}</p>
                          {item.price > 0 && (
                            <p className="text-sm md:text-xs text-brand-orange text-center flex items-center justify-center gap-1">
                              <Coins className="w-3 h-3" /> {item.price}
                            </p>
                          )}
                          {equipped ? (
                            <Button size="sm" className="w-full text-sm md:text-xs" disabled>Equipped</Button>
                          ) : owned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-sm md:text-xs"
                              disabled={equipping === key}
                              onClick={() => handleEquipCosmetic("border", item.id)}
                            >
                              {equipping === key ? "…" : "Equip"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-sm md:text-xs"
                              disabled={equipping === key || effectiveCoins < item.price}
                              onClick={() => handleBuyCosmetic("border", item)}
                            >
                              {equipping === key ? "…" : "Buy"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Card Backgrounds */}
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" /> Card Backgrounds
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {CARD_BG_OPTIONS.map((item, i) => {
                  const owned    = ownedCardBgs.has(item.id);
                  const equipped = cosmetics.card_bg === item.id;
                  const key = `card_bg:${item.id}`;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`overflow-hidden border-2 ${equipped ? "border-orange-500/30" : "border-border"}`}>
                        {/* Preview swatch */}
                        <div
                          className="h-20 w-full rounded-t-md"
                          style={item.style || {}}
                        />
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm md:text-xs font-medium text-center">{item.label}</p>
                          {item.price > 0 && (
                            <p className="text-sm md:text-xs text-brand-orange text-center flex items-center justify-center gap-1">
                              <Coins className="w-3 h-3" /> {item.price}
                            </p>
                          )}
                          {equipped ? (
                            <Button size="sm" className="w-full text-sm md:text-xs" disabled>Equipped</Button>
                          ) : owned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-sm md:text-xs"
                              disabled={equipping === key}
                              onClick={() => handleEquipCosmetic("card_bg", item.id)}
                            >
                              {equipping === key ? "…" : "Equip"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-sm md:text-xs"
                              disabled={equipping === key || effectiveCoins < item.price}
                              onClick={() => handleBuyCosmetic("card_bg", item)}
                            >
                              {equipping === key ? "…" : "Buy"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ── Gift Cards ── */}
        <TabsContent value="giftcards">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-lg mx-auto"
          >
            {/* Feature gate overlay */}
            {!giftGate.loading && !giftGate.unlocked && (
              <LockedFeatureOverlay
                featureName="Gift Card Redemptions"
                threshold={giftGate.threshold}
                currentUsers={giftGate.currentUsers}
              />
            )}

            <Card className="border-2 border-brand-orange/30 overflow-hidden bg-zinc-950">
              <div className="bg-gradient-to-br from-brand-orange/30 to-orange-700/20 border-b border-brand-orange/20 p-6">
                <div className="flex items-center gap-3 mb-1">
                  <Gift className="w-7 h-7 text-brand-orange" />
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Gift Cards</h2>
                </div>
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] text-sm">Redeem your coins for real gift cards</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/25 px-3 py-1.5 text-sm font-semibold text-brand-orange">
                    <Coins className="w-4 h-4" />
                    1,000 coins = $1
                  </div>
                  <span className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)]">Minimum: 5,000 coins ($5)</span>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {giftSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-3 py-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Check className="w-7 h-7 text-emerald-400" />
                    </div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">Request Submitted!</p>
                    <p className="text-sm text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)]">
                      Your ${(giftAmount / COIN_TO_DOLLAR).toFixed(0)} gift card request is processing.
                      <br />We'll send it within 48 hours.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--border)] text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] hover:text-[var(--text-primary)] mt-2"
                      onClick={() => setGiftSubmitted(false)}
                    >
                      Request Another
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {/* Balance */}
                    <div className="flex items-center justify-between rounded-xl border border-[color:color-mix(in_srgb,var(--text-primary)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--text-primary)_4%,transparent)] px-4 py-3">
                      <span className="text-sm text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)]">Your balance</span>
                      <div className="flex items-center gap-1.5">
                        <CoinIcon animated={false} size={16} />
                        <span className="font-bold text-[var(--text-primary)]">{effectiveCoins.toLocaleString()}</span>
                        <span className="text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] text-sm md:text-xs">coins</span>
                      </div>
                    </div>

                    {eligibilityLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-12 rounded-xl bg-white/5" />
                        <div className="h-12 rounded-xl bg-white/5" />
                      </div>
                    ) : !giftGate.loading && !giftGate.unlocked ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="font-[Clash_Display] text-lg text-white">Community milestone locked</p>
                        <p className="mt-2 text-sm text-white/65">
                          Gift cards unlock when the community reaches 1,000 users. Invite friends to help open the redemption vault faster.
                        </p>
                      </div>
                    ) : !eligibility?.eligible && eligibility?.reason === "not_enough_coins" ? (
                      <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/8 p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-brand-tan">You need more coins to redeem</p>
                          <p className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">
                            You need {(eligibility?.coinsNeeded ?? Math.max(0, GIFT_CARD_MIN - effectiveCoins)).toLocaleString()} more coins to unlock your first $5 reward. Study, finish missions, and stack streaks to get there faster.
                          </p>
                        </div>
                      </div>
                    ) : !eligibility?.eligible ? (
                      <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/8 p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-brand-tan">
                            {eligibility?.reason === "redemptions_disabled" ? "Redemptions are still warming up" : "Subscriber gate still locked"}
                          </p>
                          <p className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">
                            {eligibility?.reason === "redemptions_disabled"
                              ? "The community has unlocked gift cards, but the redemption switch is still off. Check back soon."
                              : "Gift cards need at least 5 subscribers before requests can be processed."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Amount selector */}
                        <div className="space-y-2">
                          <p className="text-sm md:text-xs uppercase tracking-widest text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)]">Select amount</p>
                          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--text-primary)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--text-primary)_4%,transparent)] p-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setGiftAmount((current) => Math.max(GIFT_CARD_MIN, current - COIN_TO_DOLLAR))}
                                disabled={giftAmount <= GIFT_CARD_MIN}
                                className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40"
                              >
                                -
                              </button>
                              <div className="flex-1 rounded-xl border border-brand-orange/25 bg-brand-orange/10 px-4 py-3 text-center">
                                <p className="font-[Clash_Display] text-2xl text-white">${(giftAmount / COIN_TO_DOLLAR).toFixed(0)}</p>
                                <p className="text-sm text-white/55">{giftAmount.toLocaleString()} coins</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setGiftAmount((current) => Math.min(maxGiftAmount, current + COIN_TO_DOLLAR))}
                                disabled={giftAmount >= maxGiftAmount}
                                className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            <label className="block text-sm text-white/60">
                              Redemption amount
                              <select
                                value={giftAmount}
                                onChange={(event) => setGiftAmount(Number(event.target.value))}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-4 py-3 text-white outline-none"
                              >
                                {giftAmountOptions.map((amount) => (
                                  <option key={amount} value={amount}>
                                    {amount.toLocaleString()} coins (${(amount / COIN_TO_DOLLAR).toFixed(0)})
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-brand-orange to-orange-500 hover:from-brand-deep hover:to-orange-400 text-zinc-950 font-bold border-0"
                          disabled={giftLoading}
                          onClick={handleGiftRedemption}
                        >
                          {giftLoading
                            ? "Processing…"
                            : `Redeem ${giftAmount.toLocaleString()} coins for $${(giftAmount / COIN_TO_DOLLAR).toFixed(0)}`}
                        </Button>
                      </>
                    )}

                    <p className="text-sm md:text-[10px] text-[color:color-mix(in_srgb,var(--text-primary)_25%,transparent)] text-center">
                      Requests are reviewed manually and fulfilled within 48 hours.
                      Gift cards are sent to your account email.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
