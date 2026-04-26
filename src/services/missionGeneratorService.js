export const DAILY_MISSION_TEMPLATES = [
  {
    mission_key: "daily_flashcards",
    title: "Flashcard Sprint",
    description: "Complete one focused flashcard session to keep your recall sharp.",
    type: "daily",
    xp_reward: 35,
    coins_reward: 12,
    target: 1,
  },
  {
    mission_key: "daily_quiz",
    title: "Quiz Clash",
    description: "Finish a quiz run and lock in one clean rep for the day.",
    type: "daily",
    xp_reward: 45,
    coins_reward: 16,
    target: 1,
  },
  {
    mission_key: "daily_notes",
    title: "Knowledge Capture",
    description: "Save a summary or note so today's learning becomes reusable.",
    type: "daily",
    xp_reward: 30,
    coins_reward: 10,
    target: 1,
  },
  {
    mission_key: "daily_practice",
    title: "Practice Pulse",
    description: "Finish one SAT or ACT practice session to bank steady progress.",
    type: "daily",
    xp_reward: 55,
    coins_reward: 20,
    target: 1,
  },
  {
    mission_key: "daily_login",
    title: "Daily Presence",
    description: "Show up today and log one activity to keep the streak alive.",
    type: "daily",
    xp_reward: 25,
    coins_reward: 8,
    target: 1,
  },
];

export const WEEKLY_MISSION_TEMPLATES = [
  {
    mission_key: "weekly_flashcards",
    title: "Recall Builder",
    description: "Complete three flashcard sessions this week to stay in rhythm.",
    type: "weekly",
    xp_reward: 120,
    coins_reward: 40,
    target: 3,
  },
  {
    mission_key: "weekly_quiz",
    title: "Quiz Ladder",
    description: "Finish two quizzes this week and keep stacking reps.",
    type: "weekly",
    xp_reward: 130,
    coins_reward: 44,
    target: 2,
  },
  {
    mission_key: "weekly_notes",
    title: "Archive Run",
    description: "Save three notes or summaries this week to build your knowledge bank.",
    type: "weekly",
    xp_reward: 110,
    coins_reward: 36,
    target: 3,
  },
  {
    mission_key: "weekly_practice",
    title: "Exam Momentum",
    description: "Complete two practice sessions this week and sharpen under pressure.",
    type: "weekly",
    xp_reward: 160,
    coins_reward: 55,
    target: 2,
  },
];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getDailyMissionTemplates(count = 3) {
  return shuffle(DAILY_MISSION_TEMPLATES).slice(0, count);
}

export function getWeeklyMissionTemplates(count = 2) {
  return shuffle(WEEKLY_MISSION_TEMPLATES).slice(0, count);
}
