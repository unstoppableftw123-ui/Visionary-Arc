import { useState, useEffect, useContext, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { AuthContext } from "../App";
import { supabase } from "../services/supabaseClient";
import { RANK_COLORS } from "../styles/ranks";
import { Flame, Trophy, Star, Zap, Target, TrendingUp, Calendar, Users } from "lucide-react";

// ── Rank helpers ──────────────────────────────────────────────────────────────
function xpToRank(xp = 0) {
  if (xp >= 15000) return "S";
  if (xp >= 6000) return "A";
  if (xp >= 2000) return "B";
  if (xp >= 500) return "C";
  if (xp >= 100) return "D";
  return "E";
}

const RANK_XP_THRESHOLDS = [
  { rank: "S", xp: 15000 },
  { rank: "A", xp: 6000 },
  { rank: "B", xp: 2000 },
  { rank: "C", xp: 500 },
  { rank: "D", xp: 100 },
];

function getRankUps(studySessions) {
  if (!studySessions?.length) return [];
  const sorted = [...studySessions].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const milestones = [];
  let cumXP = 0;
  let prevRank = "E";
  for (const s of sorted) {
    cumXP += s.xp_earned ?? 0;
    const rank = xpToRank(cumXP);
    if (rank !== prevRank) {
      milestones.push({ xp: cumXP, rank, date: s.created_at });
      prevRank = rank;
    }
  }
  return milestones;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
}

function toDateKey(isoStr) {
  return isoStr?.slice(0, 10) ?? "";
}

// ── Activity Heatmap ──────────────────────────────────────────────────────────
function buildHeatmapGrid(missionDates) {
  const countByDate = {};
  for (const d of missionDates) countByDate[d] = (countByDate[d] || 0) + 1;

  const weeks = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // 52 weeks ending today
  for (let w = 51; w >= 0; w--) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(today);
      cell.setDate(today.getDate() - w * 7 - (6 - d));
      const key = cell.toISOString().slice(0, 10);
      days.push({ date: key, count: countByDate[key] ?? 0 });
    }
    weeks.push(days);
  }
  return weeks;
}

function heatmapColor(count, rankColor) {
  if (count === 0) return "rgba(255,255,255,0.06)";
  const alpha = count === 1 ? 0.2 : count === 2 ? 0.4 : count === 3 ? 0.65 : 1;
  const hex = rankColor ?? "#22C55E";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ActivityHeatmap({ missionDates, rankColor, loading }) {
  const [tooltip, setTooltip] = useState(null);
  const grid = useMemo(() => buildHeatmapGrid(missionDates), [missionDates]);
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_LABELS = [];

  // Build month labels positioned at first week of each month
  const seenMonths = new Set();
  grid.forEach((week, wi) => {
    const firstDay = week[0];
    if (!firstDay) return;
    const m = new Date(firstDay.date + "T12:00:00").toLocaleString("default", { month: "short" });
    if (!seenMonths.has(m)) {
      seenMonths.add(m);
      MONTH_LABELS.push({ label: m, week: wi });
    }
  });

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative" style={{ minWidth: 780 }}>
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 28 }}>
          {grid.map((_, wi) => {
            const entry = MONTH_LABELS.find((m) => m.week === wi);
            return (
              <div key={wi} style={{ width: 14, marginRight: 2, flexShrink: 0 }}>
                {entry && (
                  <span className="text-sm md:text-[10px] text-muted-foreground">{entry.label}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1" style={{ paddingTop: 0 }}>
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className="text-sm md:text-[10px] text-muted-foreground leading-none"
                style={{ height: 12, marginBottom: 2, lineHeight: "12px" }}
              >
                {i % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: heatmapColor(cell.count, rankColor),
                      cursor: cell.count > 0 ? "pointer" : "default",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (cell.count > 0) {
                        setTooltip({ cell, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 rounded text-sm md:text-xs bg-popover border border-border shadow text-foreground pointer-events-none"
            style={{ top: tooltip.y - 36, left: tooltip.x - 60 }}
          >
            {tooltip.cell.count} mission{tooltip.cell.count !== 1 ? "s" : ""} submitted on{" "}
            {formatDate(tooltip.cell.date)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── XP Graph ──────────────────────────────────────────────────────────────────
function XPGraph({ studySessions, rankColor, rankMilestones, loading }) {
  const chartData = useMemo(() => {
    if (!studySessions?.length) return [];
    const sorted = [...studySessions].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    // Aggregate by week
    const weekMap = new Map();
    let cumXP = 0;
    for (const s of sorted) {
      const d = new Date(s.created_at);
      // Get Sunday of that week
      d.setDate(d.getDate() - d.getDay());
      const wk = d.toISOString().slice(0, 10);
      cumXP += s.xp_earned ?? 0;
      weekMap.set(wk, cumXP);
    }

    return Array.from(weekMap.entries()).map(([week, xp]) => ({
      week,
      xp,
      label: formatDate(week),
    }));
  }, [studySessions]);

  // Find milestone xp values in chart data
  const milestonePoints = useMemo(() => {
    if (!rankMilestones?.length || !chartData?.length) return [];
    return rankMilestones.map((m) => {
      const closest = chartData.reduce((best, pt) =>
        Math.abs(pt.xp - m.xp) < Math.abs(best.xp - m.xp) ? pt : best
      );
      return { ...closest, rank: m.rank };
    });
  }, [rankMilestones, chartData]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!chartData.length)
    return <p className="text-sm text-muted-foreground text-center py-8">No XP data yet.</p>;

  const gradientId = "xpGradient";

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const milestone = milestonePoints.find((m) => m.week === payload.week);
    if (!milestone) return null;
    const rc = RANK_COLORS[milestone.rank];
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={rc?.color ?? rankColor} stroke="#fff" strokeWidth={2} />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={11} fill={rc?.color ?? rankColor}>
          {milestone.rank}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={rankColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={rankColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <ReTooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${v} XP`, "Cumulative XP"]}
          labelFormatter={(l) => `Week of ${l}`}
        />
        <Area
          type="monotone"
          dataKey="xp"
          stroke={rankColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={<CustomDot />}
          activeDot={{ r: 5, fill: rankColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Stat Radar ────────────────────────────────────────────────────────────────
const TRACKS = ["Tech", "Design", "Content", "Business", "Impact"];
const TRACK_KEYS = ["tech", "design", "content", "business", "impact"];

function StatRadar({ profile, missionsByTrack, loading }) {
  const radarData = TRACKS.map((axis, i) => ({
    axis,
    value: profile?.[`stat_${TRACK_KEYS[i]}`] ?? missionsByTrack?.[TRACK_KEYS[i]] ?? 0,
    fullMark: 100,
  }));

  const weakest = radarData.reduce((min, d) => (d.value < min.value ? d : min), radarData[0]);
  const weakestTrack = TRACK_KEYS[TRACKS.indexOf(weakest.axis)];
  const weakestCount = missionsByTrack?.[weakestTrack] ?? 0;

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-muted-foreground mt-1">
        Focus on{" "}
        <span className="text-foreground font-medium">{weakest.axis}</span> — only{" "}
        {weakestCount} mission{weakestCount !== 1 ? "s" : ""} in this track
      </p>
    </div>
  );
}

// ── Mission Breakdown ─────────────────────────────────────────────────────────
const TRACK_COLORS = {
  tech: "#3B82F6",
  design: "#EC4899",
  content: "#F59E0B",
  business: "#10B981",
  impact: "var(--accent)",
};

const DIFFICULTY_COLORS = {
  Starter: "#22C55E",
  Standard: "#3B82F6",
  Advanced: "#A855F7",
  Expert: "#F97316",
};

function MissionBreakdown({ assignments, loading }) {
  const trackData = useMemo(() => {
    if (!assignments?.length) return [];
    const counts = {};
    for (const a of assignments) {
      const t = a.mission?.track ?? "unknown";
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assignments]);

  const diffData = useMemo(() => {
    if (!assignments?.length) return [];
    const counts = {};
    for (const a of assignments) {
      const d = a.mission?.difficulty ?? "Unknown";
      counts[d] = (counts[d] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assignments]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!assignments?.length)
    return <p className="text-sm text-muted-foreground text-center py-8">No missions yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie: by track */}
      <div>
        <p className="text-sm font-medium mb-2 text-center">By Track</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={trackData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {trackData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={TRACK_COLORS[entry.name] ?? "#6B7280"}
                />
              ))}
            </Pie>
            <ReTooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar: by difficulty */}
      <div>
        <p className="text-sm font-medium mb-2 text-center">By Difficulty</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={diffData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <ReTooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {diffData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={DIFFICULTY_COLORS[entry.name] ?? "#6B7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Recent Activity Feed ──────────────────────────────────────────────────────
const DIFF_COLORS = {
  Starter: "bg-green-500/20 text-green-400",
  Standard: "bg-blue-500/20 text-blue-400",
  Advanced: "bg-orange-600/20 text-orange-400",
  Expert: "bg-orange-500/20 text-orange-400",
};

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function RecentActivity({ assignments, loading }) {
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!assignments?.length)
    return <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>;

  const recent = [...assignments]
    .filter((a) => a.submitted_at || a.approved_at)
    .sort((a, b) => new Date(b.submitted_at ?? b.approved_at) - new Date(a.submitted_at ?? a.approved_at))
    .slice(0, 10);

  if (!recent.length)
    return <p className="text-sm text-muted-foreground text-center py-8">No completed missions yet.</p>;

  return (
    <div className="space-y-2">
      {recent.map((a) => {
        const diff = a.mission?.difficulty ?? "Starter";
        const track = a.mission?.track ?? "";
        const title = a.mission?.title ?? "Mission";
        const xp = a.mission?.xp_reward ?? 0;
        const guildName = a.guild?.name ?? null;
        const date = a.submitted_at ?? a.approved_at;

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {diff && (
                  <span
                    className={`text-sm md:text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      DIFF_COLORS[diff] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {diff}
                  </span>
                )}
                {guildName && (
                  <span className="text-sm md:text-[10px] text-muted-foreground">{guildName}</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-brand-orange">+{xp} XP</p>
              <p className="text-sm md:text-[11px] text-muted-foreground">{timeAgo(date)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-5 w-16 mb-1" />
          ) : (
            <p className="text-lg font-bold leading-none">{value}</p>
          )}
          <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [studySessions, setStudySessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchAll(user.id);
  }, [user?.id]);

  async function fetchAll(userId) {
    setLoading(true);
    try {
      const [profileRes, sessionsRes, assignRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("study_sessions")
          .select("xp_earned, created_at, activity_type, subject")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("mission_assignments")
          .select(
            "id, status, submitted_at, approved_at, claimed_at, mission:missions(title, track, difficulty, xp_reward, coins_reward), guild:guilds(name)"
          )
          .eq("user_id", userId)
          .order("submitted_at", { ascending: false }),
      ]);

      setProfile(profileRes.data ?? null);
      setStudySessions(sessionsRes.data ?? []);
      setAssignments(assignRes.data ?? []);
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  const xp = profile?.xp ?? 0;
  const rank = xpToRank(xp);
  const rankMeta = RANK_COLORS[rank];
  const rankColor = rankMeta?.color ?? "#22C55E";

  // Mission submitted dates for heatmap
  const missionDates = useMemo(
    () =>
      assignments
        .filter((a) => a.submitted_at)
        .map((a) => toDateKey(a.submitted_at)),
    [assignments]
  );

  // Rank milestones
  const rankMilestones = useMemo(() => getRankUps(studySessions), [studySessions]);

  // Missions by track (count)
  const missionsByTrack = useMemo(() => {
    const counts = {};
    for (const a of assignments) {
      const t = a.mission?.track ?? "unknown";
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [assignments]);

  // XP this week
  const xpThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return studySessions
      .filter((s) => new Date(s.created_at) >= weekAgo)
      .reduce((sum, s) => sum + (s.xp_earned ?? 0), 0);
  }, [studySessions]);

  // Total missions completed
  const completedMissions = assignments.filter(
    (a) => a.status === "approved" || a.status === "submitted"
  ).length;

  // Avg star rating — not stored yet, show placeholder
  const avgStars = "—";

  // Rank percentile (rough estimate from tier thresholds)
  let rankPercentile = "Top 100%";
  if (xp >= 15000) rankPercentile = "Top 1%";
  else if (xp >= 6000) rankPercentile = "Top 5%";
  else if (xp >= 2000) rankPercentile = "Top 15%";
  else if (xp >= 500) rankPercentile = "Top 40%";
  else if (xp >= 100) rankPercentile = "Top 70%";

  const currentStreak = profile?.streak ?? 0;
  const maxStreak = profile?.max_streak ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: rankMeta?.glow ?? "rgba(34,197,94,0.15)" }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: rankColor }} />
        </div>
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Rank{" "}
            <span className="font-semibold" style={{ color: rankColor }}>
              {rank} — {rankMeta?.label}
            </span>{" "}
            · {xp.toLocaleString()} XP total
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Flame} label="Current Streak" value={`${currentStreak}d`} loading={loading} />
        <StatCard icon={Trophy} label="Longest Streak" value={`${maxStreak}d`} loading={loading} />
        <StatCard icon={Zap} label="Total XP" value={xp.toLocaleString()} loading={loading} />
        <StatCard icon={TrendingUp} label="XP This Week" value={xpThisWeek.toLocaleString()} loading={loading} />
        <StatCard icon={Target} label="Missions Done" value={completedMissions} loading={loading} />
        <StatCard icon={Star} label="Rank Percentile" value={rankPercentile} loading={loading} />
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap
            missionDates={missionDates}
            rankColor={rankColor}
            loading={loading}
          />
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-sm md:text-xs text-muted-foreground">Less</span>
            {[0, 1, 2, 3, 4].map((c) => (
              <div
                key={c}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: heatmapColor(c, rankColor),
                }}
              />
            ))}
            <span className="text-sm md:text-xs text-muted-foreground">More</span>
          </div>
        </CardContent>
      </Card>

      {/* XP Graph */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            XP Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <XPGraph
            studySessions={studySessions}
            rankColor={rankColor}
            rankMilestones={rankMilestones}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Stat Radar + Mission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skill Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRadar
              profile={profile}
              missionsByTrack={missionsByTrack}
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mission Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionBreakdown assignments={assignments} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity assignments={assignments} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
