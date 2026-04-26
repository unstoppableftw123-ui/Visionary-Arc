import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../App";
import apiService from "../services/apiService";
import {
  REWARDS,
  founderCoins,
  getNextMilestone,
  getLatestReachedMilestone,
} from "../data/rewardsProgram";
import { getFounderMeta, getFounderTier, isFounder } from "../lib/founder";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import PageHeader from "./PageHeader";
import {
  Lock,
  CheckCircle2,
  Star,
  Coins,
  ChevronRight,
  Gift,
  Zap,
  Sparkles,
} from "lucide-react";

// STATUS_TIER XP thresholds mapped to level card milestones
// Beginner 0 → levels 1,3,5,8 | Builder 500 → 10,15
// Creator 2000 → 20,25 | Pro 6000 → 30 | Elite 15000 → 40,50
const LEVEL_XP_THRESHOLD = {
  1: 0,
  3: 0,
  5: 0,
  8: 0,
  10: 500,
  15: 500,
  20: 2000,
  25: 2000,
  30: 6000,
  40: 15000,
  50: 15000,
};

export default function RewardsTrack() {
  const { user } = useContext(AuthContext);
  const [gamStats, setGamStats] = useState(null);
  const currentLevelRef = useRef(null);

  const founder = isFounder(user);
  const founderMeta = getFounderMeta(user);
  const founderTier = getFounderTier(user);

  useEffect(() => {
    apiService.gamification.getStats().then(setGamStats).catch(() => {});
  }, []);

  // Scroll to current milestone once data loads
  useEffect(() => {
    if (gamStats && currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [gamStats]);

  const currentLevel = gamStats?.level ?? 1;
  const levelProgress = gamStats?.level_progress ?? 0;
  const xpInLevel = gamStats?.xp_in_level ?? 0;
  const xpForNext = gamStats?.xp_for_next_level ?? 100;

  // Real XP from AuthContext — falls back to gamStats or 0 for mock
  const userXP = user?.xp ?? gamStats?.xp ?? 0;

  const latestReached = getLatestReachedMilestone(currentLevel);
  const nextMilestone = getNextMilestone(currentLevel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto pb-12"
    >
      <PageHeader
        title="Rewards Track"
        subtitle="Every level brings something new — here's everything you've earned and what's ahead."
      />

      {/* Current level summary card */}
      <Card className="mb-8 border-primary/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <CardContent className="pt-5 pb-5 relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm md:text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Your Level
              </p>
              <p className="text-5xl font-bold leading-none text-foreground">
                {currentLevel}
              </p>
              {latestReached && (
                <p className="text-sm text-muted-foreground mt-1">
                  {latestReached.emoji ? `${latestReached.emoji} ` : ""}
                  {latestReached.title}
                </p>
              )}
            </div>
            {nextMilestone && (
              <div className="text-right shrink-0">
                <p className="text-sm md:text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Next Reward
                </p>
                <p className="text-sm font-semibold">
                  Level {nextMilestone.level}
                </p>
                <p className="text-sm md:text-xs text-muted-foreground">
                  {nextMilestone.emoji ? `${nextMilestone.emoji} ` : ""}
                  {nextMilestone.title}
                </p>
                <p className="text-sm md:text-xs text-brand-orange font-medium mt-0.5">
                  +{nextMilestone.coins} coins
                </p>
              </div>
            )}
          </div>

          <Progress value={levelProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm md:text-xs text-muted-foreground">
            <span>{xpInLevel} XP</span>
            <span>{xpForNext} XP to next level</span>
          </div>

          {nextMilestone && (
            <p className="text-sm md:text-xs text-primary mt-2">
              Next reward at Level {nextMilestone.level}:{" "}
              {nextMilestone.coins} coins + {nextMilestone.unlocks[0]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vertical rewards track */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-3">
          {REWARDS.map((reward) => {
            const isPast = reward.level < (latestReached?.level ?? Infinity);
            const isCurrent = reward.level === latestReached?.level;
            const isFuture = !isPast && !isCurrent;
            const isMilestone = reward.isMilestone;
            const isUltimateTease = reward.level >= 40;

            // XP threshold for this reward tier (from STATUS_TIER mapping)
            const xpThreshold = LEVEL_XP_THRESHOLD[reward.level] ?? 0;
            const isXpUnlocked = userXP >= xpThreshold;
            // Locked = future AND user hasn't reached the required XP tier
            const isLocked = isFuture && !isXpUnlocked;

            // Coin preview for future levels considering founder tier
            const earnableCoins = founderCoins(reward.coins, founderTier);
            const showFounderBonus = isFuture && founder && founderTier !== "seed" && earnableCoins !== reward.coins;

            // Card border + background styling
            const cardClassName = (() => {
              if (isPast) return "border-green-500/15 bg-green-500/5 opacity-65";
              if (isCurrent)
                return "border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--text-primary)_5%,transparent)] backdrop-blur-md shadow-[0_0_20px_var(--accent-glow)]";
              if (isLocked)
                return "bg-[color:color-mix(in_srgb,var(--text-primary)_5%,transparent)] backdrop-blur-md border-[var(--border)]";
              if (isMilestone) return "border-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_5%,transparent)]";
              return "border-border";
            })();

            return (
              <div
                key={reward.level}
                ref={isCurrent ? currentLevelRef : null}
                className="relative pl-14"
              >
                {/* Level circle */}
                <div
                  className={`absolute left-0 w-12 h-12 flex items-center justify-center rounded-full font-bold text-sm z-10 border-2 transition-all ${
                    isPast
                      ? "bg-green-500/15 border-green-500/60 text-green-400"
                      : isCurrent
                      ? "bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] border-[var(--accent)] text-[var(--accent)]"
                      : isMilestone
                      ? "bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] text-[var(--accent)]"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <span>{reward.level}</span>
                  )}
                </div>

                {/* Pulse animation on current level */}
                {isCurrent && (
                  <motion.div
                    className="absolute left-0 w-12 h-12 rounded-full border-2 border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] pointer-events-none z-10"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Reward card */}
                <Card className={`border transition-all ${cardClassName}`}>
                  <CardContent
                    className={`relative ${isMilestone ? "pt-4 pb-4" : "pt-3 pb-3"}`}
                  >
                    {/* Padlock icon — top-right corner for locked cards */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 z-20 pointer-events-none">
                        <Lock className="w-4 h-4 text-[var(--accent)]" />
                      </div>
                    )}

                    {/* Card body — blurred + non-interactive when locked */}
                    <div
                      style={
                        isLocked
                          ? { filter: "blur(3px)", pointerEvents: "none", userSelect: "none" }
                          : {}
                      }
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <p
                          className={`font-semibold leading-tight ${
                            isMilestone ? "text-base" : "text-sm"
                          } ${
                            isPast
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {reward.emoji ? `${reward.emoji} ` : ""}Level {reward.level} —{" "}
                          {reward.title}
                        </p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* "You are here" badge — pulsing */}
                          {isCurrent && (
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Badge className="text-sm md:text-[10px] px-1.5 py-0 bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]">
                                You are here
                              </Badge>
                            </motion.div>
                          )}

                          {/* Claimed badge for past levels */}
                          {isPast && (
                            <Badge className="text-sm md:text-[10px] px-1.5 py-0 bg-green-500/15 text-green-400 border-green-500/25">
                              Claimed
                            </Badge>
                          )}

                          {/* XP-unlocked future levels get a subtle green check */}
                          {isFuture && isXpUnlocked && (
                            <Badge className="text-sm md:text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Rewards list */}
                      <ul className="space-y-1.5">
                        {/* Coins */}
                        <li className="flex items-center gap-1.5 text-sm md:text-xs">
                          <Coins
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isFuture
                                ? "text-[var(--accent)]"
                                : isPast
                                ? "text-muted-foreground"
                                : "text-[var(--accent)]"
                            }`}
                          />
                          <span
                            className={`${isPast ? "line-through text-muted-foreground" : ""} ${
                              isFuture ? "text-[var(--accent)] font-medium" : ""
                            }`}
                          >
                            +{reward.coins} coins
                          </span>
                          {showFounderBonus && (
                            <span className="text-sm md:text-[10px] text-muted-foreground">
                              ({founderMeta.label.split(" ")[0]} founders:{" "}
                              {earnableCoins} coins)
                            </span>
                          )}
                        </li>

                        {/* Unlocks */}
                        {reward.unlocks.map((u, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm md:text-xs">
                            {isFuture ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <Gift
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isPast ? "text-muted-foreground" : "text-primary"
                                }`}
                              />
                            )}
                            <span className={isPast ? "line-through text-muted-foreground" : ""}>{u}</span>
                          </li>
                        ))}

                        {/* Badge */}
                        {reward.badge && (
                          <li className="flex items-center gap-1.5 text-sm md:text-xs">
                            {isFuture ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <Star
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isPast ? "text-muted-foreground" : "text-brand-orange"
                                }`}
                              />
                            )}
                            <span className={isPast ? "line-through text-muted-foreground" : ""}>
                              {reward.badge}
                            </span>
                          </li>
                        )}

                        {/* Bonuses */}
                        {reward.bonuses.map((b, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm md:text-xs">
                            {isFuture ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <Zap
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isPast ? "text-muted-foreground" : "text-primary"
                                }`}
                              />
                            )}
                            <span className={isPast ? "line-through text-muted-foreground" : ""}>{b}</span>
                          </li>
                        ))}

                        {/* Specials */}
                        {reward.specials.map((s, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm md:text-xs">
                            {isFuture ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <Sparkles
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isPast ? "text-muted-foreground" : "text-orange-400"
                                }`}
                              />
                            )}
                            <span className={isPast ? "line-through text-muted-foreground" : ""}>{s}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Note */}
                      {reward.note && (
                        <p className="text-sm md:text-[10px] text-muted-foreground mt-2 italic">{reward.note}</p>
                      )}

                      {/* XP progress bar — only on current milestone */}
                      {isCurrent && (
                        <div className="mt-3 pt-3 border-t border-brand-orange/15">
                          <div className="flex justify-between text-sm md:text-[11px] text-muted-foreground mb-1.5">
                            <span>Progress to next level</span>
                            <span>{xpInLevel} / {xpForNext} XP</span>
                          </div>
                          <Progress value={levelProgress} className="h-1.5" />
                        </div>
                      )}

                      {/* Founder tease for levels 40 and 50 */}
                      {isUltimateTease && isFuture && (
                        <div className="mt-3 pt-2.5 border-t border-border">
                          <Link
                            to="/pricing"
                            className="flex items-center gap-1 text-sm md:text-[11px] text-primary hover:text-primary/70 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            Reach this faster with a Founder Pass
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Centered unlock overlay — sits above the blurred content */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-sm md:text-xs font-semibold text-brand-orange bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-brand-orange/20">
                          Unlocks at {xpThreshold.toLocaleString()} XP
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
