import { useState, useEffect, useRef, useContext } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { API, AuthContext } from "../App";
import { toast } from "sonner";
import {
  Crown,
  Zap,
  Star,
  Shield,
  Loader2,
  Sprout,
  Flame,
  ArrowRight,
  Coins,
  BadgeCheck,
  Ticket,
  Clock,
  RefreshCw,
  HelpCircle,
  Brain,
  Cpu,
  Lock,
} from "lucide-react";
/*
  MANUAL SETUP REQUIRED:
  1. Go to stripe.com → Products → Create these 4 products:
     - Seed Pass: $9.99 one-time
     - Bronze Pass: $24.99 one-time
     - Silver Pass: $49.99 one-time
     - Gold Pass: $99.99 one-time
  2. For each product, create a Payment Link
  3. On each link, add metadata: { founder_tier: 'seed' | 'bronze' | 'silver' | 'gold' }
  4. Set success URL: https://visionary-arc.vercel.app/checkout-success?tier=TIER_NAME
  5. Replace PLACEHOLDER URLs below with real Stripe Payment Link URLs
*/

const PAYMENT_LINKS = {
  seed:   'https://buy.stripe.com/PLACEHOLDER_SEED',
  bronze: 'https://buy.stripe.com/PLACEHOLDER_BRONZE',
  silver: 'https://buy.stripe.com/PLACEHOLDER_SILVER',
  gold:   'https://buy.stripe.com/PLACEHOLDER_GOLD',
};

const COIN_GRANTS = {
  seed: 200,
  bronze: 600,
  silver: 2000,
  gold: 8000,
};

// ─── Tier Data ───────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "seed",
    label: "Seed",
    icon: Sprout,
    price: 4.99,
    spotsTotal: 500,
    spotsLeft: 347,
    tagline: "Lock in your spot early.",
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/30",
    border: "border-emerald-400/30",
    hoverBorder: "hover:border-emerald-400/70",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-400/10",
    features: [
      { icon: BadgeCheck, text: "Exclusive Seed founder badge" },
      { icon: Zap, text: "12 free AI calls/day — forever (free was 6)" },
      { icon: Coins, text: "200 coins gifted on launch" },
      { icon: Brain, text: "Extra calls cost 40 coins (free tier: 50)" },
      { icon: Ticket, text: "Early access to every new feature" },
    ],
  },
  {
    id: "bronze",
    label: "Bronze",
    icon: Shield,
    price: 9.99,
    spotsTotal: 250,
    spotsLeft: 189,
    tagline: "More power, more study.",
    gradient: "from-amber-600 to-orange-500",
    glow: "shadow-orange-500/30",
    border: "border-brand-orange/30",
    hoverBorder: "hover:border-brand-orange/70",
    textAccent: "text-brand-orange",
    bgAccent: "bg-brand-orange/10",
    features: [
      { icon: BadgeCheck, text: "Everything in Seed" },
      { icon: Zap, text: "20 free AI calls/day — forever" },
      { icon: Coins, text: "600 coins gifted on launch" },
      { icon: Brain, text: "1.5× coins earned from studying" },
      { icon: Star, text: "Bronze animated profile frame" },
    ],
  },
  {
    id: "silver",
    label: "Silver",
    icon: Star,
    price: 24.99,
    spotsTotal: 100,
    spotsLeft: 61,
    tagline: "The serious student tier.",
    gradient: "from-slate-300 to-slate-500",
    glow: "shadow-slate-400/40",
    border: "border-slate-400/50",
    hoverBorder: "hover:border-slate-300",
    textAccent: "text-slate-300",
    bgAccent: "bg-slate-400/10",
    recommended: true,
    features: [
      { icon: BadgeCheck, text: "Everything in Bronze" },
      { icon: Zap, text: "35 free AI calls/day — forever" },
      { icon: Coins, text: "2,000 coins gifted on launch" },
      { icon: Brain, text: "2× coins earned from studying — forever" },
      { icon: Star, text: "Silver animated profile frame" },
      { icon: Lock, text: "Your coin costs never increase — locked forever" },
    ],
  },
  {
    id: "gold",
    label: "Gold",
    icon: Crown,
    price: 49.99,
    spotsTotal: 50,
    spotsLeft: 23,
    tagline: "For those who believe in this.",
    gradient: "from-brand-orange to-brand-deep",
    glow: "shadow-[0_0_20px_rgba(232,114,42,0.3)]",
    border: "border-brand-orange/40",
    hoverBorder: "hover:border-brand-orange/80",
    textAccent: "text-brand-orange",
    bgAccent: "bg-brand-orange/10",
    features: [
      { icon: BadgeCheck, text: "Everything in Silver" },
      { icon: Zap, text: "60 free AI calls/day — forever" },
      { icon: Coins, text: "8,000 coins gifted on launch" },
      { icon: Brain, text: "3× coins earned from studying — forever" },
      { icon: Crown, text: "Gold animated profile frame" },
      { icon: Cpu, text: "Priority generation — always skip the queue" },
      { icon: Star, text: "Name in the in-app Founders Hall of Fame" },
    ],
  },
];

const FAQS = [
  {
    q: "Is this really a one-time payment?",
    a: "Yes — absolutely. You pay once and get lifetime access to your tier's perks. No subscriptions, no hidden fees, no renewals. Ever.",
  },
  {
    q: "Can I upgrade to a higher tier later?",
    a: "Yes. You'll always be able to upgrade by paying the difference in price. However, spots are limited so higher tiers may sell out before launch.",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a no-questions-asked 30-day money-back guarantee. If you change your mind within 30 days of purchase, just reach out and we'll refund you in full.",
  },
  {
    q: "When do I get my perks?",
    a: "Coins are credited to your account on launch day. Your founder badge, profile frame, increased daily AI allowance, and coin multiplier activate immediately after purchase.",
  },
  {
    q: "What happens when I use all my free daily calls?",
    a: "You can keep generating using coins — which you earn automatically just by studying on the platform. Founder tiers earn coins faster and spend fewer per call, so active students rarely hit a hard wall. You can also purchase coin packs from the Shop at any time.",
  },
];

// ─── Animated Spot Counter ────────────────────────────────────────────────────
function SpotsBar({ spotsLeft, spotsTotal, textAccent }) {
  const pct = Math.max(5, Math.round((spotsLeft / spotsTotal) * 100));
  const urgency = pct <= 30;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm md:text-xs">
        <span className={`font-semibold ${urgency ? "text-red-400" : textAccent}`}>
          {urgency && <Flame className="inline w-3 h-3 mr-0.5 animate-pulse" />}
          {spotsLeft} spots left
        </span>
        <span className="text-muted-foreground">{spotsTotal} total</span>
      </div>
      <div className="h-1.5 w-full bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${
            urgency ? "from-red-500 to-orange-400" : "from-current to-current"
          }`}
          style={{ width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function TierCard({ tier, index, loadingTier, onCheckout }) {
  const Icon = tier.icon;
  const isLoading = loadingTier === tier.id;
  const isDisabled = loadingTier !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className={`relative flex flex-col rounded-2xl border-2 ${tier.border} ${tier.hoverBorder} bg-card transition-all duration-300 group
        ${tier.recommended
          ? `scale-[1.03] md:scale-[1.05] shadow-2xl ${tier.glow}`
          : "hover:-translate-y-1 hover:shadow-xl"
        }
      `}
    >
      {/* Recommended glow ring */}
      {tier.recommended && (
        <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${tier.gradient} opacity-20 pointer-events-none`} />
      )}

      {/* Top badge */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-[var(--text-primary)] shadow-lg`}
          >
            <Icon className="w-6 h-6" />
          </div>

          {tier.recommended ? (
            <span
              className={`inline-flex items-center gap-1 text-sm md:text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${tier.gradient} text-[var(--text-primary)] shadow`}
            >
              <Star className="w-3 h-3" /> RECOMMENDED
            </span>
          ) : (
            <span className={`text-sm md:text-xs font-medium px-2.5 py-1 rounded-full ${tier.bgAccent} ${tier.textAccent}`}>
              {tier.label}
            </span>
          )}
        </div>

        {/* Tier name + tagline */}
        <h3 className="text-xl font-bold mb-0.5">{tier.label} Pass</h3>
        <p className="text-sm text-muted-foreground mb-4">{tier.tagline}</p>

        {/* Price */}
        <div className="flex items-end gap-1.5 mb-4">
          <span className="text-4xl font-extrabold tracking-tight">
            ${tier.price.toFixed(2)}
          </span>
          <span className="text-muted-foreground text-sm mb-1.5">one-time</span>
        </div>

        {/* Spots bar */}
        <SpotsBar
          spotsLeft={tier.spotsLeft}
          spotsTotal={tier.spotsTotal}
          textAccent={tier.textAccent}
        />
      </div>

      <Separator className="my-4 opacity-20" />

      {/* Features */}
      <div className="px-5 flex-1">
        <ul className="space-y-2.5">
          {tier.features.map((feat, i) => {
            const FeatIcon = feat.icon;
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${tier.bgAccent} flex items-center justify-center`}
                >
                  <FeatIcon className={`w-3 h-3 ${tier.textAccent}`} />
                </span>
                <span className="text-foreground/90">{feat.text}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-5">
        <Button
          className={`w-full font-semibold text-[var(--text-primary)] bg-gradient-to-r ${tier.gradient} hover:opacity-90 active:scale-95 transition-all border-0 shadow-lg`}
          size="lg"
          onClick={() => onCheckout(tier.id)}
          disabled={isDisabled}
          data-testid={`checkout-btn-${tier.id}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : (
            <>
              Get {tier.label} Pass
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Pricing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState(null);
  const [founderCount, setFounderCount] = useState(512);
  const faqRef = useRef(null);

  // Fetch real founder count from backend
  useEffect(() => {
    fetch(`${API}/founders/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.founders_count != null) {
          setFounderCount(Math.max(512, d.founders_count + 500));
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (tierId) => {
    // Guard: must be logged in
    if (!user) {
      navigate("/auth?returnTo=/pricing");
      return;
    }

    // Guard: already owns this tier or higher
    if (user.founder_tier) {
      const order = ["seed", "bronze", "silver", "gold"];
      if (order.indexOf(tierId) <= order.indexOf(user.founder_tier)) {
        toast.info(`You already have the ${user.founder_tier} Founder Pass or higher!`);
        return;
      }
    }

    setLoadingTier(tierId);
    const link = PAYMENT_LINKS[tierId];
    if (!link || link.includes("PLACEHOLDER")) {
      toast.error(`Stripe payment link for ${tierId} is not configured yet.`);
      setLoadingTier(null);
      return;
    }
    const url = `${link}?prefilled_email=${encodeURIComponent(user.email)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`${tierId[0].toUpperCase()}${tierId.slice(1)} includes ${COIN_GRANTS[tierId]} coin grant.`);
    setLoadingTier(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-700 via-orange-800 to-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,40,200,0.4),transparent)]" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNikiLz48L3N2Zz4=')] opacity-60" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-24 pb-20 text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur rounded-full px-4 py-1.5 text-[color:color-mix(in_srgb,var(--text-primary)_90%,transparent)] text-sm font-medium mb-8"
          >
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            Limited-Time Founder Pass
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping ml-0.5" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6"
          >
            Lock in lifetime
            <br />
            <span className="bg-gradient-to-r from-orange-700 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              access today.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-lg md:text-xl max-w-xl mx-auto mb-10"
          >
            Prices{" "}
            <span className="text-[var(--text-primary)] font-semibold underline decoration-dotted">
              increase after launch.
            </span>{" "}
            Become a founding member and secure your perks before spots run out.
          </motion.p>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-3 bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur-sm rounded-2xl px-5 py-3"
          >
            <div className="flex -space-x-2">
              {["bg-orange-600", "bg-pink-500", "bg-brand-orange", "bg-teal-500", "bg-orange-600"].map(
                (c, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full ${c} border-2 border-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] flex items-center justify-center text-sm md:text-[10px] font-bold text-[var(--text-primary)]`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                )
              )}
            </div>
            <p className="text-[color:color-mix(in_srgb,var(--text-primary)_90%,transparent)] text-sm font-medium">
              Join{" "}
              <span className="text-[var(--text-primary)] font-bold text-base">
                <AnimatedNumber target={founderCount} />+
              </span>{" "}
              founders already in
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Pricing Cards ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Guarantee ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-muted-foreground"
        >
          {[
            { icon: RefreshCw, text: "30-day money-back guarantee" },
            { icon: Clock, text: "One-time payment, no renewals" },
            { icon: Zap, text: "Instant access after purchase" },
          ].map(({ icon: Icon, text }, i) => (
            <span key={i} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-orange-400" />
              {text}
            </span>
          ))}
        </motion.div>

        {/* Cards grid: 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 items-end">
          {TIERS.map((tier, i) => (
            <TierCard
              key={tier.id}
              tier={tier}
              index={i}
              loadingTier={loadingTier}
              onCheckout={handleCheckout}
            />
          ))}
        </div>

        {/* Stripe trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-muted-foreground text-sm md:text-xs mt-8 flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#635BFF" />
            <path d="M13.5 8.5c-1.8 0-3 .9-3 2.3 0 1.4 1.1 2 2.8 2.6 1.6.5 1.9.8 1.9 1.4 0 .7-.7 1.1-1.8 1.1-1.2 0-2.3-.5-3-.9l-.5 1.7c.7.5 1.9.9 3.3.9 1.9 0 3.2-.9 3.2-2.5 0-1.3-.9-2-2.7-2.6-1.4-.5-2-.7-2-1.3 0-.6.5-1 1.5-1 1 0 2 .4 2.6.7l.5-1.7c-.6-.4-1.7-.7-2.8-.7z" fill="white"/>
          </svg>
          Secure checkout powered by{" "}
          <span className="font-semibold text-foreground">Stripe</span> — your
          card details never touch our servers.
        </motion.p>
      </div>

      {/* ── Feature comparison callout ───────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Not sure which tier?</h3>
              <p className="text-muted-foreground text-sm">
                Silver is the sweet spot — 35 free AI calls per day, 2,000 coins on launch,
                a 2× study coin multiplier forever, and your costs locked at today's rates for life.
                Less than the price of a textbook. Upgrade anytime.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-slate-400 to-slate-600 hover:opacity-90 text-[var(--text-primary)] border-0 whitespace-nowrap"
              onClick={() => handleCheckout("silver")}
              disabled={loadingTier !== null}
            >
              {loadingTier === "silver" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
              ) : (
                <><Star className="w-4 h-4 mr-2" /> Get Silver Pass</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <div ref={faqRef} className="max-w-2xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-orange-400 text-sm font-medium mb-3">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </div>
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-5 data-[state=open]:border-orange-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-sm py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-14 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">
            Still have questions?{" "}
            <a
              href="mailto:hello@visionaryacademy.com"
              className="text-orange-400 hover:underline font-medium"
            >
              Drop us an email
            </a>
          </p>
          <div className="inline-flex items-center gap-2 text-sm md:text-xs text-muted-foreground bg-muted rounded-full px-4 py-2">
            <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
            30-day money-back guarantee — no questions asked
          </div>
        </motion.div>
      </div>
    </div>
  );
}
