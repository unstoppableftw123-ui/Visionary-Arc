import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Gift, Lock, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "../App";
import LockedFeatureOverlay from "../components/LockedFeatureOverlay";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useFeatureGate } from "../hooks/useFeatureGate";
import ArtifactChallengesPage from "./ArtifactChallengesPage";
import { supabase } from "../services/supabaseClient";
import { getTierForXP } from "../services/xpService";

const TIER_ORDER = ["Beginner", "Builder", "Creator", "Pro", "Elite"];
const TRACK_META = {
  tech: { label: "Tech", color: "#3B82F6", chip: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  "tech-ai": { label: "Tech AI", color: "#3B82F6", chip: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  design: { label: "Design", color: "#EC4899", chip: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  "design-branding": { label: "Design Branding", color: "#EC4899", chip: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  content: { label: "Content", color: "#8B5CF6", chip: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  "content-storytelling": { label: "Content Storytelling", color: "#8B5CF6", chip: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  business: { label: "Business", color: "#10B981", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  impact: { label: "Impact", color: "#F59E0B", chip: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  "social-impact": { label: "Social Impact", color: "#F59E0B", chip: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
};

function formatTrackLabel(track) {
  if (!track) return "General";
  return (
    TRACK_META[track]?.label ||
    track
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function getTrackMeta(track) {
  return (
    TRACK_META[track] || {
      label: formatTrackLabel(track),
      color: "#EAB308",
      chip: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    }
  );
}

function getTierIndex(tier) {
  return TIER_ORDER.indexOf(tier || "Beginner");
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(deadline));
}

function SponsorLogo({ challenge }) {
  if (challenge.sponsor_logo_url) {
    return (
      <img
        src={challenge.sponsor_logo_url}
        alt={`${challenge.sponsor_name || "Sponsor"} logo`}
        className="h-12 w-12 rounded-2xl object-cover border border-white/10 bg-white/5"
      />
    );
  }

  const name = challenge.sponsor_name || "Sponsor";
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${getTrackMeta(challenge.track).color}33 0%, rgba(255,255,255,0.08) 100%)`,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ChallengeSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/5" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-white/5" />
              <div className="h-5 w-32 rounded-full bg-white/5" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-white/5" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-4/5 rounded-full bg-white/5" />
          <div className="h-4 w-full rounded-full bg-white/5" />
          <div className="h-4 w-2/3 rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-white/5" />
          <div className="h-14 rounded-2xl bg-white/5" />
        </div>
        <div className="h-11 w-full rounded-xl bg-white/5" />
      </div>
    </motion.div>
  );
}

export default function ChallengesPage() {
  const { user } = useContext(AuthContext);
  const gate = useFeatureGate("challenge_board");
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [trackFilter, setTrackFilter] = useState("all");
  const [profileXP, setProfileXP] = useState(user?.xp ?? 0);

  useEffect(() => {
    let active = true;

    async function loadBoard() {
      setLoading(true);

      const [challengeResult, profileResult] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("status", "open")
          .order("deadline", { ascending: true }),
        user?.id
          ? supabase
              .from("profiles")
              .select("xp, status_tier")
              .eq("id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!active) return;

      if (challengeResult.error) {
        setChallenges([]);
        toast.error("Could not load sponsored challenges.");
      } else {
        setChallenges(challengeResult.data ?? []);
      }

      if (!profileResult.error && profileResult.data) {
        setProfileXP(profileResult.data.xp ?? user?.xp ?? 0);
      } else {
        setProfileXP(user?.xp ?? 0);
      }

      setLoading(false);
    }

    loadBoard();
    return () => {
      active = false;
    };
  }, [user?.id, user?.xp]);

  const userTier = getTierForXP(profileXP ?? 0);
  const tracks = useMemo(() => {
    return [...new Set(challenges.map((challenge) => challenge.track).filter(Boolean))];
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    if (trackFilter === "all") return challenges;
    return challenges.filter((challenge) => challenge.track === trackFilter);
  }, [challenges, trackFilter]);

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] px-4 py-8 sm:px-6 lg:px-8">
      {!gate.loading && !gate.unlocked && (
        <LockedFeatureOverlay
          featureName="Company Challenge Board"
          threshold={gate.threshold}
          currentUsers={gate.currentUsers}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/45">
                Sponsored Opportunities
              </p>
              <h1 className="font-[Clash_Display] text-3xl font-semibold text-white sm:text-4xl">
                Challenge Board
              </h1>
              <p className="max-w-2xl font-[Satoshi] text-sm text-white/65 sm:text-base">
                Explore live company-backed briefs, filter by track, and unlock higher-tier
                applications as your profile grows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="font-[Satoshi] text-xs uppercase tracking-[0.2em] text-white/40">
                  Your Tier
                </p>
                <p className="font-[Clash_Display] text-xl text-white">{userTier}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="font-[Satoshi] text-xs uppercase tracking-[0.2em] text-white/40">
                  Total XP
                </p>
                <p className="font-[Clash_Display] text-xl text-white">
                  {(profileXP ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setTrackFilter("all")}
            className={
              trackFilter === "all"
                ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
            }
          >
            All Tracks
          </Button>
          {tracks.map((track) => (
            <Button
              key={track}
              type="button"
              onClick={() => setTrackFilter(track)}
              className={
                trackFilter === track
                  ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
              }
            >
              {formatTrackLabel(track)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ChallengeSkeleton key={index} index={index} />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
              <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <p className="font-[Clash_Display] text-2xl text-white">No challenges in this track yet</p>
                <p className="max-w-md font-[Satoshi] text-sm text-white/60">
                  Try another track filter or check back soon for the next sponsor drop.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredChallenges.map((challenge, index) => {
              const trackMeta = getTrackMeta(challenge.track);
              const requiredTier =
                challenge.required_tier || challenge.required_status_tier || "Beginner";
              const canApply = getTierIndex(userTier) >= getTierIndex(requiredTier);
              const slotsRemaining = Math.max(
                0,
                (challenge.max_slots ?? 0) - (challenge.current_slots ?? 0)
              );
              const daysLeft = getDaysLeft(challenge.deadline);

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card
                    className="h-full overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
                    style={{
                      backgroundImage: `linear-gradient(180deg, ${trackMeta.color}12 0%, rgba(10,10,15,0) 38%)`,
                      boxShadow: `inset 3px 0 0 ${trackMeta.color}`,
                    }}
                  >
                    <CardContent className="flex h-full flex-col gap-5 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <SponsorLogo challenge={challenge} />
                          <div className="min-w-0">
                            <p className="truncate font-[Satoshi] text-sm text-white/55">
                              {challenge.sponsor_name || "Featured Sponsor"}
                            </p>
                            <h3 className="truncate font-[Clash_Display] text-xl text-white">
                              {challenge.title}
                            </h3>
                          </div>
                        </div>
                        <Badge className={`border ${trackMeta.chip}`}>{formatTrackLabel(challenge.track)}</Badge>
                      </div>

                      <p className="line-clamp-3 font-[Satoshi] text-sm leading-6 text-white/68">
                        {challenge.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="font-[Satoshi] text-[11px] uppercase tracking-[0.18em] text-white/40">
                            Reward
                          </p>
                          <p className="mt-2 flex items-center gap-2 font-[Clash_Display] text-base text-white">
                            <Gift className="h-4 w-4 text-yellow-400" />
                            {challenge.reward_value || "TBD"}
                          </p>
                          <p className="mt-1 font-[Satoshi] text-xs text-white/55">
                            {challenge.reward_type || "Prize"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="font-[Satoshi] text-[11px] uppercase tracking-[0.18em] text-white/40">
                            Required Tier
                          </p>
                          <p className="mt-2 flex items-center gap-2 font-[Clash_Display] text-base text-white">
                            <Lock className="h-4 w-4 text-orange-400" />
                            {requiredTier}
                          </p>
                          <p className="mt-1 font-[Satoshi] text-xs text-white/55">
                            {canApply ? "You can apply now" : `Locked for ${userTier}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div>
                          <p className="flex items-center gap-2 font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Deadline
                          </p>
                          <p className="mt-2 font-[Satoshi] text-sm text-white">
                            {formatDeadline(challenge.deadline)}
                          </p>
                          <p className="mt-1 font-[Satoshi] text-xs text-white/55">
                            {daysLeft === null ? "Flexible timing" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                          </p>
                        </div>

                        <div>
                          <p className="flex items-center gap-2 font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">
                            <Users className="h-3.5 w-3.5" />
                            Slots
                          </p>
                          <p className="mt-2 font-[Satoshi] text-sm text-white">
                            {slotsRemaining.toLocaleString()} remaining
                          </p>
                          <p className="mt-1 font-[Satoshi] text-xs text-white/55">
                            {(challenge.current_slots ?? 0).toLocaleString()} joined so far
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => {
                          if (!canApply) {
                            toast.error(`Reach ${requiredTier} tier to apply for this challenge.`);
                            return;
                          }
                          toast.success("Challenge applications will open from this board soon.");
                        }}
                        className={
                          canApply
                            ? "mt-auto bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                            : "mt-auto border border-white/10 bg-white/5 text-white/45 hover:bg-white/5"
                        }
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {canApply ? "Apply to Challenge" : `Locked Until ${requiredTier}`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <ArtifactChallengesPage embedded={true} />
      </div>
    </div>
  );
}
