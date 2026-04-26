import { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Skeleton, DashboardCardSkeleton } from "../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Calendar } from "../components/ui/calendar";
import { Slider } from "../components/ui/slider";
import { Badge } from "../components/ui/badge";
import { AuthContext } from "../App";
import apiService, { streaksAPI } from "../services/apiService";
import { getMissions, claimMission, seedDailyMissions } from "../services/missionService";
import {
  getProfile,
  getStreak,
  getDailyMissions,
  seedDailyMissions as dbSeedMissions,
  claimMission as dbClaimMission,
  awardXP,
  awardCoins,
} from "../services/db";
import { supabase } from "../services/supabaseClient";
import { joinClass } from "../services/classService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import FounderBadge from "../components/FounderBadge";
import PageHeader from "../components/PageHeader";
import CommunityProgressBar from "../components/CommunityProgressBar";
import AssignmentRadar from "../components/AssignmentRadar";
import { toast } from "sonner";
import { isFounder, getFounderMeta, TIER_META, canUpgrade, nextTier, formatPurchaseDate } from "../lib/founder";
import { REWARDS } from "../data/rewardsProgram";
import TierBadge from "../components/ui/TierBadge";
import { getTierForXP, getRankFromXP } from "../services/xpService";
import {
  CheckSquare,
  Flame,
  Calendar as CalendarIcon,
  TrendingUp,
  Book,
  Users,
  Gift,
  Plus,
  ArrowRight,
  Trophy,
  Star,
  Coins,
  Target,
  GraduationCap,
  Zap,
  BadgeCheck,
  ChevronRight,
  Share2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";
import {
  getLast7DaysCompletions,
  getLast14DaysXp,
  getSubjectScores,
  getHeatmapData
} from "../utils/dashboardAnalytics";

const DAILY_TRACKS = [
  "Business",
  "Technology",
  "Creative Arts",
  "Science",
  "Social Impact",
  "Health & Wellness",
  "Education",
];

function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-56" delay={0} />
        <Skeleton className="h-4 w-44" delay={40} />
      </div>

      {/* Bento grid — 4 card skeletons */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {/* Today's Progress — spans 2 cols */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" delay={80} />
            <Skeleton className="h-4 w-36" delay={100} />
          </div>
          <Skeleton className="h-3 w-full rounded-full" delay={120} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl bg-secondary/50 p-3 space-y-2">
                <Skeleton className="h-7 w-12 mx-auto" delay={140 + i * 30} />
                <Skeleton className="h-2.5 w-16 mx-auto" delay={160 + i * 30} />
              </div>
            ))}
          </div>
        </div>

        {/* Streak card */}
        <DashboardCardSkeleton index={1} />

        {/* XP & Level card */}
        <DashboardCardSkeleton index={2} />

        {/* Missions / Weekly Goals card — spans 2 cols */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" delay={200} />
            <Skeleton className="h-4 w-32" delay={220} />
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton circle className="h-8 w-8 shrink-0" delay={240 + i * 40} />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" delay={260 + i * 40} />
                <Skeleton className="h-2 w-full rounded-full" delay={280 + i * 40} />
              </div>
              <Skeleton className="h-7 w-16 rounded-md shrink-0" delay={300 + i * 40} />
            </div>
          ))}
        </div>

        {/* Tasks card */}
        <DashboardCardSkeleton index={3} />

        {/* Brief Opportunity placeholder */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-48" delay={340} />
          <Skeleton className="h-3 w-full" delay={360} />
          <Skeleton className="h-8 w-40 rounded-lg" delay={380} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [supabaseData, setSupabaseData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [streakInfo, setStreakInfo] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      if (user?.id) {
        await seedDailyMissions(user.id);
      }
      const [statsRes, tasksRes, missionsRes, gamRes, streakRes] = await Promise.all([
        apiService.tasks.getStats(),
        apiService.tasks.getTasks(),
        user?.id ? getMissions(user.id) : Promise.resolve([]),
        apiService.gamification.getStats(),
        streaksAPI.getStreak(),
      ]);
      setStats(statsRes);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setMissions(Array.isArray(missionsRes) ? missionsRes : []);
      setGamificationStats(gamRes);
      setStreakInfo(streakRes);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(true);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Supabase real-data fetch (runs when USE_MOCK is not set)
  useEffect(() => {
    if (!user?.id) return;
    if (process.env.REACT_APP_USE_MOCK === 'true') return;
    const loadSupabase = async () => {
      try {
        // Build date range for last 7 days
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });
        const rangeStart = last7[0];

        const [{ data: profile }, { data: streak }, { data: missionsData }, { data: sessions }] = await Promise.all([
          getProfile(user.id),
          getStreak(user.id),
          getDailyMissions(user.id),
          supabase
            .from('study_sessions')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', rangeStart),
        ]);

        // Derive which of last 7 days had activity
        const activeDaySet = new Set(
          (sessions ?? []).map(s => s.created_at?.split('T')[0]).filter(Boolean)
        );
        const activeDays = last7.map(d => ({ date: d, active: activeDaySet.has(d) }));

        let finalMissions = missionsData;
        if (!missionsData || missionsData.length === 0) {
          await dbSeedMissions(user.id);
          const { data: seeded } = await getDailyMissions(user.id);
          finalMissions = seeded || [];
        }
        setSupabaseData({ profile, streak, missions: finalMissions, activeDays });
      } catch (err) {
        console.error("Supabase fetch error:", err);
      }
    };
    loadSupabase();
  }, [user?.id]);

  const handleClaimSupabaseMission = async (mission) => {
    if (!mission.completed || mission.claimed) return;
    try {
      const { data, error } = await dbClaimMission(mission.id, user.id);
      if (error) throw error;
      const xp = data?.xp_reward ?? mission.xp_reward ?? 0;
      const coins = data?.coins_reward ?? mission.coins_reward ?? 0;
      await Promise.all([
        awardXP(user.id, xp),
        awardCoins(user.id, coins, `Mission: ${mission.title}`),
      ]);
      toast.success(`Claimed ${xp} XP and ${coins} coins!`);
      // Refresh Supabase missions
      const { data: updated } = await getDailyMissions(user.id);
      setSupabaseData(prev => ({ ...prev, missions: updated || [] }));
    } catch (err) {
      toast.error(err?.message || "Failed to claim mission");
    }
  };

  const handleClaimMission = async (missionId) => {
    try {
      const response = await claimMission(user.id, missionId);
      toast.success(`Claimed ${response.xp_earned} XP and ${response.coins_earned} coins!`);
      fetchData();
    } catch (err) {
      toast.error(err?.message || "Failed to claim");
    }
  };

  const brokenValue = streakInfo?.broken_streak_value || 0;
  const repairCost = Math.min(brokenValue * 5, 200);
  const canRepair = brokenValue > 0 && streakInfo?.broken_streak_date &&
    (Date.now() - new Date(streakInfo.broken_streak_date).getTime() < 86400000);

  const handleRepairStreak = async () => {
    setRepairLoading(true);
    try {
      await apiService.coins.spend(repairCost, 'streak_repair');
      await streaksAPI.repair();
      setRepairModalOpen(false);
      const [s, gam] = await Promise.all([streaksAPI.getStreak(), apiService.gamification.getStats()]);
      setStreakInfo(s);
      setGamificationStats(gam);
      setStats(prev => ({ ...prev, max_streak: s.current_streak }));
      toast.success(`${brokenValue}-day streak restored!`);
    } catch (err) {
      toast.error("Failed to repair streak");
    } finally {
      setRepairLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) { toast.error("Enter a class code"); return; }
    setJoinLoading(true);
    try {
      const cls = await joinClass(user.id, joinCode.trim());
      toast.success(`Joined "${cls.name}"!`);
      setJoinClassOpen(false);
      setJoinCode("");
    } catch (err) {
      toast.error(err?.message || "Failed to join class");
    } finally {
      setJoinLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => !t.completed);
  const todayCompleted = tasks.filter(t => t.check_ins?.includes(todayStr)).length;
  const completionRate = todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 100 : 0;

  // Get dates with check-ins for calendar
  const checkInDates = tasks.flatMap(t => t.check_ins || []).map(d => new Date(d));

  // My Analytics derived data (from tasks only)
  const barData = getLast7DaysCompletions(tasks);
  const lineData = getLast14DaysXp(tasks);
  const radarData = getSubjectScores(tasks);
  const heatmapWeeks = getHeatmapData(tasks);

  const quickLinks = [
    { icon: <CheckSquare className="w-5 h-5" />, label: "Tasks", href: "/tasks", color: "bg-brand-card text-brand-orange" },
    { icon: <Book className="w-5 h-5" />, label: "Study Hub", href: "/study", color: "bg-orange-600/10 dark:bg-orange-600/10 text-orange-400 dark:text-orange-400" },
    { icon: <GraduationCap className="w-5 h-5" />, label: "SAT / ACT", href: "/practice", color: "bg-orange-600/10 dark:bg-orange-600/10 text-orange-400 dark:text-orange-400" },
    { icon: <Trophy className="w-5 h-5" />, label: "Competitions", href: "/competitions", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
    { icon: <Gift className="w-5 h-5" />, label: "Shop", href: "/shop", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" },
    { icon: <BadgeCheck className="w-5 h-5" />, label: "My Grades", href: "/grades", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" },
  ];

  const isLite    = user?.plan === "lite";
  const founder   = isFounder(user);
  const founderMeta = getFounderMeta(user);

  const currentXp = supabaseData?.profile?.xp ?? gamificationStats?.xp ?? 0;
  const userTier = getTierForXP(currentXp);
  const userRank = getRankFromXP(currentXp);

  // Today's track rotates by day of week
  const todayTrack = DAILY_TRACKS[new Date().getDay()];
  const fallbackDailyMissions = missions.filter((mission) => mission.mission_type === "daily");
  const displayedMissions = supabaseData?.missions?.length > 0
    ? supabaseData.missions.slice(0, 4)
    : fallbackDailyMissions.slice(0, 4);
  const missionsLoadingState = !supabaseData && fallbackDailyMissions.length === 0;

  if (error) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[50vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="max-w-md w-full border-border">
          <CardHeader>
            <CardTitle className="text-lg">Couldn't load dashboard</CardTitle>
            <p className="text-sm text-muted-foreground">
              Make sure the backend is running, or switch to mock mode in <code className="text-sm md:text-xs bg-muted px-1 rounded">apiService.js</code> (USE_REAL_API = false).
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchData()}>Try again</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-testid="dashboard"
      className="pb-4"
    >
        {/* Founder Welcome Banner */}
        {founder && founderMeta && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl border flex items-center justify-between gap-3 bg-gradient-to-r ${founderMeta.gradient} bg-opacity-10`}
            style={{ background: `linear-gradient(135deg, ${founderMeta.gradient.includes("emerald") ? "rgba(52,211,153,0.08)" : founderMeta.gradient.includes("amber") ? "rgba(245,158,11,0.08)" : founderMeta.gradient.includes("slate") ? "rgba(148,163,184,0.08)" : "rgba(251,191,36,0.08)"}, transparent)` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{founderMeta.emoji}</span>
              <div>
                <p className={`text-sm font-semibold ${founderMeta.text}`}>{founderMeta.label} — Active</p>
                <p className="text-sm md:text-xs text-muted-foreground">Lifetime access · All benefits unlocked</p>
              </div>
            </div>
            <FounderBadge user={user} size="sm" />
          </motion.div>
        )}

        <PageHeader
          title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
          subtitle="Here's your productivity overview"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              const slug = user?.username ?? user?.name?.toLowerCase().replace(/\s+/g, '-') ?? user?.id;
              navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`).then(() => {
                toast.success('Profile link copied!', { description: `${window.location.origin}/u/${slug}` });
              }).catch(() => {
                toast.error('Could not copy link');
              });
            }}
          >
            <Share2 size={14} />
            Share Profile
          </Button>
        </PageHeader>

        <AssignmentRadar tasks={tasks} />

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {/* Today's Progress - Spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-2"
          >
            <Card className="h-full border-border hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{Math.round(completionRate)}%</span>
                  </div>
                  <Slider
                    value={[completionRate]}
                    max={100}
                    step={1}
                    disabled
                    className="cursor-default"
                    data-testid="completion-slider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <p className="text-2xl font-semibold">{stats?.total_tasks || 0}</p>
                    <p className="text-sm md:text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <p className="text-2xl font-semibold">{todayCompleted}</p>
                    <p className="text-sm md:text-xs text-muted-foreground">Completed Today</p>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <p className="text-2xl font-semibold">{stats?.max_streak || 0}</p>
                    <p className="text-sm md:text-xs text-muted-foreground">Best Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {(() => {
              const currentStreak = supabaseData?.streak?.current_streak ?? stats?.max_streak ?? 0;
              const lastActive    = supabaseData?.streak?.last_activity_date ?? null;
              const todayDate     = new Date().toISOString().split('T')[0];
              const yesterday     = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
              const atRisk        = lastActive === yesterday && lastActive !== todayDate;
              const activeDays    = supabaseData?.activeDays ?? [];

              // Next milestone
              let milestoneAt = null, milestoneLabel = '';
              if (currentStreak < 7)  { milestoneAt = 7;  milestoneLabel = '+200 XP, +50 coins'; }
              else if (currentStreak < 30) { milestoneAt = 30; milestoneLabel = '+1,000 XP, +200 coins'; }
              const daysToMilestone = milestoneAt ? milestoneAt - currentStreak : 0;

              return (
                <Card className="h-full border-border hover:shadow-medium transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                  <CardContent className="pt-5 pb-4 flex flex-col gap-3 h-full">
                    {/* Flame + count */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                        <Flame className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold leading-none">
                          {currentStreak >= 7 ? `🏆 ${currentStreak}` : currentStreak}
                        </p>
                        <p className="text-sm md:text-xs text-muted-foreground mt-0.5">
                          {currentStreak === 1 ? '1-day streak' : `${currentStreak}-day streak`}
                        </p>
                      </div>
                      {canRepair && (
                        <Button size="sm" variant="outline" onClick={() => setRepairModalOpen(true)} className="ml-auto border-orange-300 px-2 text-orange-600">
                          Repair
                        </Button>
                      )}
                    </div>

                    {/* 7-day calendar row */}
                    {activeDays.length > 0 && (
                      <div className="flex items-center justify-between gap-1">
                        {activeDays.map(({ date, active }) => {
                          const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
                          const isToday  = date === todayDate;
                          return (
                            <div key={date} className="flex flex-col items-center gap-1">
                              <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                              <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                                active
                                  ? 'bg-orange-400 border-orange-400'
                                  : isToday
                                  ? 'border-orange-300 border-dashed'
                                  : 'border-border'
                              }`} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* At-risk warning */}
                    {atRisk && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-brand-orange/10 border border-brand-orange/30 px-2.5 py-1.5">
                        <Flame className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <p className="text-sm md:text-[11px] font-medium text-brand-deep dark:text-brand-orange">
                          At risk — study today!
                        </p>
                      </div>
                    )}

                    {/* Next milestone */}
                    {milestoneAt && (
                      <p className="text-sm md:text-[11px] text-muted-foreground">
                        {daysToMilestone} day{daysToMilestone !== 1 ? 's' : ''} to {milestoneAt}-day bonus ({milestoneLabel})
                      </p>
                    )}

                    {!milestoneAt && (
                      <p className="text-sm md:text-xs text-orange-600 dark:text-orange-400">Elite streak! 🔥 Keep it going!</p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>

          {/* XP & Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="h-full border-border hover:shadow-medium transition-shadow bg-gradient-to-br from-orange-700 to-orange-600 dark:from-orange-900/30 dark:to-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-400" />
                    <span className="font-medium">Level {supabaseData?.profile?.level ?? gamificationStats?.level ?? 1}</span>
                  </div>
                  <div className="flex items-center gap-1 text-brand-orange">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{supabaseData?.profile?.coins ?? gamificationStats?.coins ?? 0}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="xp-bar-track" style={{ height: 8 }}>
                    <div
                      className="xp-bar-fill"
                      data-rank={userRank}
                      style={{ width: `${gamificationStats?.level_progress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{gamificationStats?.xp_in_level || 0} XP</span>
                  <span>{gamificationStats?.xp_for_next_level || 100} XP</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm md:text-xs" style={{ color: "var(--text-secondary)" }}>
                    {currentXp.toLocaleString()} Total XP
                  </p>
                  <TierBadge label={userTier} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Founder Pass Card — shown instead of Quick Links header slot for founders */}
          {founder && founderMeta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Card className={`h-full border-2 ${founderMeta.border} relative overflow-hidden`}>
                {/* Subtle gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${founderMeta.gradient} opacity-5 pointer-events-none`} />

                <CardContent className="pt-5 pb-4 relative z-10">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${founderMeta.gradient} flex items-center justify-center text-[var(--text-primary)] shadow-lg`}>
                      <span className="text-lg leading-none">{founderMeta.emoji}</span>
                    </div>
                    <span className={`text-sm md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${founderMeta.bg} ${founderMeta.text} border ${founderMeta.border}`}>
                      Active
                    </span>
                  </div>

                  <p className="font-semibold text-sm mb-0.5">{founderMeta.label}</p>
                  <p className="text-sm md:text-xs text-muted-foreground mb-3">
                    {formatPurchaseDate(user?.founder_paid_at)
                      ? `Purchased ${formatPurchaseDate(user.founder_paid_at)}`
                      : "Lifetime access"}
                  </p>

                  {/* Perks preview */}
                  <ul className="space-y-1.5 mb-4">
                    {founderMeta.perks.slice(0, 3).map((perk, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm md:text-xs">
                        <BadgeCheck className={`w-3.5 h-3.5 flex-shrink-0 ${founderMeta.text}`} />
                        <span className="text-muted-foreground">{perk}</span>
                      </li>
                    ))}
                    {founderMeta.perks.length > 3 && (
                      <li className={`text-sm md:text-xs ${founderMeta.text} font-medium pl-5`}>
                        +{founderMeta.perks.length - 3} more benefits
                      </li>
                    )}
                  </ul>

                  {/* Upgrade CTA or "Top tier" indicator */}
                  {canUpgrade(user) && nextTier(user) ? (
                    <Link to="/pricing">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`w-full ${founderMeta.border} ${founderMeta.text} hover:${founderMeta.bg}`}
                      >
                        Upgrade to {TIER_META[nextTier(user)]?.label}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <div className={`text-center text-sm md:text-xs font-medium ${founderMeta.text} py-1`}>
                      👑 Top tier — thank you!
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:row-span-2"
          >
            <Card className="h-full border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickLinks.map((link, index) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center`}>
                      {link.icon}
                    </div>
                    <span className="flex-1 font-medium text-sm">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
                {user?.role === "student" && (
                  <button
                    onClick={() => setJoinClassOpen(true)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors group w-full text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-deep dark:text-brand-orange flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="flex-1 font-medium text-sm">Join Class</span>
                    <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar - Spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-2"
          >
            <Card className="border-border hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  Activity Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    checkin: checkInDates
                  }}
                  modifiersStyles={{
                    checkin: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: '50%'
                    }
                  }}
                  className="rounded-md"
                  data-testid="activity-calendar"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Missions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="col-span-2 lg:col-span-1"
          >
            <Card className="h-full border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  Daily Missions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {missionsLoadingState ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center">
                    <p className="font-medium text-foreground">Your daily missions are loading...</p>
                  </div>
                ) : displayedMissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center">
                    <p className="font-medium text-foreground">No missions today — check back tomorrow!</p>
                  </div>
                ) : supabaseData?.missions?.length > 0 ? (
                  displayedMissions.map((mission) => {
                    const progress = mission.progress ?? 0;
                    const target = mission.target ?? 1;
                    const pct = Math.min(100, Math.round((progress / target) * 100));
                    return (
                      <div
                        key={mission.id}
                        className="p-3 rounded-lg"
                        style={{
                          border: mission.completed ? "1px solid var(--rank-d)" : "1px solid var(--border)",
                          background: mission.completed ? "rgba(34,197,94,0.08)" : "var(--surface-2)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: mission.completed ? "var(--rank-d)" : "var(--text-primary)" }}>
                              {mission.title}
                            </p>
                            {mission.description && (
                              <p className="text-sm md:text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{mission.description}</p>
                            )}
                            <div className="mt-1.5 space-y-1">
                              <div className="flex items-center justify-between text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
                                <span>{progress} / {target}</span>
                                <span className="flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" style={{ color: "var(--rank-b)" }} /> {mission.xp_reward} XP
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Coins className="w-3 h-3" style={{ color: "var(--accent)" }} /> {mission.coins_reward}
                                  </span>
                                </span>
                              </div>
                              <div className="xp-bar-track" style={{ height: 6 }}>
                                <div className="xp-bar-fill" data-rank={mission.completed ? "D" : "C"} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 shrink-0">
                            {mission.completed && !mission.claimed && (
                              <Button
                                size="sm"
                                onClick={() => handleClaimSupabaseMission(mission)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Claim
                              </Button>
                            )}
                            {mission.claimed && (
                              <Badge variant="secondary" className="tag-green">Claimed</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  displayedMissions.map((mission) => (
                    <div
                      key={mission.mission_id}
                      className={`p-3 rounded-lg border ${mission.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-secondary/50 border-transparent'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${mission.completed ? 'text-green-700 dark:text-green-400' : ''}`}>
                            {mission.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm md:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-orange-400" /> {mission.xp_reward} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-brand-orange" /> {mission.coin_reward}
                            </span>
                          </div>
                        </div>
                        {mission.completed && !mission.claimed && (
                          <Button
                            size="sm"
                            onClick={() => handleClaimMission(mission.mission_id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Claim
                          </Button>
                        )}
                        {mission.claimed && (
                          <Badge variant="secondary" className="tag-green">Claimed</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {missions.length === 0 && !supabaseData?.missions?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading missions...
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-2 lg:col-span-1"
          >
            <Card className="h-full border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Recent Tasks</CardTitle>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {tasks.slice(0, 4).map((task, index) => (
                  <div 
                    key={task.task_id} 
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full ${task.check_ins?.includes(todayStr) ? 'bg-green-500' : 'bg-muted'}`}></div>
                    <span className={`flex-1 text-sm ${task.check_ins?.includes(todayStr) ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.streak > 0 && (
                      <span className="text-sm md:text-xs text-orange-500 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {task.streak}
                      </span>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-4">No tasks yet</p>
                    <Link to="/tasks">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Task
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {/* Today's Brief Opportunity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className="col-span-2"
          >
            <Card className="h-full border-border bg-gradient-to-br from-orange-700 to-sky-50 dark:from-orange-900/30 dark:to-sky-950/30">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/10 dark:bg-orange-600/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <Badge variant="secondary" className="text-sm md:text-[10px] bg-orange-600/10 dark:bg-orange-600/10 text-orange-400 dark:text-orange-400 border-orange-500/30 dark:border-orange-500/30 shrink-0">
                    Daily
                  </Badge>
                </div>
                <p className="text-sm md:text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  Today's Track
                </p>
                <p className="text-base font-semibold text-orange-400 dark:text-orange-400 mb-1">
                  {todayTrack}
                </p>
                <p className="text-sm md:text-xs text-muted-foreground mb-4">
                  Get an AI-generated project brief tailored to this week's theme.
                </p>
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-[var(--text-primary)] gap-1.5"
                  onClick={() => {
                    toast.info("Tracks coming soon!", {
                      description: "Project briefs are on the roadmap. Stay tuned!",
                    });
                  }}
                >
                  Generate My Brief
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rewards Track Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="col-span-2"
          >
            <Card className="h-full border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  Rewards Track
                </CardTitle>
                <Link to="/rewards">
                  <Button variant="ghost" size="sm" className="text-sm md:text-xs gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {(() => {
                  const currentLevel = gamificationStats?.level ?? 1;
                  const upcoming = REWARDS.filter((r) => r.level > currentLevel).slice(0, 2);
                  if (upcoming.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        You've reached the highest milestone! 🏆
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2.5">
                      {upcoming.map((reward, i) => (
                        <div
                          key={reward.level}
                          className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                              reward.isMilestone
                                ? "bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] border border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {reward.level}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {reward.emoji ? `${reward.emoji} ` : ""}Level {reward.level} — {reward.title}
                            </p>
                            <p className="text-sm md:text-xs text-brand-orange font-medium mt-0.5">
                              +{reward.coins} coins
                            </p>
                            <p className="text-sm md:text-xs text-muted-foreground truncate mt-0.5">
                              {reward.unlocks[0]}
                              {reward.badge ? ` · ${reward.badge}` : ""}
                            </p>
                          </div>
                          {i === 0 && (
                            <Badge
                              variant="secondary"
                              className="text-sm md:text-[10px] shrink-0 bg-primary/10 text-primary border-primary/20"
                            >
                              Next
                            </Badge>
                          )}
                        </div>
                      ))}
                      <Link
                        to="/rewards"
                        className="flex items-center justify-center gap-1 text-sm md:text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                      >
                        View all rewards <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Community Unlocks */}
        <div className="mt-6">
          <CommunityProgressBar />
        </div>

        {/* My Analytics */}
        <section className="mt-8 md:mt-10">
          <h2 className="font-heading text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            My Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* 7-day task completions bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">Task completions (7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          labelFormatter={(_, payload) => payload[0]?.payload?.date}
                          formatter={(value) => [`${value} completions`, "Tasks"]}
                        />
                        <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 14-day XP line chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-border h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">XP earned (14 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value) => [value, "XP"]}
                          labelFormatter={(_, payload) => payload[0]?.payload?.date}
                        />
                        <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="XP" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subject radar chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">Performance by subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, radarData[0]?.fullMark ?? 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Check-ins" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value) => [value, "Check-ins"]}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Streak / activity heatmap (GitHub-style) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-border h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">Activity heatmap</CardTitle>
                  <p className="text-sm md:text-xs text-muted-foreground font-normal">Last 12 weeks · like GitHub contributions</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex gap-[3px] min-w-[280px] w-full justify-end">
                      {heatmapWeeks.map((week, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-[3px]">
                          {week.map((cell, rowIndex) => {
                            const level = cell.count === 0 ? 0 : cell.count >= 4 ? 4 : Math.min(cell.count, 3);
                            const bg =
                              level === 0
                                ? "hsl(var(--muted))"
                                : level === 1
                                  ? "hsl(var(--primary) / 0.35)"
                                  : level === 2
                                    ? "hsl(var(--primary) / 0.6)"
                                    : level === 3
                                      ? "hsl(var(--primary) / 0.85)"
                                      : "hsl(var(--primary))";
                            return (
                              <div
                                key={`${colIndex}-${rowIndex}`}
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: bg }}
                                title={`${cell.date}: ${cell.count} completion${cell.count !== 1 ? "s" : ""}`}
                                aria-label={`${cell.date} ${cell.count} completions`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm md:text-[10px] text-muted-foreground">
                      <span>Less</span>
                      <span>More</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

      <Dialog open={repairModalOpen} onOpenChange={setRepairModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Repair Streak</DialogTitle>
            <DialogDescription>
              Repair your {brokenValue}-day streak for {repairCost} coins?
            </DialogDescription>
          </DialogHeader>
          {(gamificationStats?.coins ?? 0) < repairCost && (
            <p className="text-sm text-destructive">Not enough coins ({gamificationStats?.coins ?? 0} / {repairCost})</p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRepairModalOpen(false)} disabled={repairLoading}>Cancel</Button>
            <Button
              onClick={handleRepairStreak}
              disabled={repairLoading || (gamificationStats?.coins ?? 0) < repairCost}
            >
              {repairLoading ? "Repairing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={joinClassOpen} onOpenChange={setJoinClassOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>Enter the class code your teacher gave you.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. AB12CD"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoinClass()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJoinClassOpen(false)} disabled={joinLoading}>Cancel</Button>
            <Button onClick={handleJoinClass} disabled={joinLoading}>
              {joinLoading ? "Joining…" : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
