import { supabase } from "./supabaseClient";
import { MOCK_MISSIONS } from "../db/mockData";
import { getDailyMissionTemplates, getWeeklyMissionTemplates } from "./missionGeneratorService";
import { awardCoins, spendCoins } from "./coinService";
import { awardBonusXP } from "./xpService";

const USE_MOCK = process.env.REACT_APP_USE_MOCK === "true";
const DAILY_CLAIM_LIMIT = 3;

let mockMissions = MOCK_MISSIONS.map((mission) => ({ ...mission }));
const mockSubmissions = {};

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function getWeekStartKey() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return formatDateKey(now);
}

function getMissionProgressValue(missionKey, counts) {
  const map = {
    daily_flashcards: counts.flashcards,
    daily_quiz: counts.quiz,
    daily_notes: counts.notes + counts.summary,
    daily_practice: counts.practice,
    daily_login: counts.login + counts.activity,
    weekly_flashcards: counts.flashcards,
    weekly_quiz: counts.quiz,
    weekly_notes: counts.notes + counts.summary,
    weekly_practice: counts.practice,
  };

  return map[missionKey] ?? 0;
}

async function getSessionCounts(userId, startDate) {
  const { data } = await supabase
    .from("study_sessions")
    .select("activity_type")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString());

  const counts = {
    login: 0,
    flashcards: 0,
    quiz: 0,
    notes: 0,
    summary: 0,
    practice: 0,
    activity: 0,
  };

  for (const row of data ?? []) {
    const type = row.activity_type;
    if (counts[type] !== undefined) counts[type] += 1;
    counts.activity += 1;
  }

  return counts;
}

async function syncMissionProgress(userId, missions) {
  if (!missions.length) return missions;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(`${getWeekStartKey()}T00:00:00`);

  const [dailyCounts, weeklyCounts] = await Promise.all([
    getSessionCounts(userId, today),
    getSessionCounts(userId, weekStart),
  ]);

  const updatedMissions = await Promise.all(
    missions.map(async (mission) => {
      const counts = mission.type === "weekly" ? weeklyCounts : dailyCounts;
      const nextProgress = Math.min(
        getMissionProgressValue(mission.mission_key, counts),
        mission.target ?? 1,
      );
      const completed = nextProgress >= (mission.target ?? 1);

      if (nextProgress === (mission.progress ?? 0) && completed === !!mission.completed) {
        return mission;
      }

      const { data, error } = await supabase
        .from("missions")
        .update({
          progress: nextProgress,
          completed,
        })
        .eq("id", mission.id)
        .select()
        .single();

      if (error) return { ...mission, progress: nextProgress, completed };
      return data;
    }),
  );

  return updatedMissions;
}

function syncMockMissionProgress(missions) {
  return missions.map((mission) => {
    const progress = Math.min(mission.progress ?? 0, mission.target ?? 1);
    return {
      ...mission,
      progress,
      completed: progress >= (mission.target ?? 1),
    };
  });
}

function seedMockMissions(userId, type) {
  const dateKey = type === "weekly" ? getWeekStartKey() : getTodayKey();
  const templates = type === "weekly" ? getWeeklyMissionTemplates() : getDailyMissionTemplates();
  const existing = mockMissions.filter(
    (mission) => mission.user_id === userId && mission.type === type && mission.date === dateKey,
  );

  if (existing.length > 0) return;

  const rows = templates.map((template, index) => ({
    id: `mock-${type}-${dateKey}-${index}`,
    user_id: userId,
    date: dateKey,
    progress: 0,
    completed: false,
    claimed: false,
    created_at: new Date().toISOString(),
    ...template,
  }));

  mockMissions = [...mockMissions, ...rows];
}

async function ensureSeededMissions(userId, type) {
  if (USE_MOCK) {
    seedMockMissions(userId, type);
    return;
  }

  const dateKey = type === "weekly" ? getWeekStartKey() : getTodayKey();
  const { data: existing } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("date", dateKey)
    .limit(1);

  if (existing?.length) return;

  const templates = type === "weekly" ? getWeeklyMissionTemplates() : getDailyMissionTemplates();
  const rows = templates.map((template) => ({
    user_id: userId,
    date: dateKey,
    progress: 0,
    completed: false,
    claimed: false,
    ...template,
  }));

  await supabase.from("missions").insert(rows);
}

async function getMissionRows(userId, type) {
  const dateKey = type === "weekly" ? getWeekStartKey() : getTodayKey();

  if (USE_MOCK) {
    seedMockMissions(userId, type);
    return syncMockMissionProgress(
      mockMissions.filter(
        (mission) => mission.user_id === userId && mission.type === type && mission.date === dateKey,
      ),
    );
  }

  await ensureSeededMissions(userId, type);
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("date", dateKey)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return syncMissionProgress(userId, data);
}

export async function seedDailyMissions(userId) {
  if (!userId) return;
  await ensureSeededMissions(userId, "daily");
}

export async function getMissions(userId) {
  if (!userId) return [];
  return getMissionRows(userId, "daily");
}

export async function getMissionBoardData(userId) {
  if (!userId) {
    return { dailyMissions: [], weeklyMissions: [], dailyClaimCount: 0 };
  }

  const [dailyMissions, weeklyMissions, dailyClaimCount] = await Promise.all([
    getMissionRows(userId, "daily"),
    getMissionRows(userId, "weekly"),
    getDailyClaimCount(userId),
  ]);

  return { dailyMissions, weeklyMissions, dailyClaimCount };
}

export async function claimMission(userId, missionId) {
  if (!userId || !missionId) throw new Error("Missing mission claim details.");

  if (USE_MOCK) {
    const mission = mockMissions.find((item) => item.id === missionId && item.user_id === userId);
    if (!mission) throw new Error("Mission not found.");
    if ((mission.progress ?? 0) < (mission.target ?? 1)) throw new Error("Mission not ready to claim.");
    if (mission.claimed) throw new Error("Mission already claimed.");

    if (mission.type === "daily") {
      const claimedToday = await getDailyClaimCount(userId);
      if (claimedToday >= DAILY_CLAIM_LIMIT) throw new Error("Daily claim limit reached.");
    }

    mission.claimed = true;
    mission.completed = true;
    const newBalance = await awardCoins(
      userId,
      mission.coins_reward ?? 0,
      `mission_claim:${mission.mission_key ?? mission.title ?? mission.id}`,
    );

    return {
      ...mission,
      xpAwarded: mission.xp_reward ?? 0,
      coinsAwarded: mission.coins_reward ?? 0,
      newBalance,
      xp_earned: mission.xp_reward ?? 0,
      coins_earned: mission.coins_reward ?? 0,
    };
  }

  const { data: mission, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .eq("user_id", userId)
    .single();

  if (error || !mission) throw new Error("Mission not found.");
  if ((mission.progress ?? 0) < (mission.target ?? 1)) throw new Error("Mission not ready to claim.");
  if (mission.claimed) throw new Error("Mission already claimed.");

  if (mission.type === "daily") {
    const claimedToday = await getDailyClaimCount(userId);
    if (claimedToday >= DAILY_CLAIM_LIMIT) throw new Error("Daily claim limit reached.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("missions")
    .update({
      claimed: true,
      completed: true,
    })
    .eq("id", missionId)
    .select()
    .single();

  if (updateError) throw updateError;

  await awardBonusXP(userId, updated.xp_reward ?? 0, `mission_${updated.type}`);
  const newBalance = await awardCoins(
    userId,
    updated.coins_reward ?? 0,
    `mission_claim:${updated.mission_key ?? updated.title ?? updated.id}`,
  );

  return {
    ...updated,
    xpAwarded: updated.xp_reward ?? 0,
    coinsAwarded: updated.coins_reward ?? 0,
    newBalance,
    xp_earned: updated.xp_reward ?? 0,
    coins_earned: updated.coins_reward ?? 0,
  };
}

export async function getDailyClaimCount(userId) {
  if (!userId) return 0;

  const todayKey = getTodayKey();

  if (USE_MOCK) {
    return mockMissions.filter(
      (mission) =>
        mission.user_id === userId &&
        mission.type === "daily" &&
        mission.date === todayKey &&
        mission.claimed,
    ).length;
  }

  const { count } = await supabase
    .from("missions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "daily")
    .eq("date", todayKey)
    .eq("claimed", true);

  return count ?? 0;
}

export async function incrementMissionProgress(userId, missionId, by = 1) {
  if (!userId || !missionId) return null;

  if (USE_MOCK) {
    const mission = mockMissions.find((item) => item.id === missionId && item.user_id === userId);
    if (!mission) return null;
    const progress = Math.min((mission.progress ?? 0) + by, mission.target ?? 1);
    mission.progress = progress;
    mission.completed = progress >= (mission.target ?? 1);
    return { ...mission };
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("progress, target")
    .eq("id", missionId)
    .eq("user_id", userId)
    .single();

  if (!mission) return null;

  const progress = Math.min((mission.progress ?? 0) + by, mission.target ?? 1);
  const completed = progress >= (mission.target ?? 1);

  const { data } = await supabase
    .from("missions")
    .update({ progress, completed })
    .eq("id", missionId)
    .select()
    .single();

  return data ?? null;
}

export async function getAvailableMissions(userId) {
  const { dailyMissions, weeklyMissions } = await getMissionBoardData(userId);
  return [...dailyMissions, ...weeklyMissions].filter((mission) => !mission.claimed);
}

export async function getUserAssignments(userId) {
  const { dailyMissions, weeklyMissions } = await getMissionBoardData(userId);
  return [...dailyMissions, weeklyMissions]
    .flat()
    .filter((mission) => mission.claimed || mission.completed)
    .map((mission) => ({
      id: mission.id,
      status: mission.claimed ? "approved" : mission.completed ? "submitted" : "in_progress",
      submission_url: mockSubmissions[mission.id]?.url ?? mission.submission_url ?? null,
      submission_note: mockSubmissions[mission.id]?.notes ?? mission.submission_notes ?? null,
      mission,
    }));
}

export async function submitMission(missionId, url, note) {
  if (USE_MOCK) {
    mockSubmissions[missionId] = { url, notes: note ?? null };
    return;
  }

  await supabase
    .from("missions")
    .update({
      submission_url: url,
      submission_notes: note ?? null,
    })
    .eq("id", missionId);
}

export async function unlockExtraMissionSlot(userId, slotCost = 50) {
  const newBalance = await spendCoins(userId, slotCost, "unlock_extra_mission_slot");
  if (newBalance === null) {
    throw new Error("Could not unlock slot. Not enough coins.");
  }
  return { success: true, newBalance };
}
