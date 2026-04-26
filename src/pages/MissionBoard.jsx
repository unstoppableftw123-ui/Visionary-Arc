import { useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Coins, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "../App";
import MissionCard from "../components/mission-board/MissionCard";
import ClaimLimitBanner from "../components/mission-board/ClaimLimitBanner";
import { claimMission, getMissionBoardData } from "../services/missionService";

const TABS = [
  { key: "daily", label: "Daily Missions" },
  { key: "weekly", label: "Weekly Missions" },
];

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md animate-pulse">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-white/5" />
                <div className="h-6 w-40 rounded bg-white/5" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/5" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-4/5 rounded bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-2xl bg-white/5" />
              <div className="h-16 rounded-2xl bg-white/5" />
            </div>
            <div className="h-11 rounded-xl bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
      <p className="font-[Clash_Display] text-2xl text-white">No missions here yet</p>
      <p className="mt-2 font-[Satoshi] text-sm text-white/60">{label}</p>
    </div>
  );
}

export default function MissionBoard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("daily");
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyMissions, setWeeklyMissions] = useState([]);
  const [dailyClaimCount, setDailyClaimCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claimingMissionId, setClaimingMissionId] = useState(null);
  const [celebrationMissionId, setCelebrationMissionId] = useState(null);

  const loadBoard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMissionBoardData(user.id);
      setDailyMissions(data.dailyMissions);
      setWeeklyMissions(data.weeklyMissions);
      setDailyClaimCount(data.dailyClaimCount);
    } catch {
      toast.error("Failed to load missions.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleClaim = async (mission) => {
    if (!user?.id || !mission?.id) return;
    setClaimingMissionId(mission.id);

    try {
      const result = await claimMission(user.id, mission.id);
      setCelebrationMissionId(mission.id);
      setUser?.((prev) => (
        prev
          ? {
              ...prev,
              xp: (prev.xp ?? 0) + (result.xpAwarded ?? 0),
              coins: typeof result.newBalance === "number" ? result.newBalance : (prev.coins ?? 0) + (result.coinsAwarded ?? 0),
            }
          : prev
      ));
      toast.success(`Rewards claimed: +${result.xpAwarded} XP and +${result.coinsAwarded} coins`);
      await loadBoard();
      window.setTimeout(() => setCelebrationMissionId(null), 900);
    } catch (error) {
      toast.error(error?.message ?? "Could not claim mission.");
    } finally {
      setClaimingMissionId(null);
    }
  };

  const visibleMissions = activeTab === "daily" ? dailyMissions : weeklyMissions;
  const completedCount = [...dailyMissions, ...weeklyMissions].filter((mission) => mission.claimed).length;

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/45">
                Mission Board
              </p>
              <h1 className="font-[Clash_Display] text-4xl text-white">Three quests a day. Weekly arcs on top.</h1>
              <p className="mt-2 max-w-2xl font-[Satoshi] text-sm text-white/65">
                Daily missions reset each day, weekly missions stay live across the current week, and rewards only land when you claim them.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Daily Claimed</p>
                <p className="mt-1 font-[Clash_Display] text-2xl text-white">{dailyClaimCount}/3</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Completed</p>
                <p className="mt-1 flex items-center gap-2 font-[Clash_Display] text-2xl text-white">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  {completedCount}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Rewards</p>
                <p className="mt-1 flex items-center gap-2 font-[Clash_Display] text-2xl text-white">
                  <Coins className="h-5 w-5 text-yellow-300" />
                  Live
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <ClaimLimitBanner dailyCount={dailyClaimCount} dailyLimit={3} />

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "border-yellow-400/30 bg-yellow-400/12 text-yellow-300"
                  : "border-white/10 bg-white/5 text-white/55"
              }`}
            >
              {tab.key === "weekly" ? <CalendarRange className="mr-2 inline h-4 w-4" /> : <Sparkles className="mr-2 inline h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
          >
            {loading ? (
              <SkeletonGrid />
            ) : visibleMissions.length === 0 ? (
              <EmptyState
                label={
                  activeTab === "daily"
                    ? "Your next set of daily missions will appear automatically."
                    : "Weekly arcs will populate as the board rotates."
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onClaim={handleClaim}
                    claiming={claimingMissionId === mission.id}
                    celebrate={celebrationMissionId === mission.id}
                    dailyLimitReached={dailyClaimCount >= 3}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
