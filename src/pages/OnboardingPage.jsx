import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Cpu,
  FileText,
  Heart,
  Palette,
  Sparkles,
  TrendingUp,
  Mic2,
} from "lucide-react";
import { AuthContext } from "../App";
import { TRACKS, getTrack } from "../data/tracksData";
import { getProfile, updateProfile } from "../services/db";
import { awardBonusXP } from "../services/xpService";
import { supabase } from "../services/supabaseClient";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const ICON_MAP = { Cpu, Palette, TrendingUp, Mic2, Heart };

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12, 13];

function ProgressDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 text-lg" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={dot <= step ? "text-foreground" : "text-muted-foreground/40"}
          aria-hidden="true"
        >
          ●
        </span>
      ))}
    </div>
  );
}

function TrackOption({ track, selected, onSelect, index }) {
  const Icon = ICON_MAP[track.icon] ?? Cpu;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(track.id)}
      className={`group relative w-full overflow-hidden rounded-3xl border bg-card p-5 text-left transition-all ${
        selected
          ? `${track.colors.border} ${track.colors.bg} shadow-lg`
          : "border-border hover:border-border/80 hover:bg-card/90"
      }`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${track.colors.bgSolid}`} />
      <div className="flex items-start gap-4 pl-3">
        <div className={`rounded-2xl p-3 ${track.colors.bg}`}>
          <Icon className={`h-5 w-5 ${track.colors.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{track.name}</p>
              <p className={`mt-1 text-sm ${track.colors.text}`}>{track.tagline}</p>
            </div>
            {selected && (
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${track.colors.bgSolid}`}>
                <Check className="h-4 w-4 text-[var(--text-primary)]" />
              </div>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{track.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {track.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className={`rounded-full px-2.5 py-1 text-sm md:text-[11px] font-medium ${track.colors.badge}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function WelcomeVisual() {
  return (
    <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key="welcome"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-sm md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4" /> You are ready
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-base font-semibold text-foreground">+5 XP awarded</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your profile is set up. Let’s build your first project and portfolio card.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  const selectedTrackData = useMemo(() => getTrack(selectedTrack), [selectedTrack]);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      if (!user?.id) {
        navigate("/auth", { replace: true });
        return;
      }

      try {
        const { data: profile } = await getProfile(user.id);
        if (!active) return;
        if (profile?.onboarded) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (_) {
      } finally {
        if (active) setChecking(false);
      }
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, [navigate, user?.id]);

  const persistOnboarding = async () => {
    if (!user?.id || !selectedTrack) return false;

    setSaving(true);
    const { error } = await updateProfile(user.id, {
      onboarded: true,
      track_primary: selectedTrack,
      school: school.trim(),
      grade: Number(grade),
    });

    if (error) {
      toast.error(error.message || "Could not save onboarding");
      setSaving(false);
      return false;
    }

    await awardBonusXP(user.id, 5, "onboarding_bonus");
    await supabase.auth.refreshSession().catch(() => {});

    const nextUser = {
      ...(user ?? {}),
      onboarded: true,
      track_primary: selectedTrack,
      school: school.trim(),
      grade: Number(grade),
      xp: (user?.xp ?? 0) + 5,
    };
    setUser(nextUser);
    localStorage.setItem("auth_user", JSON.stringify(nextUser));
    setSaving(false);
    return true;
  };

  const handleComplete = async () => {
    const saved = await persistOnboarding();
    if (!saved) return;
    navigate("/dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading onboarding...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4 text-center">
          <ProgressDots step={currentStep} />
          <div className="mx-auto h-px w-full max-w-xs bg-border" />
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Step 1</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                  Hi {user?.name || "there"}! Which path excites you most?
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Pick one to start with. You can explore the others anytime.
                </p>
              </div>

              <div className="space-y-4">
                {TRACKS.map((track, index) => (
                  <TrackOption
                    key={track.id}
                    track={track}
                    index={index}
                    selected={selectedTrack === track.id}
                    onSelect={setSelectedTrack}
                  />
                ))}
              </div>

              {selectedTrack && (
                <div className="flex justify-end">
                  <Button size="lg" className="gap-2" onClick={() => setCurrentStep(2)}>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.section>
          )}

          {currentStep === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Step 2</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                  Add your school details
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  We use this to personalize your briefs and profile.
                </p>
              </div>

              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="school">School name</Label>
                    <Input
                      id="school"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Westlake High School"
                      className="bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade level</Label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full rounded-md border border-white/10 bg-background/60 px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select grade</option>
                      {GRADE_OPTIONS.map((item) => (
                        <option key={item} value={item}>Grade {item}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setCurrentStep(3)}
                  disabled={!school.trim() || !grade}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}

          {currentStep === 3 && (
            <motion.section
              key="step-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Step 3</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                  Welcome to Visionary Arc.
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  You’ll get +5 XP and head to your dashboard.
                </p>
              </div>

              <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-md">
                <CardContent className="space-y-6 p-6">
                  <div className="rounded-3xl border border-white/10 bg-background/40 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Track</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {selectedTrackData?.name ?? "Choose a track"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {selectedTrackData?.tagline}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {school} · Grade {grade}
                        </p>
                      </div>
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <WelcomeVisual />
                </CardContent>
              </Card>

              <div className="space-y-3 text-center">
                <Button
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleComplete}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Finish onboarding"}
                  {!saving && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
