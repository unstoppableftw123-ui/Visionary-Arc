import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../App";
import { getProfilesLeaderboard } from "../services/leaderboardService";
import { getRankFromXP, getTierForXP } from "../services/xpService";
import RewardsTrack from "../components/RewardsTrack";
import { Skeleton } from "../components/ui/skeleton";
import TierBadge from "../components/ui/TierBadge";

// ── Constants ──────────────────────────────────────────────────────────────────

const RANK_COLORS = {
  E: "#9CA3AF",
  D: "#22C55E",
  C: "#3B82F6",
  B: "#A855F7",
  A: "#F97316",
  S: "#EAB308",
};

const PODIUM_COLORS = { 1: "#EAB308", 2: "#9CA3AF", 3: "#F97316" };
const PODIUM_BAR_HEIGHTS = { 1: 112, 2: 80, 3: 64 };

const SUB_TABS = [
  { id: "xp", label: "XP", orderBy: "xp", unit: "XP", field: "xp" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMsUntilNextMonday() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntil = day === 1 ? 7 : ((8 - day) % 7) || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntil);
  next.setUTCHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatCountdown(ms) {
  if (ms <= 0) return "resetting…";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getScore(row, field) {
  return row?.[field] ?? 0;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AvatarInitial({ name, avatar, size = "md" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const dim = size === "lg" ? 56 : 40;
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || "User avatar"}
        className="rounded-full shrink-0 object-cover"
        style={{ width: dim, height: dim, border: "1.5px solid var(--border)" }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{
        width: dim,
        height: dim,
        fontSize: size === "lg" ? 20 : 14,
        background: "var(--surface-3)",
        color: "var(--accent)",
        border: "1.5px solid var(--border)",
      }}
    >
      {initial}
    </div>
  );
}

function RankBadge({ xp }) {
  const rank = getRankFromXP(xp ?? 0);
  const color = RANK_COLORS[rank] ?? RANK_COLORS.E;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-sm font-bold shrink-0 md:text-xs"
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {rank}
    </span>
  );
}

function TierPill({ xp }) {
  const tier = getTierForXP(xp ?? 0);
  return <TierBadge label={tier} className="!px-2 !py-0.5 !text-[10px]" />;
}

function PodiumEntry({ row, position, field, unit }) {
  const color = PODIUM_COLORS[position];
  const barH = PODIUM_BAR_HEIGHTS[position];
  const score = getScore(row, field);

  return (
    <div className="flex w-full flex-col items-center gap-1.5 sm:flex-1">
      {row ? (
        <>
          <div className="relative">
            <AvatarInitial name={row.name} avatar={row.avatar} size="lg" />
            <span
              className="absolute -bottom-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-sm md:text-xs font-black"
              style={{ background: color, color: "#000" }}
            >
              {position}
            </span>
          </div>
          <div className="text-center px-1">
            <p
              className="mx-auto w-20 truncate text-sm font-semibold md:text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {row.name}
            </p>
            <p
              className="mx-auto w-20 truncate text-sm md:text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {row.school ?? "—"}
            </p>
            <p className="text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
              Lv {row.level ?? 1} · 🔥 {row.streak ?? 0}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <RankBadge xp={row.xp} />
              <TierPill xp={row.xp} />
            </div>
          </div>
          <div
            className="w-full rounded-t-lg flex items-center justify-center"
            style={{
              height: barH,
              background: color + "1A",
              border: `1px solid ${color}44`,
            }}
          >
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color }}>
                {score.toLocaleString()}
              </p>
              <p className="text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
                {unit}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <div className="w-full rounded-t-lg" style={{ height: barH }}>
            <Skeleton className="h-full w-full rounded-t-lg" />
          </div>
        </>
      )}
    </div>
  );
}

function ListRow({ row, position, isCurrentUser, field, unit, animIndex }) {
  const score = getScore(row, field);
  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: isCurrentUser
          ? "rgba(234,179,8,0.08)"
          : animIndex % 2 === 0
          ? "var(--surface)"
          : "var(--surface-2)",
        border: isCurrentUser
          ? "1px solid rgba(234,179,8,0.5)"
          : "1px solid var(--border)",
        borderLeft: isCurrentUser ? "3px solid var(--accent)" : undefined,
      }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: animIndex * 0.03 }}
    >
      <span
        className="text-sm font-bold w-6 text-center shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        {position}
      </span>
      <AvatarInitial name={row.name} avatar={row.avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: isCurrentUser ? "var(--accent)" : "var(--text-primary)" }}
          >
            {row.name}
          </p>
          {isCurrentUser && (
            <span className="text-sm md:text-xs shrink-0" style={{ color: "var(--accent)" }}>
              (you)
            </span>
          )}
        </div>
        <p className="text-sm md:text-xs truncate" style={{ color: "var(--text-secondary)" }}>
          {row.school ?? "—"}
        </p>
        <p className="text-sm md:text-xs truncate" style={{ color: "var(--text-muted)" }}>
          Lv {row.level ?? 1} · 🔥 {row.streak ?? 0}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RankBadge xp={row.xp} />
        <TierPill xp={row.xp} />
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)", minWidth: 56, textAlign: "right" }}>
          {score.toLocaleString()}{" "}
          <span className="text-sm md:text-xs font-normal" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        </p>
      </div>
    </motion.div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="flex flex-col justify-center gap-3 py-6 sm:flex-row sm:items-end">
      {[
        { pos: 2, h: PODIUM_BAR_HEIGHTS[2] },
        { pos: 1, h: PODIUM_BAR_HEIGHTS[1] },
        { pos: 3, h: PODIUM_BAR_HEIGHTS[3] },
      ].map(({ pos, h }) => (
        <div key={pos} className="flex flex-col items-center gap-2 sm:flex-1">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <div className="w-full rounded-t-lg" style={{ height: h }}>
            <Skeleton className="h-full w-full rounded-t-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useContext(AuthContext);
  const userId = user?.id ?? null;

  const [topTab, setTopTab] = useState("leaderboard");
  const [subTab, setSubTab] = useState("xp");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(getMsUntilNextMonday());

  const activeSubTab = SUB_TABS.find((t) => t.id === subTab) ?? SUB_TABS[0];

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(() => setCountdown(getMsUntilNextMonday()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Fetch leaderboard on tab change
  useEffect(() => {
    if (topTab !== "leaderboard") return;
    setLoading(true);
    setRows([]);
    getProfilesLeaderboard("xp")
      .then((data) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [topTab, subTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const top3 = rows.slice(0, 3);
  const listRows = rows.slice(3, 20);
  const currentUserIdx = rows.findIndex((r) => r.id === userId);
  const currentUserRow = currentUserIdx >= 0 ? rows[currentUserIdx] : null;
  const currentUserPosition = currentUserIdx + 1;
  const showPinned = currentUserPosition > 20 && currentUserRow !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:p-6">
      {/* Top-level tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "var(--surface)" }}
      >
        {[
          { id: "leaderboard", label: "Leaderboard" },
          { id: "rewards", label: "Rewards Track" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTopTab(id)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: topTab === id ? "var(--accent)" : "transparent",
              color: topTab === id ? "#000" : "var(--text-secondary)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {topTab === "rewards" ? (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <RewardsTrack />
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header row: All-time badge + reset countdown */}
            <div className="flex items-center justify-between">
              <span
                className="rounded-md px-2.5 py-1 text-sm font-semibold md:text-xs"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                All-time
              </span>
              <span className="text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
                Resets in {formatCountdown(countdown)}
              </span>
            </div>

            {/* Sub-tabs: XP / Coins / Streak (pill style) */}
            <div className="flex gap-2">
              {SUB_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: subTab === t.id ? "var(--accent)" : "var(--surface-2)",
                    color: subTab === t.id ? "#000" : "var(--text-secondary)",
                    border: subTab === t.id ? "none" : "1px solid var(--border)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <>
                <PodiumSkeleton />
                <ListSkeleton />
              </>
            ) : rows.length === 0 ? (
              <div
                className="text-center py-16 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  No data yet — start studying to earn XP!
                </p>
              </div>
            ) : (
              <>
                {/* Podium — 2nd left, 1st center (raised), 3rd right */}
                <div
                  className="flex flex-col justify-center gap-3 rounded-xl px-4 py-4 sm:flex-row sm:items-end sm:px-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {[
                    { pos: 2, row: top3[1] },
                    { pos: 1, row: top3[0] },
                    { pos: 3, row: top3[2] },
                  ].map(({ pos, row }) => (
                    <PodiumEntry
                      key={pos}
                      row={row ?? null}
                      position={pos}
                      field={activeSubTab.field}
                      unit={activeSubTab.unit}
                    />
                  ))}
                </div>

                {/* List rows 4–20 */}
                <div className="space-y-1.5">
                  {listRows.map((row, i) => (
                    <ListRow
                      key={row.id}
                      row={row}
                      position={i + 4}
                      isCurrentUser={row.id === userId}
                      field={activeSubTab.field}
                      unit={activeSubTab.unit}
                      animIndex={i}
                    />
                  ))}
                </div>

                {/* Pinned current user (outside top 20) */}
                {showPinned && (
                  <div
                    className="pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p
                      className="text-sm md:text-xs mb-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Your position
                    </p>
                    <ListRow
                      row={currentUserRow}
                      position={currentUserPosition}
                      isCurrentUser
                      field={activeSubTab.field}
                      unit={activeSubTab.unit}
                      animIndex={0}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
