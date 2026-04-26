import { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { API, AuthContext } from "../App";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Crown,
  ArrowRight,
  Sparkles,
  Star,
  Shield,
  Sprout,
  BadgeCheck,
  Coins,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

// ─── Tier config (must mirror Pricing.jsx + backend) ─────────────────────────
const TIER_META = {
  seed: {
    icon: Sprout,
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/30",
    textAccent: "text-emerald-400",
    bgAccent: "bg-emerald-400/10",
    label: "Seed Founder",
  },
  bronze: {
    icon: Shield,
    gradient: "from-amber-600 to-orange-500",
    glow: "shadow-orange-500/30",
    textAccent: "text-brand-orange",
    bgAccent: "bg-brand-orange/10",
    label: "Bronze Founder",
  },
  silver: {
    icon: Star,
    gradient: "from-slate-300 to-slate-500",
    glow: "shadow-slate-400/40",
    textAccent: "text-slate-300",
    bgAccent: "bg-slate-400/10",
    label: "Silver Founder",
  },
  gold: {
    icon: Crown,
    gradient: "from-brand-orange to-brand-deep",
    glow: "shadow-[0_0_20px_rgba(232,114,42,0.3)]",
    textAccent: "text-brand-orange",
    bgAccent: "bg-brand-orange/10",
    label: "Gold Founder",
  },
};

// ─── Confetti burst (CSS-only, no dependency) ────────────────────────────────
function Confetti() {
  const colors = [
    "bg-orange-600", "bg-pink-500", "bg-brand-orange",
    "bg-teal-400", "bg-orange-600", "bg-rose-400", "bg-emerald-400",
  ];
  const pieces = Array.from({ length: 28 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.8}s`;
        const duration = `${1 + Math.random() * 1.2}s`;
        const size = Math.random() > 0.5 ? "w-2 h-2" : "w-1.5 h-3";
        return (
          <motion.div
            key={i}
            className={`absolute top-0 ${size} ${color} rounded-sm`}
            style={{ left }}
            initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
            animate={{
              y: 500,
              opacity: [1, 1, 0],
              rotate: Math.random() * 720 - 360,
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{ delay: parseFloat(delay), duration: parseFloat(duration), ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────
function VerifyingView() {
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-orange-400" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg">Confirming your payment…</p>
        <p className="text-muted-foreground text-sm mt-1">Hang tight, this takes just a second.</p>
      </div>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorView({ message, sessionId }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-12 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
        {sessionId && (
          <p className="text-sm md:text-xs text-muted-foreground mt-3 font-mono bg-muted rounded px-3 py-1 inline-block">
            Session: {sessionId}
          </p>
        )}
      </div>
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        <Button asChild variant="outline">
          <Link to="/pricing">
            <RotateCcw className="w-4 h-4 mr-2" /> Back to Pricing
          </Link>
        </Button>
        <Button asChild>
          <a href="mailto:hello@visionaryacademy.com">
            <ExternalLink className="w-4 h-4 mr-2" /> Contact Support
          </a>
        </Button>
      </div>
      <p className="text-sm md:text-xs text-muted-foreground">
        If you were charged, your payment is safe.{" "}
        <a
          href="mailto:hello@visionaryacademy.com"
          className="underline hover:text-foreground"
        >
          Email us
        </a>{" "}
        and we'll sort it out within 24 hours.
      </p>
    </motion.div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
function SuccessView({ data, userName }) {
  const meta = TIER_META[data.tier] || TIER_META.seed;
  const TierIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center"
    >
      {/* Tier icon + check mark combo */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.1 }}
        className="relative mb-6"
      >
        <div
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-[var(--text-primary)] shadow-2xl ${meta.glow}`}
        >
          <TierIcon className="w-12 h-12" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-green-500 border-4 border-background flex items-center justify-center"
        >
          <CheckCircle2 className="w-5 h-5 text-[var(--text-primary)]" />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <p className={`text-sm font-semibold uppercase tracking-widest ${meta.textAccent} mb-2`}>
          {data.badge}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Welcome, Founder! 🎉
        </h1>
        <p className="text-muted-foreground text-base max-w-sm mx-auto">
          {userName ? `${userName}, you're` : "You're"} now a{" "}
          <span className={`font-bold ${meta.textAccent}`}>{data.label}</span>.
          Your benefits are locked in for life.
        </p>
      </motion.div>

      {/* Benefits list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`w-full max-w-sm rounded-2xl border border-border ${meta.bgAccent} p-5 mb-6 text-left`}
      >
        <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Your new benefits
        </p>
        <ul className="space-y-2.5">
          {data.perks.map((perk, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className="flex items-start gap-2.5 text-sm"
            >
              <BadgeCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.textAccent}`} />
              <span>{perk}</span>
            </motion.li>
          ))}
        </ul>

        {/* Coins callout */}
        <div className={`mt-4 pt-4 border-t border-border flex items-center gap-2 ${meta.textAccent}`}>
          <Coins className="w-4 h-4" />
          <span className="text-sm font-semibold">
            +{data.coins_granted?.toLocaleString()} coins credited on launch day
          </span>
        </div>
      </motion.div>

      {/* Test card note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm rounded-xl bg-orange-600/10 border border-orange-500/30 px-4 py-3 mb-6 text-left"
      >
        <p className="text-sm md:text-xs text-orange-400 font-medium flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-bold">Test mode:</span> Use card{" "}
            <code className="bg-orange-600/20 rounded px-1">4242 4242 4242 4242</code>,
            any future date, any CVC. Real cards work in production.
          </span>
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <Button
          asChild
          className={`flex-1 bg-gradient-to-r ${meta.gradient} hover:opacity-90 text-[var(--text-primary)] border-0 font-semibold`}
          size="lg"
        >
          <Link to="/dashboard">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to="/pricing">View Tiers</Link>
        </Button>
      </motion.div>

      {/* Order details */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="text-sm md:text-xs text-muted-foreground mt-6"
      >
        A receipt was sent to your email by Stripe. Questions?{" "}
        <a
          href="mailto:hello@visionaryacademy.com"
          className="underline hover:text-foreground"
        >
          Contact support
        </a>
      </motion.p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, token, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [verifyData, setVerifyData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    // Must have session_id in URL
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("No payment session found. Did you arrive here by mistake?");
      return;
    }

    // Must be authenticated — if not, redirect to auth then back
    if (!token) {
      navigate("/auth", { state: { from: `/success?session_id=${sessionId}` } });
      return;
    }

    // Only verify once (prevent double-calls in StrictMode / re-renders)
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`${API}/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          const msg =
            res.status === 402
              ? "Payment not completed. If you were charged, please contact support."
              : res.status === 403
              ? "This payment doesn't belong to your account. Please contact support."
              : data.detail || "Verification failed. Please try again or contact support.";
          setErrorMsg(msg);
          setStatus("error");
          return;
        }

        // Update the user in AuthContext so the rest of the app knows immediately
        if (data.user && setUser) {
          setUser((prev) => ({ ...prev, ...data.user }));
        }

        setVerifyData(data);
        setStatus("success");
        toast.success(`${data.label} pass activated! Welcome aboard 🎉`);
      } catch (err) {
        setErrorMsg("Network error while verifying your payment. Please refresh or contact support.");
        setStatus("error");
      }
    };

    verify();
  }, [sessionId, token, navigate, setUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md relative">
        {/* Background glow blob */}
        <div className="absolute -inset-10 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Confetti fires once on success */}
          {status === "success" && <Confetti />}

          {/* Top gradient strip */}
          <div
            className={`h-1.5 w-full bg-gradient-to-r ${
              status === "success"
                ? verifyData?.tier
                  ? TIER_META[verifyData.tier]?.gradient
                  : "from-orange-700 to-orange-600"
                : status === "error"
                ? "from-red-500 to-rose-500"
                : "from-orange-900/30 to-orange-950/20"
            }`}
          />

          <div className="p-8">
            <AnimatePresence mode="wait">
              {status === "verifying" && (
                <motion.div key="verifying" exit={{ opacity: 0, scale: 0.95 }}>
                  <VerifyingView />
                </motion.div>
              )}
              {status === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ErrorView message={errorMsg} sessionId={sessionId} />
                </motion.div>
              )}
              {status === "success" && verifyData && (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SuccessView
                    data={verifyData}
                    userName={user?.name || verifyData.user?.name}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
