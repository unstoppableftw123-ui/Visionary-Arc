import { useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../App";
import { toast } from "sonner";
import {
  getReferralCode,
  getReferralStats,
  getUserBadges,
  REFERRAL_MILESTONES,
} from "../services/referralService";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import {
  Check,
  Copy,
  Share2,
  Trophy,
  Users,
  Coins,
  Star,
  Zap,
  Gift,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

const DEFAULT_STATS = {
  total: 0,
  signed_up: 0,
  streak_7: 0,
  upgraded: 0,
  coins_earned: 0,
};

function MilestoneIcon({ milestone, achieved }) {
  if (milestone.count === 1)  return <Star  className={`w-5 h-5 ${achieved ? "text-brand-orange" : "text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]"}`} />;
  if (milestone.count === 5)  return <Trophy className={`w-5 h-5 ${achieved ? "text-brand-orange" : "text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]"}`} />;
  if (milestone.count === 10) return <Zap   className={`w-5 h-5 ${achieved ? "text-orange-400" : "text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]"}`} />;
  if (milestone.count === 25) return <Gift  className={`w-5 h-5 ${achieved ? "text-brand-orange" : "text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]"}`} />;
  return <Lock className="w-5 h-5 text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]" />;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, cursorY);
      line = `${word} `;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line.trim(), x, cursorY);
}

export default function ReferralPage() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setLoading(false);
      return () => { mounted = false; };
    }

    setLoading(true);
    Promise.all([
      getReferralStats(user.id),
      getUserBadges(user.id),
    ])
      .then(([s, b]) => {
        if (!mounted) return;
        setStats(s ?? DEFAULT_STATS);
        setBadges(b ?? []);
      })
      .catch(() => {
        if (mounted) setStats(DEFAULT_STATS);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [user?.id]);

  const referralCode = useMemo(() => getReferralCode(user?.id), [user?.id]);
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  // Determine the highest achieved milestone by referral count
  const totalReferrals = stats.total;
  const achievedMilestones = REFERRAL_MILESTONES.filter(
    (m) => totalReferrals >= m.count
  );
  const nextMilestone = REFERRAL_MILESTONES.find(
    (m) => totalReferrals < m.count
  );
  const prevMilestoneCount =
    achievedMilestones.length > 0
      ? achievedMilestones[achievedMilestones.length - 1].count
      : 0;
  const milestoneProgress = nextMilestone
    ? Math.min(
        100,
        ((totalReferrals - prevMilestoneCount) /
          (nextMilestone.count - prevMilestoneCount)) *
          100
      )
    : 100;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleShareImage = async () => {
    setSharing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#e8722a";
      ctx.font = "bold 64px sans-serif";
      ctx.fillText("Visionary Arc", 80, 130);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText(`${totalReferrals} referral${totalReferrals !== 1 ? "s" : ""} and counting!`, 80, 240);

      ctx.font = "36px sans-serif";
      wrapText(ctx, `Join me on Visionary Arc — ${referralLink}`, 80, 320, 920, 50);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "30px sans-serif";
      ctx.fillText(`Signed up: ${stats.signed_up}`, 80, 500);
      ctx.fillText(`7-day streaks: ${stats.streak_7}`, 80, 560);
      ctx.fillText(`Upgraded: ${stats.upgraded}`, 80, 620);
      ctx.fillText(`Coins earned: ${stats.coins_earned}`, 80, 680);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Image generation failed"));
        }, "image/png");
      });

      const file = new File([blob], "visionary-arc-referral.png", { type: "image/png" });
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Visionary Arc Referral",
          text: "Join me on Visionary Arc.",
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "visionary-arc-referral.png";
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success("Share image ready.");
    } catch {
      toast.error("Could not generate share image.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-[#0A0A0F] text-white font-sans">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2d1a05]/60 via-[#1a1a20]/80 to-[#0f0f14]/90 backdrop-blur-md p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading">Invite Friends, Unlock Rewards</h1>
              <p className="text-sm text-white/60">Share your link. Earn coins, XP, and exclusive badges.</p>
            </div>
          </div>

          {/* Referral link */}
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white/80 break-all">
            {referralLink}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCopy}
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-[var(--text-primary)] border-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button
              variant="outline"
              onClick={handleShareImage}
              disabled={sharing}
              className="gap-2 border-[var(--border)] text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] hover:text-[var(--text-primary)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_8%,transparent)]"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? "Generating…" : "Share as Image"}
            </Button>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total referrals", value: stats.total,        color: "text-orange-400" },
            { label: "Signed up",       value: stats.signed_up,    color: "text-emerald-400" },
            { label: "Hit 7-day streak",value: stats.streak_7,     color: "text-brand-orange" },
            { label: "Upgraded",        value: stats.upgraded,      color: "text-pink-400" },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-1"
            >
              <p className="text-sm md:text-xs text-white/50">{label}</p>
              <motion.p
                key={value}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className={`text-2xl font-bold ${color}`}
              >
                {loading ? <Skeleton className="h-7 w-14 bg-white/10" /> : value}
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Coins earned */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-orange" />
            <span className="text-sm text-white/60">Total coins earned from referrals</span>
          </div>
          <span className="text-2xl font-black text-brand-orange">
            {loading ? <Skeleton className="h-7 w-20 bg-white/10" /> : stats.coins_earned.toLocaleString()}
          </span>
        </motion.div>

        {/* Milestone progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Milestone Progress</h2>
            {nextMilestone && (
              <span className="text-sm md:text-xs text-white/50">
                {nextMilestone.count - totalReferrals} more to next milestone
              </span>
            )}
          </div>

          {/* Progress bar */}
          {nextMilestone && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-700 to-brand-orange"
                  initial={{ width: 0 }}
                  animate={{ width: `${milestoneProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-sm md:text-[10px] text-white/40">
                <span>{prevMilestoneCount}</span>
                <span>{nextMilestone.count}</span>
              </div>
            </div>
          )}

          {/* Milestone cards */}
          <div className="space-y-3">
            {REFERRAL_MILESTONES.map((milestone, i) => {
              const achieved = totalReferrals >= milestone.count;
              return (
                <motion.div
                  key={milestone.count}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className={`rounded-xl border p-4 flex items-start gap-3 ${
                    achieved
                      ? "border-brand-orange/30 bg-brand-orange/8"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      achieved ? "bg-brand-orange/20" : "bg-white/10"
                    }`}
                  >
                    <MilestoneIcon milestone={milestone} achieved={achieved} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold ${
                          achieved ? "text-brand-orange" : "text-white/60"
                        }`}
                      >
                        {milestone.label}
                      </span>
                      {achieved && (
                        <span className="text-sm md:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Achieved
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm md:text-xs text-white/50">
                      <span className="text-brand-orange/80">+{milestone.coins} coins</span>
                      <span className="text-orange-400/80">+{milestone.xp} XP</span>
                      {milestone.frame && (
                        <span className="text-pink-400/80">Avatar frame: {milestone.frame}</span>
                      )}
                      {milestone.toolUnlock && (
                        <span className="text-cyan-400/80">Unlock: bonus AI tool</span>
                      )}
                      {milestone.badge && (
                        <span className="text-brand-orange/80">Badge: {milestone.badge}</span>
                      )}
                    </div>
                  </div>

                  {/* Count bubble */}
                  <div
                    className={`text-sm md:text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                      achieved
                        ? "bg-brand-orange/20 text-brand-orange"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {milestone.count}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Earned badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-white">Earned Badges &amp; Frames</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.badge_key}
                  className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-600/10 px-3 py-1.5 text-sm md:text-xs text-orange-400"
                >
                  <Star className="w-3 h-3 text-brand-orange" />
                  {b.badge_key.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA to invite */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-orange-500/30 bg-orange-600/5 p-4 flex items-center justify-between gap-4"
        >
          <p className="text-sm text-white/60">
            Invite more friends to unlock community features faster.
          </p>
          <Button
            size="sm"
            onClick={handleCopy}
            className="bg-orange-600 hover:bg-orange-700 text-[var(--text-primary)] border-0 shrink-0"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Link
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
