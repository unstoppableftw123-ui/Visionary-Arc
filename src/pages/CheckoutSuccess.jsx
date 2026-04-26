import { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { CheckCircle2, ArrowRight, Zap, Coins, Brain } from "lucide-react";
import { AuthContext } from "../App";
import { updateProfile, awardCoins } from "../services/db";
import confetti from "canvas-confetti";

const TIER_META = {
  seed: {
    label: "Seed",
    launchCoins: 200,
    dailyAI: 12,
    coinMultiplier: "1×",
  },
  bronze: {
    label: "Bronze",
    launchCoins: 500,
    dailyAI: 20,
    coinMultiplier: "1.5×",
  },
  silver: {
    label: "Silver",
    launchCoins: 1500,
    dailyAI: 35,
    coinMultiplier: "2×",
  },
  gold: {
    label: "Gold",
    launchCoins: 3000,
    dailyAI: 60,
    coinMultiplier: "3×",
  },
};

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const tier = searchParams.get("tier")?.toLowerCase();
  const { user, setUser } = useContext(AuthContext);
  const [showDashboardBtn, setShowDashboardBtn] = useState(false);
  const [activated, setActivated] = useState(false);
  const didActivate = useRef(false);

  const meta = TIER_META[tier];

  // Fire confetti on mount
  useEffect(() => {
    const fire = (angle, origin) =>
      confetti({
        particleCount: 80,
        spread: 70,
        angle,
        origin,
        colors: ["#e8722a", "#ec4899", "#e8722a", "#10b981"],
      });
    const t = setTimeout(() => {
      fire(60, { x: 0, y: 0.6 });
      fire(120, { x: 1, y: 0.6 });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Show "Go to Dashboard" button after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowDashboardBtn(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Update profile + award launch coins (runs once)
  useEffect(() => {
    if (!user?.id || !tier || !meta || didActivate.current) return;
    didActivate.current = true;

    const activate = async () => {
      await updateProfile(user.id, { founder_tier: tier });
      await awardCoins(user.id, meta.launchCoins, `${meta.label} Founder Pass launch coins`);
      setUser((prev) => ({ ...prev, founder_tier: tier }));
      setActivated(true);
    };
    activate();
  }, [user?.id, tier]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Purchase Complete!</h1>
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-[var(--text-primary)]" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome to the {meta.label} Founder Pass! 🎉
          </h1>
          <p className="text-muted-foreground mb-6">
            Your exclusive perks are now active.
          </p>

          {/* Unlocks */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-8 space-y-3 text-left">
            <p className="text-sm font-semibold text-foreground mb-1">What you unlocked:</p>
            <div className="flex items-center gap-3 text-sm">
              <Coins className="w-4 h-4 text-brand-orange flex-shrink-0" />
              <span><span className="font-semibold">{meta.launchCoins.toLocaleString()} coins</span> credited on launch day</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Zap className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span><span className="font-semibold">{meta.dailyAI} free AI calls/day</span> — forever</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Brain className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span><span className="font-semibold">{meta.coinMultiplier} coin multiplier</span> on all study sessions</span>
            </div>
          </div>

          {activated && (
            <p className="text-sm md:text-xs text-emerald-400 mb-4">
              ✓ {meta.launchCoins.toLocaleString()} coins added to your account
            </p>
          )}
        </motion.div>

        {/* CTA — shown after 3s */}
        {showDashboardBtn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button asChild className="bg-gradient-to-r from-orange-700 to-orange-600 hover:opacity-90 text-[var(--text-primary)] w-full">
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
