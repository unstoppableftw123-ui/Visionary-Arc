import { useContext, useEffect, useMemo, useState } from "react";
import { RefreshCcw, School, Users, Globe } from "lucide-react";
import { AuthContext } from "../App";
import { supabase } from "../services/supabaseClient";
import { getProfilesLeaderboard } from "../services/leaderboardService";
import { mockLeaderboard } from "../data/mockLeaderboardData";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const TAB_ITEMS = [
  { id: "global", label: "Global", icon: Globe },
  { id: "friends", label: "Friends", icon: Users },
  { id: "school", label: "School", icon: School },
];

const TIER_THRESHOLDS = [
  { name: "Beginner", minXP: 0, nextXP: 500 },
  { name: "Builder", minXP: 500, nextXP: 2000 },
  { name: "Creator", minXP: 2000, nextXP: 6000 },
  { name: "Pro", minXP: 6000, nextXP: 15000 },
  { name: "Elite", minXP: 15000, nextXP: null },
];

function normalizeRows(rows) {
  return (rows ?? []).map((row, index) => {
    const id = row.id ?? row.user_id;
    const xp = row.xp ?? row.totalXP ?? 0;
    const rank = row.rank ?? row.displayRank ?? index + 1;
    return {
      id,
      rank,
      name: row.name ?? row.username ?? "Unknown",
      avatar: row.avatar ?? null,
      school: row.school ?? "Unknown School",
      level: row.level ?? 1,
      xp,
      streak: row.streak ?? 0,
    };
  });
}

function mapMockRows() {
  return mockLeaderboard.slice(0, 100).map((row, index) => ({
    id: row.id,
    rank: index + 1,
    name: row.username,
    avatar: row.avatar ?? null,
    school: row.school ?? "Unknown School",
    level: row.level ?? 1,
    xp: row.totalXP ?? 0,
    streak: row.streak ?? 0,
  }));
}

function getTierProgress(xp) {
  const current = [...TIER_THRESHOLDS]
    .reverse()
    .find((tier) => xp >= tier.minXP) ?? TIER_THRESHOLDS[0];
  if (!current.nextXP) return { pct: 100, label: "Elite tier maxed" };
  const span = current.nextXP - current.minXP;
  const inTier = Math.max(0, xp - current.minXP);
  const pct = Math.max(0, Math.min(100, Math.round((inTier / span) * 100)));
  return { pct, label: `${current.name} (${inTier.toLocaleString()} / ${span.toLocaleString()} XP)` };
}

function AvatarInitial({ name, avatar }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || "User avatar"}
        className="h-9 w-9 rounded-full object-cover shrink-0"
        style={{ border: "1px solid var(--border)" }}
      />
    );
  }
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-semibold"
      style={{ background: "var(--surface-3)", color: "var(--accent)", border: "1px solid var(--border)" }}
    >
      {initial}
    </div>
  );
}

function LeaderboardRow({ row, isCurrentUser }) {
  const progress = getTierProgress(row.xp);
  return (
    <div
      className="leaderboard-row flex-col"
      data-position={row.rank <= 3 ? String(row.rank) : undefined}
      style={isCurrentUser ? { border: "1px solid var(--accent)", background: "var(--accent-dim)", borderRadius: "var(--radius-md)" } : { border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="position">#{row.rank}</div>
        <AvatarInitial name={row.name} avatar={row.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold" style={{ color: isCurrentUser ? "var(--accent)" : "var(--text-primary)" }}>
              {row.name}
            </p>
            {isCurrentUser ? <span className="text-sm md:text-xs" style={{ color: "var(--accent)" }}>(you)</span> : null}
          </div>
          <p className="text-sm md:text-xs truncate" style={{ color: "var(--text-secondary)" }}>{row.school}</p>
          <p className="text-sm md:text-xs truncate" style={{ color: "var(--text-muted)" }}>Lv {row.level ?? 1} · 🔥 {row.streak ?? 0}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: "var(--rank-s)" }}>{row.xp.toLocaleString()} XP</p>
          <p className="text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>Lv {row.level}</p>
        </div>
      </div>
      <div className="w-full mt-2">
        <div className="xp-bar-track" style={{ height: 6 }}>
          <div className="xp-bar-fill" data-rank="S" style={{ width: `${progress.pct}%` }} />
        </div>
        <p className="mt-1" style={{ fontSize: 10, color: "var(--text-muted)" }}>{progress.label}</p>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard({ currentUser }) {
  const auth = useContext(AuthContext);
  const activeUser = currentUser || auth?.user;
  const activeUserId = activeUser?.id ?? activeUser?.user_id ?? null;
  const activeSchool = activeUser?.school ?? null;

  const [activeTab, setActiveTab] = useState("global");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState("supabase");
  const [friendIds, setFriendIds] = useState(new Set());
  const [currentRank, setCurrentRank] = useState(null);

  const loadData = async ({ refresh = false } = {}) => {
    if (!activeUserId) {
      setRows([]);
      setLoading(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const leaderboardRes = await getProfilesLeaderboard("xp");
      const hasRows = (leaderboardRes ?? []).length > 0;

      if (!hasRows) {
        setRows(mapMockRows());
        setSource("mock");
      } else {
        setRows(normalizeRows(leaderboardRes));
        setSource("supabase");
      }
      const position = (leaderboardRes ?? []).findIndex((r) => r.id === activeUserId);
      setCurrentRank(position >= 0 ? position + 1 : null);
    } catch {
      setRows(mapMockRows());
      setSource("mock");
      setCurrentRank(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  useEffect(() => {
    let mounted = true;

    async function loadFriends() {
      if (!activeUserId) return;
      try {
        const { data, error } = await supabase
          .from("friends")
          .select("user_id, friend_id")
          .eq("status", "accepted")
          .or(`user_id.eq.${activeUserId},friend_id.eq.${activeUserId}`);

        if (!mounted || error) return;
        const ids = new Set([activeUserId]);
        for (const row of data ?? []) {
          ids.add(row.user_id);
          ids.add(row.friend_id);
        }
        setFriendIds(ids);
      } catch {
        if (mounted) setFriendIds(new Set([activeUserId]));
      }
    }

    loadFriends();
    return () => {
      mounted = false;
    };
  }, [activeUserId]);

  const filteredRows = useMemo(() => {
    let base = rows;
    if (activeTab === "friends") {
      base = rows.filter((row) => friendIds.has(row.id));
    } else if (activeTab === "school") {
      base = activeSchool
        ? rows.filter((row) => (row.school ?? "").toLowerCase() === activeSchool.toLowerCase())
        : [];
    }
    return base
      .slice()
      .sort((a, b) => (a.rank ?? 99999) - (b.rank ?? 99999))
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }, [rows, activeTab, friendIds, activeSchool]);

  const top50 = filteredRows.slice(0, 50);
  const localCurrent = filteredRows.find((r) => r.id === activeUserId) ?? null;
  const showCurrentRankFooter = (localCurrent?.rank ?? currentRank ?? 0) > 50;

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Leaderboard</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData({ refresh: true })}
              disabled={refreshing}
              aria-label="Refresh leaderboard"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="tab-bar">
            {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`tab-item flex items-center gap-1.5 ${activeTab === id ? "active" : ""}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <LoadingRows />
          ) : top50.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <span className="chibi">📊</span>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {activeTab === "school" && !activeSchool
                  ? "Add your school in profile/settings to view school rankings."
                  : "Be the first on the leaderboard — start studying!"}
              </p>
            </div>
          ) : (
            <>
              {top50.map((row) => (
                <LeaderboardRow
                  key={row.id}
                  row={row}
                  isCurrentUser={row.id === activeUserId}
                />
              ))}

              {showCurrentRankFooter ? (
                <div className="mt-4 p-3" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--accent-dim)", background: "var(--accent-dim)" }}>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Your current rank:{" "}
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                      #{localCurrent?.rank ?? currentRank}
                    </span>
                    {" · "}
                    <span style={{ fontWeight: 600, color: "var(--rank-s)" }}>
                      {(localCurrent?.xp ?? rows.find((r) => r.id === activeUserId)?.xp ?? 0).toLocaleString()} XP
                    </span>
                  </p>
                </div>
              ) : null}
            </>
          )}

          {source === "mock" ? (
            <p className="text-sm md:text-[11px] text-muted-foreground">Showing fallback demo data.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
