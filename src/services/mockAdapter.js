/**
 * Mock adapter for axios and fetch when USE_REAL_API is false.
 * Intercepts all API calls and returns mock data so the app is viewable without a backend.
 * Remove or disable when connecting real APIs.
 */

import axios from 'axios';
import { mockStudents, mockAssignments } from '../data/mockTeacherData';
import * as jamBus from '../components/competitions/jamBus';
import {
  DEFAULT_CLASS_RANK_TITLES,
  getBadgeById,
  getLevelFromXp,
  getNormalizedRankTitles,
  getRankTitleForLevel,
} from '../data/rewardsProgram';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API_PREFIX = `${API_BASE}/api`;

// Seed token so AuthProvider has a non-null token on first load
if (typeof localStorage !== 'undefined' && !localStorage.getItem('token')) {
  localStorage.setItem('token', 'mock_token_demo');
}

// ─── Mock data (aligned with dataService shapes where applicable) ───
const mockUser = {
  user_id: 'user_demo_001',
  email: 'demo@taskflow.com',
  name: 'Alex Student',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  banner: null,
  bio: 'High school student passionate about learning and growth',
  role: 'student',
  xp: 1250,
  coins: 350,
  level: 5,
  is_premium: false,
  avatar_frame: null,
  badges: ['first_login', 'curious', 'scholar'],
  badge_earned_at: {
    first_login: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    curious: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    scholar: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  school_id: 'school_demo_001',
  created_at: new Date().toISOString(),
  // Portfolio / profile page: behavioral stats (visible to visitors)
  consistency_score: 87,
  total_study_hours: 24,
  max_streak: 7,
  // Saved task templates (from "Save as template" on tasks)
  templates: [
    { task_id: 'tpl_1', title: 'Weekly Math Review', description: 'Structured review template for algebra and calculus', category: 'math' },
    { task_id: 'tpl_2', title: 'SAT Reading Practice', description: 'Passage-based reading and vocabulary', category: 'sat_prep' },
    { task_id: 'tpl_3', title: 'Essay Outline', description: 'Introduction, body paragraphs, conclusion', category: 'english' }
  ],
  // Notes the user has made public (shared notes tab)
  shared_notes: [
    { note_id: 'note_shared_1', title: 'Calculus Chapter 5 Notes', folder: 'math', content_preview: 'Derivatives, power rule, chain rule...', updated_at: new Date().toISOString() },
    { note_id: 'note_shared_2', title: 'SAT Vocabulary List', folder: 'sat_prep', content_preview: 'Ephemeral, ubiquitous, pragmatic...', updated_at: new Date().toISOString() }
  ]
};

const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Vocab Jam store ───────────────────────────────────────────────────────────
const JAM_WORD_SETS = [
  {
    id: 'ws_bio', name: 'Biology Basics',
    words: [
      { term: 'Mitosis', definition: 'Cell division producing two identical daughter cells', distractors: ['Cell death', 'DNA transcription', 'Meiosis'] },
      { term: 'Photosynthesis', definition: 'Process plants use to convert sunlight into food', distractors: ['Cellular respiration', 'Transpiration', 'Fermentation'] },
      { term: 'Osmosis', definition: 'Movement of water through a semipermeable membrane', distractors: ['Active transport', 'Diffusion of solutes', 'Endocytosis'] },
      { term: 'DNA', definition: 'Double-helix molecule carrying genetic instructions', distractors: ['Protein', 'mRNA', 'Carbohydrate'] },
      { term: 'Meiosis', definition: 'Cell division producing four haploid gametes', distractors: ['Mitosis', 'Binary fission', 'Cloning'] },
    ],
  },
  {
    id: 'ws_env', name: 'Environmental Science',
    words: [
      { term: 'Ecosystem', definition: 'Community of organisms interacting with their environment', distractors: ['Biome', 'Population', 'Habitat'] },
      { term: 'Biodiversity', definition: 'Variety of life in an area or on Earth', distractors: ['Biomass', 'Population density', 'Species dominance'] },
      { term: 'Carbon Cycle', definition: 'Circulation of carbon through atmosphere, organisms, and land', distractors: ['Water cycle', 'Nitrogen cycle', 'Phosphorus cycle'] },
      { term: 'Renewable Energy', definition: 'Energy from sources that naturally replenish', distractors: ['Fossil fuels', 'Nuclear energy', 'Coal power'] },
      { term: 'Deforestation', definition: 'Permanent removal of trees and forest cover', distractors: ['Reforestation', 'Afforestation', 'Erosion'] },
    ],
  },
  {
    id: 'ws_sat', name: 'SAT Vocabulary',
    words: [
      { term: 'Ephemeral', definition: 'Lasting for a very short time', distractors: ['Permanent', 'Frequent', 'Substantial'] },
      { term: 'Ubiquitous', definition: 'Present, appearing, or found everywhere', distractors: ['Rare', 'Unique', 'Hidden'] },
      { term: 'Pragmatic', definition: 'Dealing with things sensibly and realistically', distractors: ['Idealistic', 'Theoretical', 'Abstract'] },
      { term: 'Ambiguous', definition: 'Open to more than one interpretation', distractors: ['Clear', 'Definitive', 'Explicit'] },
      { term: 'Tenacious', definition: 'Holding firmly to a goal; persistent', distractors: ['Hesitant', 'Flexible', 'Timid'] },
    ],
  },
];
const mockJamSessions = {}; // jamId → { jamId, code, wordSet, classId, createdAt, results }
const mockJamCodes = {};    // code → jamId

// ─── Streak state (persisted to localStorage) ─────────────────────────────────
const _streakState = (() => {
  try {
    const stored = localStorage.getItem('mock_streak_state');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return { current_streak: 0, last_activity_date: null, max_streak: 0, broken_streak_value: 0, broken_streak_date: null };
})();

// Simulate midnight cron: if last activity was before yesterday, streak is broken
(function _initStreakReset() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (_streakState.last_activity_date && _streakState.last_activity_date < yesterday) {
    if (_streakState.current_streak > 0) {
      _streakState.broken_streak_value = _streakState.current_streak;
      _streakState.broken_streak_date = new Date().toISOString();
    }
    _streakState.current_streak = 0;
    try { localStorage.setItem('mock_streak_state', JSON.stringify(_streakState)); } catch (_) {}
  }
})();

function _saveStreakState() {
  try { localStorage.setItem('mock_streak_state', JSON.stringify(_streakState)); } catch (_) {}
}

function _incrementStreak() {
  const activeUser = getActiveMockUser();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const last = _streakState.last_activity_date;
  if (last === today) {
    return { current_streak: _streakState.current_streak, last_activity_date: last, already_today: true };
  }
  if (last === yesterday) {
    _streakState.current_streak += 1;
  } else {
    _streakState.current_streak = 1;
  }
  _streakState.last_activity_date = today;
  _streakState.max_streak = Math.max(_streakState.max_streak, _streakState.current_streak);
  _saveStreakState();
  saveActiveMockUser({
    ...activeUser,
    streak: _streakState.current_streak,
    max_streak: Math.max(activeUser?.max_streak || 0, _streakState.max_streak),
  });
  return { current_streak: _streakState.current_streak, last_activity_date: today, already_today: false };
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Coin state (persisted to localStorage so balance survives page reloads) ──
let _coinBalance = (() => {
  try {
    const stored = localStorage.getItem('mock_coin_balance');
    if (stored !== null) return parseInt(stored, 10);
  } catch (_) {}
  return mockUser.coins;
})();
mockUser.coins = _coinBalance;

const mockCoinTransactions = (() => {
  try {
    return JSON.parse(localStorage.getItem('mock_coin_txns') || '[]');
  } catch (_) { return []; }
})();

function _applyCoins(amount, reason, userId) {
  const activeUser = getActiveMockUser();
  _coinBalance = Math.max(0, _coinBalance + amount);
  mockUser.coins = _coinBalance;
  const txn = {
    transaction_id: genId('txn'),
    user_id: userId || mockUser.user_id,
    amount,
    reason,
    balance: _coinBalance,
    timestamp: new Date().toISOString(),
  };
  mockCoinTransactions.unshift(txn);
  try {
    localStorage.setItem('mock_coin_balance', String(_coinBalance));
    localStorage.setItem('mock_coin_txns', JSON.stringify(mockCoinTransactions.slice(0, 50)));
  } catch (_) {}
  saveActiveMockUser({ ...activeUser, coins: _coinBalance });
  return { balance: _coinBalance };
}
// ─────────────────────────────────────────────────────────────────────────────

// In-memory stores for mutable mock data (survives only per session)
const mockVisionarySessions = [];
const mockLibrary = [
  {
    item_id: 'library_mock_1',
    item_type: 'quiz',
    title: 'Calculus Basics Quiz',
    content: { questions: [{ id: 1, question: 'What is the derivative of x²?', options: ['2x', 'x²', '2', 'x'], correct: 0, explanation: 'Power rule' }] },
    source_text: 'Basic calculus',
    difficulty: 'medium',
    estimated_time: 10,
    created_at: new Date().toISOString()
  },
  {
    item_id: 'library_mock_2',
    item_type: 'flashcards',
    title: 'SAT Vocabulary Flashcards',
    content: { cards: [{ front: 'Ephemeral', back: 'Lasting for a very short time', example: 'Cherry blossoms are ephemeral.' }] },
    source_text: 'SAT words',
    difficulty: 'medium',
    estimated_time: 15,
    created_at: new Date().toISOString()
  }
];

const mockServers = [
  {
    server_id: 'server_mock_1',
    name: 'Study Hall',
    description: 'General study community for all subjects',
    icon: '📖',
    member_count: 1234,
    is_public: true,
    channels: [
      { channel_id: 'channel_mock_1', name: 'general', description: 'General study discussions', type: 'text' },
      { channel_id: 'channel_mock_2', name: 'homework-help', description: 'Get help with homework', type: 'text' }
    ],
    created_at: new Date().toISOString()
  }
];

// Pre-populated so Community tab shows content
const mockChannelMessages = [
  { message_id: 'msg_1', content: 'Welcome to the channel!', timestamp: new Date(Date.now() - 3600000).toISOString(), user_id: 'user_demo_001' },
  { message_id: 'msg_2', content: 'Anyone working on calculus homework?', timestamp: new Date(Date.now() - 1800000).toISOString(), user_id: 'user_demo_002' },
  { message_id: 'msg_3', content: 'I can help — which problem set?', timestamp: new Date().toISOString(), user_id: mockUser.user_id }
];

const mockStoreItems = [
  { item_id: 'store_1', name: 'Premium Study Planner', description: 'AI-powered planning', price: 499, currency: 'coins', category: 'tools' },
  { item_id: 'store_2', name: 'Energy Boost', description: '5 extra AI calls', price: 50, currency: 'coins', category: 'consumables' }
];

// Pre-populated so Shop/Wishlists tabs show content
const mockWishlists = [
  { wishlist_id: 'wl_mock_1', name: 'Books', items: [{ item_id: 'wi_1', title: 'Calculus textbook', item_url: '', price: '', notes: '' }] },
  { wishlist_id: 'wl_mock_2', name: 'Supplies', items: [{ item_id: 'wi_2', title: 'Notebook', item_url: '', price: '5', notes: '' }] }
];

const mockExchanges = [
  { exchange_id: 'ex_mock_1', name: 'Holiday Exchange', participants: [{ user_id: 'user_demo_001', name: 'Alex Student' }] }
];

// Community server resources/goals/notes (per-server in-memory)
const mockServerResources = [
  { resource_id: 'res_1', title: 'Khan Academy Calculus', resource_type: 'link', url: 'https://www.khanacademy.org/math/calculus-1', content: null }
];
const mockServerGoals = [
  { goal_id: 'goal_1', title: 'Complete Chapter 5', description: 'Finish all practice problems', target: 100, current: 40 }
];
const mockServerNotes = [
  { note_id: 'cnote_1', title: 'Study group notes', content: 'Key formulas and tips from last session.' }
];

const mockSchools = [
  { school_id: 'school_mock_1', name: 'Visionary Academy', description: 'Main school', member_count: 150, created_at: new Date().toISOString() }
];

// Leaderboard for schools (enriched)
const mockLeaderboard = [
  { user_id: 'user_demo_001', name: 'Alex Student', xp: 1250, rank: 1, role: 'student' },
  { user_id: 'user_demo_002', name: 'Sarah Scholar', xp: 980, rank: 2, role: 'teacher' }
];

const LEADERBOARD_PROFILES_KEY = 'mock_leaderboard_profiles_v1';
const LEADERBOARD_EVENTS_KEY = 'mock_leaderboard_events_v1';
const LEADERBOARD_RESETS_KEY = 'mock_leaderboard_resets_v1';

const CLASS_ID_ALIASES = {
  cls1: 'cls_mock_1',
  cls2: 'cls_mock_2',
  cls3: 'cls_mock_3',
  cls_mock_1: 'cls_mock_1',
  cls_mock_2: 'cls_mock_2',
  cls_mock_3: 'cls_mock_3',
};

const SCHOOL_DIRECTORY = {
  school_demo_001: 'Visionary Academy',
  school_demo_002: 'Westlake High School',
  school_mock_1: 'Visionary Academy',
  school_riverside_001: 'Riverside Prep',
  school_lincoln_001: 'Lincoln Academy',
  school_oakwood_001: 'Oakwood School',
};

function getActiveMockUser() {
  try {
    const stored = localStorage.getItem('mock_current_user');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return mockUser;
}

function saveActiveMockUser(user) {
  const nextUser = { ...mockUser, ...user };
  Object.assign(mockUser, nextUser);

  try {
    localStorage.setItem('mock_current_user', JSON.stringify(nextUser));
  } catch (_) {}

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((entry) => entry.user_id === nextUser.user_id);
    if (index >= 0) {
      users[index] = { ...users[index], ...nextUser };
      localStorage.setItem('users', JSON.stringify(users));
    }
  } catch (_) {}

  return nextUser;
}

function recordXpHistory(userId, amount) {
  if (!userId || !amount) return;

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const key = `xp_history_${userId}`;
  const history = readLocalJson(key, () => []);
  const existingEntry = history.find((entry) => entry.month === month);

  if (existingEntry) {
    existingEntry.xp = (existingEntry.xp || 0) + amount;
  } else {
    history.push({ month, xp: amount });
  }

  writeLocalJson(key, history);
}

function normalizeClassId(classId) {
  return CLASS_ID_ALIASES[classId] || classId;
}

const CLASS_RANK_TITLES_KEY = 'mock_class_rank_titles_v1';

let classRankTitles = readLocalJson(CLASS_RANK_TITLES_KEY, () => ({}));

function getClassRankTitles(classId) {
  const normalizedClassId = normalizeClassId(classId);
  return getNormalizedRankTitles(classRankTitles[normalizedClassId] || DEFAULT_CLASS_RANK_TITLES);
}

function saveClassRankTitles() {
  writeLocalJson(CLASS_RANK_TITLES_KEY, classRankTitles);
}

function startOfMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

function createLeaderboardProfilesSeed() {
  const extraNames = [
    'Maya Brooks', 'Noah Bennett', 'Olivia Cruz', 'Luca Moreno', 'Zoe Carter',
    'Miles Turner', 'Elena Ortiz', 'Kai Foster', 'Ruby Nguyen', 'Leo Simmons',
    'Ava Price', 'Julian Vega', 'Ivy Cooper', 'Mateo Flores', 'Chloe Bell',
    'Nora Perry', 'Asher Ward', 'Ella Griffin', 'Caleb Ross', 'Sienna Hayes',
  ];
  const baseProfiles = [
    {
      userId: 'user_demo_001',
      displayName: 'Alex Student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      schoolId: 'school_demo_001',
      classIds: ['cls_mock_1', 'cls_mock_2', 'cls_mock_3'],
      level: 5,
      streak: 7,
    },
    ...mockStudents.map((student, index) => {
      const classIds = [];
      if (["s1", "s2", "s5", "s7", "s9", "s11", "s13", "s17", "s19"].includes(student.id)) classIds.push('cls_mock_1');
      if (["s3", "s4", "s6", "s10", "s14", "s15", "s18", "s20"].includes(student.id)) classIds.push('cls_mock_2');
      if (["s8", "s12", "s16", "s1", "s3", "s5"].includes(student.id)) classIds.push('cls_mock_3');
      const schoolIds = ['school_demo_001', 'school_riverside_001', 'school_lincoln_001', 'school_oakwood_001'];
      return {
        userId: student.id,
        displayName: student.name,
        avatar: student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`,
        schoolId: schoolIds[index % schoolIds.length],
        classIds,
        level: 8 + ((index * 3) % 35),
        streak: student.consistencyScore ? Math.max(1, Math.round(student.consistencyScore / 8)) : 4,
      };
    }),
    ...extraNames.map((name, index) => ({
      userId: `lb_extra_${index + 1}`,
      displayName: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      schoolId: ['school_demo_001', 'school_riverside_001', 'school_lincoln_001', 'school_oakwood_001'][index % 4],
      classIds: index % 3 === 0 ? ['cls_mock_1'] : index % 3 === 1 ? ['cls_mock_2'] : ['cls_mock_3'],
      level: 10 + ((index * 2) % 32),
      streak: 3 + (index % 14),
    })),
  ];

  return baseProfiles.map((profile) => ({
    ...profile,
    rankTitle: getRankTitleForLevel(profile.level),
  }));
}

function createLeaderboardEventsSeed(profiles) {
  const currentWeekStart = startOfMonday();
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const events = [];

  profiles.forEach((profile, index) => {
    const olderPoints = 2400 + (profile.level * 820) + (index * 137);
    const previousWeekPoints = 220 + ((index * 73) % 980);
    const currentWeekPoints = 260 + ((index * 91) % 1240);
    const classIds = profile.classIds.length > 0 ? profile.classIds : [null];

    const createEvent = (eventId, timestamp, totalPoints, classId) => {
      const coins = Math.max(20, Math.round(totalPoints * 0.12));
      const xp = Math.max(0, totalPoints - coins);
      return {
        eventId,
        userId: profile.userId,
        schoolId: profile.schoolId,
        classId: classId ? normalizeClassId(classId) : null,
        xp,
        coins,
        timestamp,
      };
    };

    events.push(
      createEvent(
        `older_${profile.userId}`,
        new Date(currentWeekStart.getTime() - (40 + index) * 24 * 60 * 60 * 1000).toISOString(),
        olderPoints,
        classIds[0]
      )
    );

    events.push(
      createEvent(
        `prev_${profile.userId}`,
        new Date(previousWeekStart.getTime() + ((index % 5) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        previousWeekPoints,
        classIds[0]
      )
    );

    events.push(
      createEvent(
        `curr_${profile.userId}`,
        new Date(currentWeekStart.getTime() + ((index % 5) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        currentWeekPoints,
        classIds[classIds.length - 1]
      )
    );
  });

  return events;
}

let leaderboardProfiles = readLocalJson(LEADERBOARD_PROFILES_KEY, createLeaderboardProfilesSeed);
let leaderboardEvents = readLocalJson(LEADERBOARD_EVENTS_KEY, () => createLeaderboardEventsSeed(leaderboardProfiles));
let leaderboardClassResets = readLocalJson(LEADERBOARD_RESETS_KEY, () => ({}));

function saveLeaderboardProfiles() {
  writeLocalJson(LEADERBOARD_PROFILES_KEY, leaderboardProfiles);
}

function saveLeaderboardEvents() {
  writeLocalJson(LEADERBOARD_EVENTS_KEY, leaderboardEvents);
}

function saveLeaderboardResets() {
  writeLocalJson(LEADERBOARD_RESETS_KEY, leaderboardClassResets);
}

function ensureLeaderboardProfileForUser(user) {
  if (!user?.user_id) return null;
  let profile = leaderboardProfiles.find((entry) => entry.userId === user.user_id);
  if (!profile) {
    profile = {
      userId: user.user_id,
      displayName: user.name || user.email || 'Student',
      avatar: user.avatar || null,
      schoolId: user.school_id || 'school_demo_001',
      classIds: [],
      level: user.level || 1,
      streak: _streakState.current_streak || 0,
      rankTitle: getRankTitleForLevel(user.level || 1),
    };
    leaderboardProfiles.push(profile);
  }

  profile.displayName = user.name || profile.displayName;
  profile.avatar = user.avatar || profile.avatar;
  profile.schoolId = user.school_id || profile.schoolId || 'school_demo_001';
  profile.level = user.level || profile.level || 1;
  profile.streak = user.role === 'student' ? (_streakState.current_streak || profile.streak || 0) : (profile.streak || 0);
  profile.rankTitle = getRankTitleForLevel(profile.level);

  const enrolledClassIds = mockClassMemberships
    .filter((membership) => membership.user_id === user.user_id && membership.role !== 'teacher')
    .map((membership) => normalizeClassId(membership.class_id));
  if (enrolledClassIds.length > 0) {
    profile.classIds = enrolledClassIds;
  }

  saveLeaderboardProfiles();
  return profile;
}

function ensureCurrentUserLeaderboardState() {
  const activeUser = getActiveMockUser();
  const profile = ensureLeaderboardProfileForUser(activeUser);
  if (!profile) return;

  const desiredTotal = Math.max((activeUser.xp || 0) + (activeUser.coins || 0), 100);
  const existingTotal = leaderboardEvents
    .filter((event) => event.userId === activeUser.user_id)
    .reduce((sum, event) => sum + event.xp + event.coins, 0);

  const diff = desiredTotal - existingTotal;
  if (diff > 0) {
    const targetClassId = profile.classIds[0] || null;
    const coins = Math.max(0, Math.round(diff * 0.1));
    leaderboardEvents.push({
      eventId: genId('lb_sync'),
      userId: activeUser.user_id,
      schoolId: profile.schoolId,
      classId: targetClassId,
      xp: diff - coins,
      coins,
      timestamp: new Date().toISOString(),
    });
    saveLeaderboardEvents();
  }
}

function toLeaderboardEntry(profile, points, rankChange) {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    avatar: profile.avatar,
    schoolId: profile.schoolId,
    schoolName: SCHOOL_DIRECTORY[profile.schoolId] || 'Visionary Academy',
    level: profile.level,
    rankTitle: profile.rankTitle,
    points,
    streak: profile.streak || 0,
    rankChange,
  };
}

function buildLeaderboard(scope, options = {}) {
  ensureCurrentUserLeaderboardState();
  const currentWeekStart = startOfMonday();
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart);
  const classId = options.classId ? normalizeClassId(options.classId) : null;
  const schoolId = options.schoolId || null;
  const classScopedRankTitles = classId ? getClassRankTitles(classId) : null;
  const classResetAt = classId && leaderboardClassResets[classId] ? new Date(leaderboardClassResets[classId]) : null;

  const profileMap = new Map(leaderboardProfiles.map((profile) => [profile.userId, profile]));
  const studentProfiles = leaderboardProfiles.filter((profile) => profile.userId !== 'user_demo_002');

  const getCohort = () => {
    if (scope === 'class' && classId) {
      return studentProfiles.filter((profile) => profile.classIds.includes(classId));
    }
    if (scope === 'school' && schoolId) {
      return studentProfiles.filter((profile) => profile.schoolId === schoolId);
    }
    return studentProfiles;
  };

  const cohort = getCohort();
  const cohortIds = new Set(cohort.map((profile) => profile.userId));

  const sumPoints = (windowType, profile) => {
    return leaderboardEvents.reduce((sum, event) => {
      if (event.userId !== profile.userId) return sum;
      if (scope === 'class' && classId && normalizeClassId(event.classId) !== classId) return sum;
      if (scope === 'school' && schoolId && event.schoolId !== schoolId) return sum;
      if (scope === 'class' && classResetAt && new Date(event.timestamp) < classResetAt) return sum;

      const eventDate = new Date(event.timestamp);
      if (windowType === 'current_week' && eventDate < currentWeekStart) return sum;
      if (windowType === 'previous_week' && (eventDate < previousWeekStart || eventDate >= previousWeekEnd)) return sum;

      return sum + event.xp + event.coins;
    }, 0);
  };

  const currentRanks = cohort
    .map((profile) => ({ profile, points: sumPoints(scope === 'weekly' ? 'current_week' : 'all_time', profile) }))
    .sort((a, b) => b.points - a.points || a.profile.displayName.localeCompare(b.profile.displayName));

  const previousRanks = cohort
    .map((profile) => ({ profile, points: sumPoints('previous_week', profile) }))
    .sort((a, b) => b.points - a.points || a.profile.displayName.localeCompare(b.profile.displayName));

  const previousRankMap = new Map(previousRanks.map((entry, index) => [entry.profile.userId, index + 1]));

  return currentRanks
    .filter((entry) => cohortIds.has(entry.profile.userId) && entry.points > 0)
    .map((entry, index) => {
      const previousRank = previousRankMap.get(entry.profile.userId);
      const rankChange = previousRank ? previousRank - (index + 1) : 0;
      const leaderboardEntry = toLeaderboardEntry(entry.profile, entry.points, rankChange);
      if (classScopedRankTitles) {
        leaderboardEntry.rankTitle = getRankTitleForLevel(entry.profile.level, classScopedRankTitles);
      }
      return leaderboardEntry;
    });
}

// ─── Class mock data ──────────────────────────────────────────────────────────
const mockClasses = [
  {
    class_id: 'cls_mock_1',
    name: 'AP Biology',
    subject: 'Biology',
    grade: '11th',
    description: 'Advanced Placement Biology covering cell biology, genetics, and ecology.',
    join_code: 'BIO-2841',
    teacher_id: 'teacher_mock_1',
    teacher_name: 'Ms. Johnson',
    school: 'Westside High',
    created_at: new Date('2025-09-03').toISOString(),
  },
  {
    class_id: 'cls_mock_2',
    name: 'Pre-Calculus',
    subject: 'Mathematics',
    grade: '11th',
    description: 'Foundations of calculus including trigonometry, functions, and limits.',
    join_code: 'MAT-5729',
    teacher_id: 'teacher_mock_2',
    teacher_name: 'Mr. Davis',
    school: 'Westside High',
    created_at: new Date('2025-09-03').toISOString(),
  },
  {
    class_id: 'cls_mock_3',
    name: 'World History',
    subject: 'History',
    grade: '11th',
    description: 'Survey of world history from ancient civilizations to the modern era.',
    join_code: 'HIS-9163',
    teacher_id: 'teacher_mock_3',
    teacher_name: 'Dr. Patel',
    school: 'Westside High',
    created_at: new Date('2025-09-03').toISOString(),
  },
];

// Memberships: current mock user is a student in all 3 classes
const mockClassMemberships = [
  { class_id: 'cls_mock_1', user_id: 'user_demo_001', role: 'student', joined_at: new Date('2025-09-05').toISOString() },
  { class_id: 'cls_mock_2', user_id: 'user_demo_001', role: 'student', joined_at: new Date('2025-09-05').toISOString() },
  { class_id: 'cls_mock_3', user_id: 'user_demo_001', role: 'student', joined_at: new Date('2025-09-06').toISOString() },
  // Other students in cls_mock_1
  { class_id: 'cls_mock_1', user_id: 'student_002', role: 'student', joined_at: new Date('2025-09-05').toISOString() },
  { class_id: 'cls_mock_1', user_id: 'student_003', role: 'student', joined_at: new Date('2025-09-05').toISOString() },
  { class_id: 'cls_mock_1', user_id: 'student_004', role: 'student', joined_at: new Date('2025-09-05').toISOString() },
  // Teachers as members of their own classes
  { class_id: 'cls_mock_1', user_id: 'teacher_mock_1', role: 'teacher', joined_at: new Date('2025-09-01').toISOString() },
  { class_id: 'cls_mock_2', user_id: 'teacher_mock_2', role: 'teacher', joined_at: new Date('2025-09-01').toISOString() },
  { class_id: 'cls_mock_3', user_id: 'teacher_mock_3', role: 'teacher', joined_at: new Date('2025-09-01').toISOString() },
];

const mockClassMessages = {
  'cls_mock_1': [
    { message_id: 'cmsg_1', class_id: 'cls_mock_1', user_id: 'teacher_mock_1', user_name: 'Ms. Johnson', is_teacher: true, content: "Good morning! Lab reports are due Friday. Make sure to include your hypothesis and conclusion.", pinned: true, created_at: new Date(Date.now() - 7200000).toISOString() },
    { message_id: 'cmsg_2', class_id: 'cls_mock_1', user_id: 'user_demo_001', user_name: 'Alex Student', is_teacher: false, content: 'Do we need to include a bibliography?', pinned: false, created_at: new Date(Date.now() - 3900000).toISOString() },
    { message_id: 'cmsg_3', class_id: 'cls_mock_1', user_id: 'teacher_mock_1', user_name: 'Ms. Johnson', is_teacher: true, content: 'Yes, at least 3 sources in MLA format.', pinned: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  ],
  'cls_mock_2': [
    { message_id: 'cmsg_4', class_id: 'cls_mock_2', user_id: 'teacher_mock_2', user_name: 'Mr. Davis', is_teacher: true, content: 'Reminder: Unit 4 test moved to March 18th. Use the extra time to review trig identities.', pinned: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { message_id: 'cmsg_5', class_id: 'cls_mock_2', user_id: 'user_demo_001', user_name: 'Alex Student', is_teacher: false, content: 'Will there be a practice test before the exam?', pinned: false, created_at: new Date(Date.now() - 43200000).toISOString() },
    { message_id: 'cmsg_6', class_id: 'cls_mock_2', user_id: 'teacher_mock_2', user_name: 'Mr. Davis', is_teacher: true, content: "Yes! I'll post one on Thursday.", pinned: false, created_at: new Date(Date.now() - 40000000).toISOString() },
  ],
  'cls_mock_3': [
    { message_id: 'cmsg_7', class_id: 'cls_mock_3', user_id: 'teacher_mock_3', user_name: 'Dr. Patel', is_teacher: true, content: 'Excellent essay submissions this week. Grades have been posted in the portal.', pinned: false, created_at: new Date(Date.now() - 259200000).toISOString() },
  ],
};

const mockClassAssignments = {
  'cls_mock_1': [
    { assignment_id: 'asgn_m1', class_id: 'cls_mock_1', title: 'Cell Division Lab Report', instructions: 'Write a full lab report on your microscope observations of onion root tip cells.', due_date: '2026-03-14', points: 50, created_at: new Date().toISOString() },
    { assignment_id: 'asgn_m2', class_id: 'cls_mock_1', title: 'Chapter 7 Reading Quiz', instructions: 'Complete the online quiz covering chapters 7-8 of the textbook.', due_date: '2026-03-15', points: 20, created_at: new Date().toISOString() },
    { assignment_id: 'asgn_m3', class_id: 'cls_mock_1', title: 'Mitosis Diagram', instructions: 'Draw and label all 4 phases of mitosis with detailed annotations.', due_date: '2026-03-08', points: 30, created_at: new Date().toISOString() },
  ],
  'cls_mock_2': [
    { assignment_id: 'asgn_m4', class_id: 'cls_mock_2', title: 'Trig Identities Worksheet', instructions: 'Complete all 20 problems showing your work for full credit.', due_date: '2026-03-13', points: 40, created_at: new Date().toISOString() },
    { assignment_id: 'asgn_m5', class_id: 'cls_mock_2', title: 'Unit 3 Practice Test', instructions: 'Take the timed practice test under test conditions.', due_date: '2026-03-05', points: 60, created_at: new Date().toISOString() },
  ],
  'cls_mock_3': [
    { assignment_id: 'asgn_m6', class_id: 'cls_mock_3', title: 'WWI Causes Essay', instructions: 'Write a 3-page essay analyzing the primary causes of World War I using at least 4 sources.', due_date: '2026-03-10', points: 100, created_at: new Date().toISOString() },
  ],
};

const mockClassResources = {
  'cls_mock_1': [
    { resource_id: 'cres_1', class_id: 'cls_mock_1', user_id: 'teacher_mock_1', user_name: 'Ms. Johnson', title: 'AP Bio Study Guide 2024', resource_type: 'pdf', url: '#', content: null, created_at: new Date().toISOString() },
    { resource_id: 'cres_2', class_id: 'cls_mock_1', user_id: 'teacher_mock_1', user_name: 'Ms. Johnson', title: 'Khan Academy: Cell Biology', resource_type: 'link', url: 'https://www.khanacademy.org', content: null, created_at: new Date().toISOString() },
  ],
  'cls_mock_2': [
    { resource_id: 'cres_3', class_id: 'cls_mock_2', user_id: 'teacher_mock_2', user_name: 'Mr. Davis', title: 'Trig Identities Cheat Sheet', resource_type: 'pdf', url: '#', content: null, created_at: new Date().toISOString() },
    { resource_id: 'cres_4', class_id: 'cls_mock_2', user_id: 'teacher_mock_2', user_name: 'Mr. Davis', title: 'Desmos Graphing Calculator', resource_type: 'link', url: 'https://www.desmos.com', content: null, created_at: new Date().toISOString() },
  ],
  'cls_mock_3': [
    { resource_id: 'cres_5', class_id: 'cls_mock_3', user_id: 'teacher_mock_3', user_name: 'Dr. Patel', title: 'Timeline of World War I', resource_type: 'pdf', url: '#', content: null, created_at: new Date().toISOString() },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

const mockTeacherActor = {
  user_id: 'teacher_demo_001',
  name: 'Ms. Sarah Chen',
  role: 'teacher',
};

const TEACHER_CLASS_POSTS_KEY = 'mock_teacher_class_posts_v1';
const TEACHER_POST_REPLIES_KEY = 'mock_teacher_post_replies_v1';
const TEACHER_CLASS_MEMBERS_KEY = 'mock_teacher_class_members_v1';

const createInitialTeacherPosts = () => ({
  cls1: [
    {
      id: 'post_cls1_1',
      classId: 'cls1',
      authorId: mockTeacherActor.user_id,
      authorName: mockTeacherActor.name,
      isTeacher: true,
      content: 'Good morning! Lab reports are due Friday. Let me know if you have questions.',
      pinned: true,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      attachments: [],
      reactions: [
        { emoji: '👍', user_id: 's1' },
        { emoji: '🔥', user_id: 's3' },
      ],
    },
    {
      id: 'post_cls1_2',
      classId: 'cls1',
      authorId: mockTeacherActor.user_id,
      authorName: mockTeacherActor.name,
      isTeacher: true,
      content: 'One day extension is fine. Submit by Saturday at 11:59 PM.',
      pinned: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
  cls2: [
    {
      id: 'post_cls2_1',
      classId: 'cls2',
      authorId: mockTeacherActor.user_id,
      authorName: mockTeacherActor.name,
      isTeacher: true,
      content: 'Reminder: Ecosystem essays are due next Thursday. Post questions here.',
      pinned: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      attachments: [],
      reactions: [{ emoji: '👏', user_id: 's6' }],
    },
  ],
  cls3: [
    {
      id: 'post_cls3_1',
      classId: 'cls3',
      authorId: mockTeacherActor.user_id,
      authorName: mockTeacherActor.name,
      isTeacher: true,
      content: 'Great work on the quiz. Grades are posted. Review the feedback carefully.',
      pinned: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
});

const createInitialTeacherReplies = () => ({
  post_cls1_1: [
    {
      id: 'reply_cls1_1',
      postId: 'post_cls1_1',
      user_id: 's1',
      user_name: 'Aiden Park',
      isTeacher: false,
      content: 'Thanks, I am finishing the conclusion tonight.',
      created_at: new Date(Date.now() - 5400000).toISOString(),
    },
  ],
});

const createInitialTeacherMembers = () => ({
  cls1: mockStudents.filter((student) => ["s1", "s2", "s5", "s7", "s9", "s11", "s13", "s17", "s19"].includes(student.id)).map((student) => ({ ...student, mutedUntil: null })),
  cls2: mockStudents.filter((student) => ["s3", "s4", "s6", "s10", "s14", "s15", "s18", "s20"].includes(student.id)).map((student) => ({ ...student, mutedUntil: null })),
  cls3: mockStudents.filter((student) => ["s8", "s12", "s16", "s1", "s3", "s5"].includes(student.id)).map((student) => ({ ...student, mutedUntil: null })),
});

function readLocalJson(key, fallbackFactory) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  const initial = typeof fallbackFactory === 'function' ? fallbackFactory() : fallbackFactory;
  try { localStorage.setItem(key, JSON.stringify(initial)); } catch (_) {}
  return initial;
}

function writeLocalJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

let teacherClassPosts = readLocalJson(TEACHER_CLASS_POSTS_KEY, createInitialTeacherPosts);
let teacherPostReplies = readLocalJson(TEACHER_POST_REPLIES_KEY, createInitialTeacherReplies);
let teacherClassMembers = readLocalJson(TEACHER_CLASS_MEMBERS_KEY, createInitialTeacherMembers);

function saveTeacherClassPosts() {
  writeLocalJson(TEACHER_CLASS_POSTS_KEY, teacherClassPosts);
}

function saveTeacherPostReplies() {
  writeLocalJson(TEACHER_POST_REPLIES_KEY, teacherPostReplies);
}

function saveTeacherClassMembers() {
  writeLocalJson(TEACHER_CLASS_MEMBERS_KEY, teacherClassMembers);
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getTeacherPostById(postId) {
  for (const posts of Object.values(teacherClassPosts)) {
    const post = posts.find((entry) => entry.id === postId);
    if (post) return post;
  }
  return null;
}

function serializeTeacherPost(post) {
  const replies = teacherPostReplies[post.id] || [];
  return {
    ...post,
    time: formatRelativeTime(post.created_at),
    reply_count: replies.length,
    current_user_reactions: post.reactions
      .filter((reaction) => reaction.user_id === mockTeacherActor.user_id)
      .map((reaction) => reaction.emoji),
  };
}

// ─── Submissions (teacher gradebook + student my-grades) ─────────────────────
const _LAB_ANSWERS = [
  { question: 'What phases of mitosis did you observe?', studentAnswer: 'Prophase, metaphase, anaphase, telophase', correctAnswer: 'Prophase, metaphase, anaphase, telophase', isCorrect: true },
  { question: 'What percentage of cells were in interphase?', studentAnswer: '~80%', correctAnswer: '~80%', isCorrect: true },
  { question: "Describe the spindle fibers' role.", studentAnswer: 'They attach to chromosomes', correctAnswer: 'They attach to chromatids and pull them to opposite poles', isCorrect: false },
];
const _WORKSHEET_ANSWERS = [
  { question: 'What enzyme unwinds DNA during replication?', studentAnswer: 'Helicase', correctAnswer: 'Helicase', isCorrect: true },
  { question: 'What is the template strand?', studentAnswer: "The strand read 3' to 5'", correctAnswer: "The strand read 3' to 5'", isCorrect: true },
  { question: 'What is an Okazaki fragment?', studentAnswer: 'Fragments on the leading strand', correctAnswer: 'Short fragments synthesized on the lagging strand', isCorrect: false },
];
const _QUIZ_ANSWERS = [
  { question: "Which phase has chromosomes aligned at the cell's equator?", studentAnswer: 'Metaphase', correctAnswer: 'Metaphase', isCorrect: true },
  { question: 'How many daughter cells result from one mitotic division?', studentAnswer: '2', correctAnswer: '2', isCorrect: true },
  { question: 'What happens to the nuclear envelope during prophase?', studentAnswer: 'It reforms', correctAnswer: 'It breaks down', isCorrect: false },
];

const mockSubmissions = (() => {
  try {
    const stored = localStorage.getItem('mock_submissions');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [
    // a1: Cell Division Lab Report — maxScore 50, due 2026-03-14
    { submission_id: 'sub_s1_a1', userId: 's1', assignmentId: 'a1', score: 45, maxScore: 50, submittedAt: '2026-03-13T10:30:00Z', teacherComment: 'Excellent detail on all four phases.', isLate: false, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s2_a1', userId: 's2', assignmentId: 'a1', score: 38, maxScore: 50, submittedAt: '2026-03-15T08:00:00Z', teacherComment: '', isLate: true, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s3_a1', userId: 's3', assignmentId: 'a1', score: 44, maxScore: 50, submittedAt: '2026-03-13T16:00:00Z', teacherComment: 'Strong data section. Improve the conclusion.', isLate: false, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s4_a1', userId: 's4', assignmentId: 'a1', score: 28, maxScore: 50, submittedAt: '2026-03-16T11:00:00Z', teacherComment: 'Incomplete analysis.', isLate: true, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s5_a1', userId: 's5', assignmentId: 'a1', score: 42, maxScore: 50, submittedAt: '2026-03-14T09:00:00Z', teacherComment: '', isLate: false, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s6_a1', userId: 's6', assignmentId: 'a1', score: 48, maxScore: 50, submittedAt: '2026-03-12T14:00:00Z', teacherComment: 'Outstanding work!', isLate: false, answers: _LAB_ANSWERS },
    { submission_id: 'sub_s8_a1', userId: 's8', assignmentId: 'a1', score: 47, maxScore: 50, submittedAt: '2026-03-13T11:00:00Z', teacherComment: '', isLate: false, answers: _LAB_ANSWERS },
    // a5: DNA Replication Worksheet — maxScore 30, due 2026-03-08
    { submission_id: 'sub_s1_a5', userId: 's1', assignmentId: 'a5', score: 28, maxScore: 30, submittedAt: '2026-03-06T15:00:00Z', teacherComment: '', isLate: false, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s2_a5', userId: 's2', assignmentId: 'a5', score: 22, maxScore: 30, submittedAt: '2026-03-09T10:00:00Z', teacherComment: 'Late submission.', isLate: true, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s3_a5', userId: 's3', assignmentId: 'a5', score: 26, maxScore: 30, submittedAt: '2026-03-07T12:00:00Z', teacherComment: '', isLate: false, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s5_a5', userId: 's5', assignmentId: 'a5', score: 25, maxScore: 30, submittedAt: '2026-03-08T09:00:00Z', teacherComment: '', isLate: false, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s6_a5', userId: 's6', assignmentId: 'a5', score: 29, maxScore: 30, submittedAt: '2026-03-06T11:00:00Z', teacherComment: '', isLate: false, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s7_a5', userId: 's7', assignmentId: 'a5', score: 18, maxScore: 30, submittedAt: '2026-03-10T14:00:00Z', teacherComment: 'Late. Please review DNA replication steps.', isLate: true, answers: _WORKSHEET_ANSWERS },
    { submission_id: 'sub_s8_a5', userId: 's8', assignmentId: 'a5', score: 28, maxScore: 30, submittedAt: '2026-03-07T10:00:00Z', teacherComment: '', isLate: false, answers: _WORKSHEET_ANSWERS },
    // a8: Genetics & Heredity Mid-Unit Check — maxScore 20, due 2026-03-22
    { submission_id: 'sub_s1_a8', userId: 's1', assignmentId: 'a8', score: 18, maxScore: 20, submittedAt: '2026-03-21T08:00:00Z', teacherComment: '', isLate: false, answers: _QUIZ_ANSWERS },
    { submission_id: 'sub_s3_a8', userId: 's3', assignmentId: 'a8', score: 16, maxScore: 20, submittedAt: '2026-03-22T09:00:00Z', teacherComment: '', isLate: false, answers: _QUIZ_ANSWERS },
    { submission_id: 'sub_s5_a8', userId: 's5', assignmentId: 'a8', score: 15, maxScore: 20, submittedAt: '2026-03-21T11:00:00Z', teacherComment: '', isLate: false, answers: _QUIZ_ANSWERS },
    { submission_id: 'sub_s6_a8', userId: 's6', assignmentId: 'a8', score: 19, maxScore: 20, submittedAt: '2026-03-20T10:00:00Z', teacherComment: '', isLate: false, answers: _QUIZ_ANSWERS },
    { submission_id: 'sub_s8_a8', userId: 's8', assignmentId: 'a8', score: 19, maxScore: 20, submittedAt: '2026-03-21T09:00:00Z', teacherComment: '', isLate: false, answers: _QUIZ_ANSWERS },
  ];
})();

function _saveSubmissions() {
  try { localStorage.setItem('mock_submissions', JSON.stringify(mockSubmissions)); } catch (_) {}
}

// ─── Quiz settings: { [assignmentId]: { time_limit: number|null, max_attempts: '1'|'2'|'3'|'unlimited' } }
const _quizSettings = (() => {
  try {
    const stored = localStorage.getItem('mock_quiz_settings');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  // Pre-seed settings for the existing quiz assignment (a8)
  return { a8: { time_limit: 20, max_attempts: '2' } };
})();

function _saveQuizSettings() {
  try { localStorage.setItem('mock_quiz_settings', JSON.stringify(_quizSettings)); } catch (_) {}
}

// ─── Quiz attempt counts: derived from mockSubmissions (count per userId+assignmentId).
// Returns how many times userId has submitted assignmentId.
function _getAttemptCount(userId, assignmentId) {
  return mockSubmissions.filter(s => s.userId === userId && s.assignmentId === assignmentId).length
    + mockMyGrades.filter(s => s.userId === userId && s.assignmentId === assignmentId).length;
}

// Student (demo user) own grades — used by MyGrades page
const mockMyGrades = [
  { submission_id: 'my_sub_1', userId: 'user_demo_001', assignmentId: 'asgn_m1', assignmentTitle: 'Cell Division Lab Report', className: 'AP Biology', score: 41, maxScore: 50, submittedAt: '2026-03-13T14:20:00Z', teacherComment: 'Good analysis of the mitosis stages. Add more quantitative data next time.', isLate: false },
  { submission_id: 'my_sub_2', userId: 'user_demo_001', assignmentId: 'asgn_m2', assignmentTitle: 'Chapter 7 Reading Quiz', className: 'AP Biology', score: 17, maxScore: 20, submittedAt: '2026-03-14T09:10:00Z', teacherComment: '', isLate: false },
  { submission_id: 'my_sub_3', userId: 'user_demo_001', assignmentId: 'asgn_m3', assignmentTitle: 'Mitosis Diagram', className: 'AP Biology', score: 28, maxScore: 30, submittedAt: '2026-03-07T16:00:00Z', teacherComment: 'Excellent diagrams with detailed labels.', isLate: false },
  { submission_id: 'my_sub_4', userId: 'user_demo_001', assignmentId: 'asgn_m4', assignmentTitle: 'Trig Identities Worksheet', className: 'Pre-Calculus', score: 35, maxScore: 40, submittedAt: '2026-03-12T10:00:00Z', teacherComment: '', isLate: false },
  { submission_id: 'my_sub_5', userId: 'user_demo_001', assignmentId: 'asgn_m5', assignmentTitle: 'Unit 3 Practice Test', className: 'Pre-Calculus', score: 52, maxScore: 60, submittedAt: '2026-03-04T14:30:00Z', teacherComment: 'Strong performance. Review trig identities for the final.', isLate: false },
  { submission_id: 'my_sub_6', userId: 'user_demo_001', assignmentId: 'asgn_m6', assignmentTitle: 'WWI Causes Essay', className: 'World History', score: 80, maxScore: 100, submittedAt: '2026-03-12T09:00:00Z', teacherComment: 'Late submission — 10% penalty applied. Good analysis of long-term causes.', isLate: true },
];
// ─── Direct Messages ─────────────────────────────────────────────────────────
const mockDMUsers = {
  'teacher_mock_1': { user_id: 'teacher_mock_1', name: 'Ms. Johnson', role: 'teacher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johnson' },
  'teacher_mock_2': { user_id: 'teacher_mock_2', name: 'Mr. Davis', role: 'teacher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=davis' },
  'teacher_mock_3': { user_id: 'teacher_mock_3', name: 'Dr. Patel', role: 'teacher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=patel' },
};
// student user_demo_001 is enrolled in cls_mock_1 (teacher_mock_1), cls_mock_2 (teacher_mock_2), cls_mock_3 (teacher_mock_3)
const _ALLOWED_DM_PARTNERS = Object.keys(mockDMUsers);

const mockDMMessages = (() => {
  try {
    const stored = localStorage.getItem('mock_dm_messages');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [
    { message_id: 'dm_seed_1', sender_id: 'teacher_mock_1', receiver_id: 'user_demo_001', content: 'Hi Alex! Just a reminder that your lab report is due Friday.', sent_at: new Date(Date.now() - 7200000).toISOString(), read: false },
    { message_id: 'dm_seed_2', sender_id: 'user_demo_001', receiver_id: 'teacher_mock_1', content: "Thank you Ms. Johnson! I'll have it done by Thursday.", sent_at: new Date(Date.now() - 3600000).toISOString(), read: true },
    { message_id: 'dm_seed_3', sender_id: 'teacher_mock_2', receiver_id: 'user_demo_001', content: 'Great work on the last quiz, Alex. Keep it up!', sent_at: new Date(Date.now() - 86400000).toISOString(), read: false },
  ];
})();

function _saveDMMessages() {
  try { localStorage.setItem('mock_dm_messages', JSON.stringify(mockDMMessages)); } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Class Challenges ─────────────────────────────────────────────────────────
const CHALLENGES_KEY = 'mock_class_challenges_v1';
let mockChallenges = (() => {
  try {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
})();

function _saveChallenges() {
  try { localStorage.setItem(CHALLENGES_KEY, JSON.stringify(mockChallenges)); } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

function getPath(url) {
  if (!url) return '';
  try {
    const u = typeof url === 'string' ? new URL(url, API_BASE) : url;
    return u.pathname || url;
  } catch {
    return String(url);
  }
}

function getMockResponse(path, method, config) {
  const m = (method || 'get').toLowerCase();

  // Auth & profile
  if (path === '/api/auth/me' && m === 'get') {
    return { data: getActiveMockUser(), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/profile' && m === 'put') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    return { data: saveActiveMockUser({ ...getActiveMockUser(), ...body }), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/profile\/[^/]+$/) && m === 'get' && path !== '/api/profile/strength') {
    return { data: getActiveMockUser(), status: 200, statusText: 'OK', headers: {}, config };
  }
  if ((path === '/api/profile/avatar' || path === '/api/profile/banner') && m === 'post') {
    const key = path.includes('avatar') ? 'avatar' : 'banner';
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    saveActiveMockUser({ ...getActiveMockUser(), [key]: url });
    return { data: { [key]: url }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Visionary AI chat
  if (path === '/api/ai/visionary/sessions' && m === 'get') {
    return { data: mockVisionarySessions, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/ai\/visionary\/sessions\/[^/]+$/) && m === 'get') {
    const sessionId = path.split('/').pop();
    const session = mockVisionarySessions.find(s => s.session_id === sessionId) || {
      session_id: sessionId,
      messages: [],
      title: 'Chat',
      created_at: new Date().toISOString()
    };
    return { data: { ...session, messages: session.messages || [] }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/ai\/visionary\/sessions\/[^/]+$/) && m === 'delete') {
    const sessionId = path.split('/').pop();
    const idx = mockVisionarySessions.findIndex(s => s.session_id === sessionId);
    if (idx !== -1) mockVisionarySessions.splice(idx, 1);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/ai/visionary/chat' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const sessionId = body.session_id || genId('session');
    const isNew = !body.session_id;
    if (isNew) {
      mockVisionarySessions.unshift({
        session_id: sessionId,
        title: (body.message || '').slice(0, 50) + ((body.message || '').length > 50 ? '...' : ''),
        messages: [],
        created_at: new Date().toISOString()
      });
    }
    const response = `This is a mock AI response to: "${(body.message || '').slice(0, 80)}". Connect the real API for live AI.`;
    return {
      data: { session_id: sessionId, response, is_new_session: isNew },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  // AI StudyHub
  if (path === '/api/ai/summarize' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const summary = `Mock summary of your content (${(body.content || '').length} chars). Style: ${body.style || 'concise'}.`;
    return { data: { summary }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/ai/quiz' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const n = Math.min(Number(body.num_questions) || 5, 10);
    const questions = Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      question: `Sample question ${i + 1} from your content`,
      options: ['A', 'B', 'C', 'D'],
      correct: 0,
      explanation: `Explanation for question ${i + 1}`
    }));
    return { data: { questions }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/ai/flashcards' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const n = Math.min(Number(body.num_cards) || 10, 20);
    const cards = Array.from({ length: n }, (_, i) => ({
      front: `Term ${i + 1}`,
      back: `Definition ${i + 1}`,
      example: `Example ${i + 1}`
    }));
    return { data: { cards }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/ai/analyze-image' && m === 'post') {
    return {
      data: { text: 'Mock extracted text from image. Connect real API for OCR.', summary: 'Mock image summary.' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  // Library
  if (path === '/api/library' && m === 'get') {
    return { data: mockLibrary, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/library' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const item = { item_id: genId('library'), ...body, created_at: new Date().toISOString() };
    mockLibrary.push(item);
    return { data: item, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/library\/[^/]+$/) && m === 'delete') {
    const id = path.split('/').pop();
    const idx = mockLibrary.findIndex(i => i.item_id === id);
    if (idx !== -1) mockLibrary.splice(idx, 1);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/library\/[^/]+$/) && (m === 'patch' || m === 'put')) {
    const id = path.split('/').pop();
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const idx = mockLibrary.findIndex(i => i.item_id === id);
    if (idx !== -1) Object.assign(mockLibrary[idx], body);
    return { data: mockLibrary[idx] || {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Community: servers, channels
  if (path === '/api/servers' && m === 'get') {
    return { data: mockServers, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/servers/discover/all' && m === 'get') {
    return { data: mockServers, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+$/) && m === 'get') {
    const serverId = path.split('/')[3];
    const server = mockServers.find(s => s.server_id === serverId) || mockServers[0];
    return { data: server, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/resources$/) && m === 'get') {
    return { data: mockServerResources, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/resources$/) && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const res = { resource_id: genId('res'), ...body };
    mockServerResources.push(res);
    return { data: res, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/goals$/) && m === 'get') {
    return { data: mockServerGoals, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/goals$/) && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const goal = { goal_id: genId('goal'), current: 0, ...body };
    mockServerGoals.push(goal);
    return { data: goal, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/goals\/[^/]+\/contribute$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/notes$/) && m === 'get') {
    return { data: mockServerNotes, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/notes$/) && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const note = { note_id: genId('note'), ...body };
    mockServerNotes.push(note);
    return { data: note, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/notes\/[^/]+$/) && m === 'put') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/ai-goals$/) && m === 'post') {
    return { data: { goals: [] }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/servers/academy' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const server = { server_id: genId('server'), name: body.name || 'Academy', description: body.description || '', channels: [], ...body };
    mockServers.push(server);
    return { data: server, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/servers' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const server = { server_id: genId('server'), name: body.name || 'Server', description: body.description || '', channels: [], ...body };
    mockServers.push(server);
    return { data: server, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/join$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/servers\/[^/]+\/leave$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/channels\/[^/]+\/messages$/) && m === 'get') {
    return { data: mockChannelMessages, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/channels\/[^/]+\/messages$/) && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const msg = { message_id: genId('msg'), content: body.content || '', timestamp: new Date().toISOString(), user_id: mockUser.user_id };
    mockChannelMessages.push(msg);
    return { data: msg, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Store, wishlists, exchanges
  if (path === '/api/store/items' && m === 'get') {
    return { data: mockStoreItems, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/premium/status' && m === 'get') {
    return { data: { is_premium: false }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/premium/subscribe' && m === 'post') {
    return { data: { ...mockUser, is_premium: true }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/wishlists' && m === 'get') {
    return { data: mockWishlists, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/wishlists' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const wl = { wishlist_id: genId('wl'), name: body.name || 'Wishlist', items: [] };
    mockWishlists.push(wl);
    return { data: wl, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/wishlists\/[^/]+$/) && m === 'get') {
    const id = path.split('/')[3];
    const wl = mockWishlists.find(w => w.wishlist_id === id) || { wishlist_id: id, name: 'Wishlist', items: [] };
    return { data: wl, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/wishlists/items' && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/wishlists\/items\/[^/]+\/purchase$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/exchanges' && m === 'get') {
    return { data: mockExchanges, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/exchanges' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const ex = { exchange_id: genId('ex'), name: body.name || 'Exchange', participants: [] };
    mockExchanges.push(ex);
    return { data: ex, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/exchanges\/[^/]+$/) && m === 'get') {
    const id = path.split('/')[3];
    const ex = mockExchanges.find(e => e.exchange_id === id) || { exchange_id: id, name: 'Exchange', participants: [] };
    return { data: ex, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/exchanges\/[^/]+\/join$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Schools
  if (path === '/api/schools' && m === 'get') {
    return { data: mockSchools, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/schools\/[^/]+$/) && m === 'get') {
    const schoolId = path.split('/')[3];
    const school = mockSchools.find(s => s.school_id === schoolId) || mockSchools[0];
    return { data: school, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/schools\/[^/]+\/leaderboard$/) && m === 'get') {
    return { data: mockLeaderboard, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/schools' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const school = { school_id: genId('school'), name: body.name || 'School', member_count: 0, ...body };
    mockSchools.push(school);
    return { data: school, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/schools\/[^/]+\/join$/) && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Leaderboards
  if (path === '/api/leaderboard/global' && m === 'get') {
    const data = buildLeaderboard('global').slice(0, 100);
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/leaderboard/weekly' && m === 'get') {
    const data = buildLeaderboard('weekly').slice(0, 100);
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/leaderboard\/class\/[^/]+$/) && m === 'get') {
    const classId = path.split('/')[4];
    const data = buildLeaderboard('class', { classId });
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/leaderboard\/school\/[^/]+$/) && m === 'get') {
    const schoolId = path.split('/')[4];
    const data = buildLeaderboard('school', { schoolId });
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/leaderboard\/class\/[^/]+\/reset$/) && m === 'delete') {
    const classId = normalizeClassId(path.split('/')[4]);
    leaderboardClassResets[classId] = new Date().toISOString();
    saveLeaderboardResets();
    return { data: { success: true, classId }, status: 200, statusText: 'OK', headers: {}, config };
  }

  if (path === '/api/xp/award' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const amount = Math.max(0, Number(body.amount) || 0);
    const reason = body.reason || 'XP award';
    const previousUser = getActiveMockUser();
    const previousXp = previousUser?.xp || 0;
    const previousLevel = previousUser?.level || 1;
    const newXp = previousXp + amount;
    const newLevel = getLevelFromXp(newXp);
    const updatedUser = saveActiveMockUser({
      ...previousUser,
      xp: newXp,
      level: newLevel,
    });

    recordXpHistory(updatedUser.user_id, amount);
    const profile = ensureLeaderboardProfileForUser(updatedUser);
    leaderboardEvents.push({
      eventId: genId('xp_evt'),
      userId: updatedUser.user_id,
      schoolId: profile?.schoolId || updatedUser.school_id || 'school_demo_001',
      classId: body.classId ? normalizeClassId(body.classId) : (profile?.classIds?.[0] || null),
      xp: amount,
      coins: 0,
      timestamp: new Date().toISOString(),
    });
    saveLeaderboardEvents();

    return {
      data: {
        reason,
        amount,
        previousXp,
        newXp,
        previousLevel,
        newLevel,
        leveledUp: newLevel > previousLevel,
        rankTitle: getRankTitleForLevel(newLevel),
        user: updatedUser,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }

  // Classes
  if (path === '/api/classes' && m === 'get') {
    const memberClassIds = mockClassMemberships
      .filter(mb => mb.user_id === mockUser.user_id)
      .map(mb => mb.class_id);
    const classes = mockClasses
      .filter(c => memberClassIds.includes(c.class_id))
      .map(c => ({ ...c, ranks: getClassRankTitles(c.class_id) }));
    return { data: classes, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/classes' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const prefix = (body.subject || 'CLS').substring(0, 3).toUpperCase();
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cls = {
      class_id: genId('class'),
      name: body.name || 'Class',
      subject: body.subject || '',
      description: body.description || '',
      grade: body.grade || '',
      join_code: code,
      teacher_name: mockUser.display_name || 'Teacher',
      teacher_id: mockUser.user_id,
      student_count: 0,
      created_at: new Date().toISOString(),
    };
    mockClasses.push(cls);
    mockClassMessages[cls.class_id] = [];
    mockClassAssignments[cls.class_id] = [];
    mockClassResources[cls.class_id] = [];
    return { data: cls, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/classes/join-preview' && m === 'get') {
    const code = (config.params && config.params.code) ? config.params.code : '';
    const cls = mockClasses.find(c => c.join_code.toUpperCase() === code.toUpperCase());
    if (!cls) return { data: { error: 'Class not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
    return { data: cls, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/join$/) && m === 'post') {
    const classId = path.split('/')[3];
    const already = mockClassMemberships.find(mb => mb.class_id === classId && mb.user_id === mockUser.user_id);
    if (!already) {
      mockClassMemberships.push({ class_id: classId, user_id: mockUser.user_id, joined_at: new Date().toISOString() });
      const cls = mockClasses.find(c => c.class_id === classId);
      if (cls) cls.student_count = (cls.student_count || 0) + 1;
    }
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/messages\/[^/]+\/pin$/) && m === 'patch') {
    const parts = path.split('/');
    const classId = parts[3];
    const msgId = parts[5];
    const msgs = mockClassMessages[classId] || [];
    const msg = msgs.find(msg => msg.message_id === msgId);
    if (msg) msg.pinned = !msg.pinned;
    return { data: msg || {}, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/messages$/) && m === 'get') {
    const classId = path.split('/')[3];
    return { data: mockClassMessages[classId] || [], status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/messages$/) && m === 'post') {
    const classId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const msg = {
      message_id: genId('cmsg'),
      class_id: classId,
      content: body.content || '',
      sender_name: mockUser.display_name || 'You',
      sender_id: mockUser.user_id,
      sender_role: 'student',
      timestamp: new Date().toISOString(),
      pinned: false,
    };
    if (!mockClassMessages[classId]) mockClassMessages[classId] = [];
    mockClassMessages[classId].push(msg);
    return { data: msg, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/assignments$/) && m === 'get') {
    const classId = path.split('/')[3];
    return { data: mockClassAssignments[classId] || [], status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/assignments$/) && m === 'post') {
    const classId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const asgn = {
      assignment_id: genId('casgn'),
      class_id: classId,
      title: body.title || 'Assignment',
      description: body.description || '',
      due_date: body.due_date || null,
      type: body.type || 'assignment',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    if (!mockClassAssignments[classId]) mockClassAssignments[classId] = [];
    mockClassAssignments[classId].push(asgn);
    return { data: asgn, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/resources$/) && m === 'get') {
    const classId = path.split('/')[3];
    return { data: mockClassResources[classId] || [], status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/resources$/) && m === 'post') {
    const classId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const res = {
      resource_id: genId('cres'),
      class_id: classId,
      title: body.title || 'Resource',
      url: body.url || '',
      type: body.type || 'link',
      uploaded_by: mockUser.display_name || 'Teacher',
      created_at: new Date().toISOString(),
    };
    if (!mockClassResources[classId]) mockClassResources[classId] = [];
    mockClassResources[classId].push(res);
    return { data: res, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/ranks$/) && m === 'get') {
    const classId = path.split('/')[3];
    return { data: getClassRankTitles(classId), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/ranks$/) && m === 'patch') {
    const classId = normalizeClassId(path.split('/')[3]);
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    classRankTitles[classId] = getNormalizedRankTitles(body);
    saveClassRankTitles();
    return { data: classRankTitles[classId], status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+$/) && m === 'get') {
    const classId = path.split('/')[3];
    const cls = mockClasses.find(c => c.class_id === classId);
    if (!cls) return { data: { error: 'Not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
    return { data: { ...cls, ranks: getClassRankTitles(classId) }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Teacher class feed posts
  if (path.match(/^\/api\/classes\/[^/]+\/posts$/) && m === 'get') {
    const classId = path.split('/')[3];
    const posts = (teacherClassPosts[classId] || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(serializeTeacherPost);
    return { data: posts, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/posts$/) && m === 'post') {
    const classId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const post = {
      id: genId('post'),
      classId,
      authorId: body.authorId || mockTeacherActor.user_id,
      authorName: body.authorName || mockTeacherActor.name,
      isTeacher: body.isTeacher !== false,
      content: body.content || '',
      pinned: false,
      created_at: new Date().toISOString(),
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      reactions: [],
    };
    if (!teacherClassPosts[classId]) teacherClassPosts[classId] = [];
    teacherClassPosts[classId].unshift(post);
    saveTeacherClassPosts();
    return { data: serializeTeacherPost(post), status: 200, statusText: 'OK', headers: {}, config };
  }

  if (path.match(/^\/api\/posts\/[^/]+\/react$/) && m === 'post') {
    const postId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const post = getTeacherPostById(postId);
    if (!post) {
      return { data: { error: 'Post not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
    }
    const emoji = body.emoji;
    const existingIndex = post.reactions.findIndex(
      (reaction) => reaction.user_id === mockTeacherActor.user_id && reaction.emoji === emoji
    );
    if (existingIndex >= 0) {
      post.reactions.splice(existingIndex, 1);
    } else {
      post.reactions.push({ emoji, user_id: mockTeacherActor.user_id });
    }
    saveTeacherClassPosts();
    return { data: serializeTeacherPost(post), status: 200, statusText: 'OK', headers: {}, config };
  }

  if (path.match(/^\/api\/posts\/[^/]+\/replies$/) && m === 'get') {
    const postId = path.split('/')[3];
    const replies = (teacherPostReplies[postId] || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { data: replies, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/posts\/[^/]+\/replies$/) && m === 'post') {
    const postId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const reply = {
      id: genId('reply'),
      postId,
      user_id: mockTeacherActor.user_id,
      user_name: mockTeacherActor.name,
      isTeacher: true,
      content: body.content || '',
      created_at: new Date().toISOString(),
    };
    if (!teacherPostReplies[postId]) teacherPostReplies[postId] = [];
    teacherPostReplies[postId].push(reply);
    saveTeacherPostReplies();
    return { data: reply, status: 200, statusText: 'OK', headers: {}, config };
  }

  if (path === '/api/uploads' && m === 'post') {
    const file = config.data instanceof FormData ? config.data.get('file') : null;
    const fileName = file?.name || `attachment-${Date.now()}`;
    const mimeType = file?.type || 'application/octet-stream';
    const encodedName = encodeURIComponent(fileName);
    return {
      data: {
        url: `https://mock-storage.local/${Date.now()}-${encodedName}`,
        name: fileName,
        mime_type: mimeType,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }

  if (path.match(/^\/api\/classes\/[^/]+\/members$/) && m === 'get') {
    const classId = path.split('/')[3];
    return { data: teacherClassMembers[classId] || [], status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/members\/[^/]+\/remove$/) && m === 'post') {
    const parts = path.split('/');
    const classId = parts[3];
    const userId = parts[5];
    teacherClassMembers[classId] = (teacherClassMembers[classId] || []).filter((member) => member.id !== userId);
    saveTeacherClassMembers();
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/classes\/[^/]+\/members\/[^/]+\/mute$/) && m === 'post') {
    const parts = path.split('/');
    const classId = parts[3];
    const userId = parts[5];
    const members = teacherClassMembers[classId] || [];
    const member = members.find((entry) => entry.id === userId);
    if (member) {
      member.mutedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      saveTeacherClassMembers();
    }
    return {
      data: { success: true, mutedUntil: member?.mutedUntil || null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }

  // Streaks
  if (path === '/api/streaks' && m === 'get') {
    return { data: { current_streak: _streakState.current_streak, last_activity_date: _streakState.last_activity_date, max_streak: _streakState.max_streak, broken_streak_value: _streakState.broken_streak_value || 0, broken_streak_date: _streakState.broken_streak_date || null }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/streaks/increment' && m === 'post') {
    return { data: _incrementStreak(), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/streaks/repair' && m === 'post') {
    const restoredValue = _streakState.broken_streak_value || 0;
    _streakState.current_streak = restoredValue;
    _streakState.max_streak = Math.max(_streakState.max_streak, restoredValue);
    _streakState.broken_streak_value = 0;
    _streakState.broken_streak_date = null;
    _saveStreakState();
    return { data: { current_streak: _streakState.current_streak, last_activity_date: _streakState.last_activity_date, max_streak: _streakState.max_streak }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Practice & user
  if (path === '/api/practice/stats' && m === 'post') {
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Practice mastery: record an answer
  // POST /api/practice/answer  { userId, topic, correct }
  if (path === '/api/practice/answer' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const { userId = 'user_demo_001', topic, correct } = body;
    if (topic) {
      const store = JSON.parse(localStorage.getItem('mock_mastery_answers') || '{}');
      if (!store[userId]) store[userId] = {};
      if (!store[userId][topic]) store[userId][topic] = [];
      store[userId][topic].push(correct ? 1 : 0);
      // Keep only last 10
      if (store[userId][topic].length > 10) store[userId][topic] = store[userId][topic].slice(-10);
      localStorage.setItem('mock_mastery_answers', JSON.stringify(store));
    }
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Practice mastery: get mastery levels per topic for a user
  // GET /api/practice/mastery/:userId
  {
    const masteryMatch = path.match(/^\/api\/practice\/mastery\/(.+)$/);
    if (masteryMatch && m === 'get') {
      const userId = masteryMatch[1];
      const store = JSON.parse(localStorage.getItem('mock_mastery_answers') || '{}');
      const userData = store[userId] || {};
      const computeLevel = (history) => {
        if (!history || history.length === 0) return null;
        const score = Math.round((history.reduce((a, b) => a + b, 0) / history.length) * 100);
        let level;
        if (score < 50) level = 'Struggling';
        else if (score < 70) level = 'Practicing';
        else if (score < 90) level = 'Proficient';
        else level = 'Mastered';
        return { level, score, history, attempts: history.length };
      };
      const topics = {};
      for (const [topic, hist] of Object.entries(userData)) {
        const result = computeLevel(hist);
        if (result) topics[topic] = result;
      }
      return { data: { topics }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (path === '/api/user/upgrade-lite' && m === 'post') {
    return { data: { ...mockUser, is_premium: true }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Strengths
  if (path === '/api/profile/strength' && m === 'get') {
    return {
      data: {
        strengths: [
          { name: 'Analytical Thinking', score: 85, description: 'Excellent at breaking down complex problems' },
          { name: 'Creative Problem Solving', score: 78, description: 'Good at finding innovative solutions' },
          { name: 'Visual Learning', score: 92, description: 'Learns best through visual aids and diagrams' }
        ],
        career_clusters: [
          { name: 'STEM', match_score: 88, careers: ['Engineer', 'Data Scientist', 'Researcher'] },
          { name: 'Health Sciences', match_score: 76, careers: ['Doctor', 'Nurse', 'Medical Researcher'] }
        ],
        skill_paths: [
          { name: 'Computer Science', progress: 65, next_steps: ['Learn Python', 'Build projects'] },
          { name: 'Mathematics', progress: 78, next_steps: ['Advanced calculus', 'Statistics'] }
        ]
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }
  if (path === '/api/onboarding' && m === 'post') {
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Auth unlock (AuthPage)
  if (path === '/api/auth/unlock/request' && m === 'post') {
    return { data: { message: 'Unlock code sent.', _dev_code: '123456' }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/auth/unlock/verify' && m === 'post') {
    return { data: { message: 'Account unlocked.' }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Coins
  if (path === '/api/coins/balance' && m === 'get') {
    return { data: { balance: _coinBalance }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/coins/award' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    return { data: _applyCoins(Number(body.amount) || 0, body.reason || 'award', body.userId), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/coins/spend' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    return { data: _applyCoins(-(Number(body.amount) || 0), body.reason || 'spend', body.userId), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/coins/transactions' && m === 'get') {
    return { data: mockCoinTransactions.slice(0, 50), status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path === '/api/badges/award' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const activeUser = getActiveMockUser();
    const badgeId = body.badgeId;
    const nextBadges = Array.isArray(activeUser.badges) ? [...activeUser.badges] : [];
    const nextEarnedAt = activeUser.badge_earned_at ? { ...activeUser.badge_earned_at } : {};
    const alreadyAwarded = nextBadges.includes(badgeId);

    if (!alreadyAwarded) {
      nextBadges.push(badgeId);
      nextEarnedAt[badgeId] = new Date().toISOString();
    }

    const nextUser = saveActiveMockUser({
      ...activeUser,
      badges: nextBadges,
      badge_earned_at: nextEarnedAt,
    });

    return {
      data: {
        success: true,
        awarded: !alreadyAwarded,
        badgeId,
        earnedAt: nextEarnedAt[badgeId],
        badge: getBadgeById(badgeId),
        user: nextUser,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }

  // Gradebook
  if (path.match(/^\/api\/gradebook\/class\/[^/]+$/) && m === 'get') {
    const classId = path.split('/')[4];
    const maxScores = { a1: 50, a5: 30, a8: 20 };
    const assignments = mockAssignments
      .filter(a => a.classId === classId && a.status !== 'draft')
      .map(a => ({ ...a, maxScore: maxScores[a.id] || 100 }));
    const students = mockStudents.slice(0, 8);
    const assignmentIds = new Set(assignments.map(a => a.id));
    const submissions = mockSubmissions.filter(s => assignmentIds.has(s.assignmentId));
    // Build nested map submissionsMap[studentId][assignmentId] for fast lookup
    const submissionsMap = {};
    for (const sub of submissions) {
      if (!submissionsMap[sub.userId]) submissionsMap[sub.userId] = {};
      submissionsMap[sub.userId][sub.assignmentId] = sub;
    }
    return { data: { assignments, students, submissions, submissionsMap }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Submission comment override
  if (path.match(/^\/api\/submissions\/[^/]+\/comment$/) && m === 'patch') {
    const submissionId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const sub = mockSubmissions.find(s => s.submission_id === submissionId)
      || mockMyGrades.find(s => s.submission_id === submissionId);
    if (sub) { sub.teacherComment = body.comment ?? ''; _saveSubmissions(); }
    return { data: sub || {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Submission score override
  if (path.match(/^\/api\/submissions\/[^/]+\/score$/) && m === 'patch') {
    const submissionId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const sub = mockSubmissions.find(s => s.submission_id === submissionId)
      || mockMyGrades.find(s => s.submission_id === submissionId);
    if (sub && body.score != null) { sub.score = Number(body.score); _saveSubmissions(); }
    return { data: sub || {}, status: 200, statusText: 'OK', headers: {}, config };
  }

  // Student: my grades
  if (path === '/api/submissions/my' && m === 'get') {
    return { data: mockMyGrades, status: 200, statusText: 'OK', headers: {}, config };
  }

  // ─── Quiz settings ────────────────────────────────────────────────────────
  // GET /api/assignments/:id/quiz-settings → { time_limit, max_attempts }
  if (path.match(/^\/api\/assignments\/[^/]+\/quiz-settings$/) && m === 'get') {
    const assignmentId = path.split('/')[3];
    const settings = _quizSettings[assignmentId] || { time_limit: null, max_attempts: 'unlimited' };
    return { data: settings, status: 200, statusText: 'OK', headers: {}, config };
  }

  // PUT /api/assignments/:id/quiz-settings → saves and returns { time_limit, max_attempts }
  if (path.match(/^\/api\/assignments\/[^/]+\/quiz-settings$/) && m === 'put') {
    const assignmentId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    _quizSettings[assignmentId] = {
      time_limit: body.time_limit ?? null,
      max_attempts: body.max_attempts ?? 'unlimited',
    };
    _saveQuizSettings();
    return { data: _quizSettings[assignmentId], status: 200, statusText: 'OK', headers: {}, config };
  }

  // ─── Quiz attempt gate ────────────────────────────────────────────────────
  // POST /api/assignments/:id/attempt
  // Body: { userId }
  // Returns: { allowed, attempt_number, attempts_used, max_attempts }
  // If allowed, records a placeholder submission so the count increments.
  if (path.match(/^\/api\/assignments\/[^/]+\/attempt$/) && m === 'post') {
    const assignmentId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const userId = body.userId || mockUser.user_id;
    const settings = _quizSettings[assignmentId] || { time_limit: null, max_attempts: 'unlimited' };
    const attemptsUsed = _getAttemptCount(userId, assignmentId);
    const maxAttempts = settings.max_attempts;
    const allowed = maxAttempts === 'unlimited' || attemptsUsed < Number(maxAttempts);

    if (!allowed) {
      return {
        data: {
          allowed: false,
          error: 'No attempts remaining.',
          attempts_used: attemptsUsed,
          max_attempts: maxAttempts,
        },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      };
    }

    // Record the attempt as a pending submission so the count is accurate
    const submission = {
      submission_id: genId('sub'),
      userId,
      assignmentId,
      score: null,
      maxScore: null,
      submittedAt: new Date().toISOString(),
      teacherComment: '',
      isLate: false,
      answers: [],
      attempt_number: attemptsUsed + 1,
    };
    mockSubmissions.push(submission);
    _saveSubmissions();

    return {
      data: {
        allowed: true,
        attempt_number: attemptsUsed + 1,
        attempts_used: attemptsUsed + 1,
        max_attempts: maxAttempts,
        submission_id: submission.submission_id,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }

  // Vocab Jam endpoints
  if (path === '/api/jams/create' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const jamId = genId('jam');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const wordSet = JAM_WORD_SETS.find(ws => ws.id === body.wordSetId) || JAM_WORD_SETS[0];
    mockJamSessions[jamId] = { jamId, code, wordSet, classId: body.classId || null, createdAt: new Date().toISOString(), results: null };
    mockJamCodes[code] = jamId;
    return { data: { jamId, code, wordSet }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/jams\/[^/]+\/results$/) && m === 'post') {
    const jamId = path.split('/')[3];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    if (mockJamSessions[jamId]) mockJamSessions[jamId].results = body.results || [];
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (path.match(/^\/api\/jams\/[^/]+$/) && m === 'get') {
    const code = path.split('/')[3].toUpperCase();
    const jamId = mockJamCodes[code];
    if (!jamId || !mockJamSessions[jamId]) {
      return { data: { error: 'Jam not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
    }
    return { data: mockJamSessions[jamId], status: 200, statusText: 'OK', headers: {}, config };
  }

  // ─── Direct Messages ───────────────────────────────────────────────────────
  // GET /api/messages/contacts — users the current user can DM
  if (path === '/api/messages/contacts' && m === 'get') {
    return { data: Object.values(mockDMUsers), status: 200, statusText: 'OK', headers: {}, config };
  }

  // GET /api/messages/inbox — one entry per conversation partner
  if (path === '/api/messages/inbox' && m === 'get') {
    const currentUserId = mockUser.user_id;
    const partnerIds = new Set();
    for (const msg of mockDMMessages) {
      if (msg.sender_id === currentUserId) partnerIds.add(msg.receiver_id);
      if (msg.receiver_id === currentUserId) partnerIds.add(msg.sender_id);
    }
    const inbox = [];
    for (const partnerId of partnerIds) {
      const thread = mockDMMessages
        .filter(msg =>
          (msg.sender_id === currentUserId && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === currentUserId)
        )
        .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      const lastMsg = thread[thread.length - 1];
      const unreadCount = thread.filter(msg => msg.receiver_id === currentUserId && !msg.read).length;
      inbox.push({
        user: mockDMUsers[partnerId] || { user_id: partnerId, name: 'Unknown', role: 'student', avatar: null },
        last_message: lastMsg,
        unread_count: unreadCount,
      });
    }
    inbox.sort((a, b) => new Date(b.last_message.sent_at) - new Date(a.last_message.sent_at));
    return { data: inbox, status: 200, statusText: 'OK', headers: {}, config };
  }

  // POST /api/messages — send a message
  if (path === '/api/messages' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const { receiverId, content } = body;
    if (!_ALLOWED_DM_PARTNERS.includes(receiverId)) {
      return { data: { error: 'Not allowed to message this user' }, status: 403, statusText: 'Forbidden', headers: {}, config };
    }
    const message = {
      message_id: genId('dm'),
      sender_id: mockUser.user_id,
      receiver_id: receiverId,
      content: content || '',
      sent_at: new Date().toISOString(),
      read: false,
    };
    mockDMMessages.push(message);
    _saveDMMessages();
    return { data: message, status: 200, statusText: 'OK', headers: {}, config };
  }

  // GET /api/messages/:userId — thread with a specific user (must be after inbox check)
  {
    const threadMatch = path.match(/^\/api\/messages\/([^/]+)$/);
    if (threadMatch && m === 'get') {
      const partnerId = threadMatch[1];
      const currentUserId = mockUser.user_id;
      const thread = mockDMMessages
        .filter(msg =>
          (msg.sender_id === currentUserId && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === currentUserId)
        )
        .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      // Mark incoming messages as read
      let changed = false;
      for (const msg of mockDMMessages) {
        if (msg.sender_id === partnerId && msg.receiver_id === currentUserId && !msg.read) {
          msg.read = true;
          changed = true;
        }
      }
      if (changed) _saveDMMessages();
      const partner = mockDMUsers[partnerId] || { user_id: partnerId, name: 'Unknown', role: 'student', avatar: null };
      return { data: { messages: thread, partner }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ─── Class Challenges ──────────────────────────────────────────────────────
  // POST /api/challenges  { classId, title, goalDescription, targetValue, metric, deadline, rewardCoins }
  if (path === '/api/challenges' && m === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
    const target = Number(body.targetValue) || 100;
    const challenge = {
      challenge_id: genId('challenge'),
      classId: body.classId,
      title: body.title || 'Class Challenge',
      goalDescription: body.goalDescription || '',
      targetValue: target,
      metric: body.metric || 'flashcards_reviewed',
      deadline: body.deadline || null,
      rewardCoins: Number(body.rewardCoins) || 50,
      currentValue: Math.floor(target * 0.65),
      completed: false,
      rewardedAt: null,
      createdAt: new Date().toISOString(),
    };
    mockChallenges.push(challenge);
    _saveChallenges();
    return { data: challenge, status: 200, statusText: 'OK', headers: {}, config };
  }

  // GET /api/challenges/class/:classId
  if (path.match(/^\/api\/challenges\/class\/[^/]+$/) && m === 'get') {
    const classId = path.split('/')[4];
    const challenges = mockChallenges.filter(c => c.classId === classId);
    // Simulate student activity: advance non-completed challenges a little each fetch
    let changed = false;
    for (const c of challenges) {
      if (!c.completed && c.currentValue < c.targetValue) {
        c.currentValue = Math.min(c.targetValue, c.currentValue + Math.floor(Math.random() * 6 + 2));
        changed = true;
      }
    }
    if (changed) _saveChallenges();
    return { data: challenges, status: 200, statusText: 'OK', headers: {}, config };
  }

  // POST /api/challenges/:id/complete  — awards coins and marks the challenge done
  if (path.match(/^\/api\/challenges\/[^/]+\/complete$/) && m === 'post') {
    const challengeId = path.split('/')[3];
    const c = mockChallenges.find(ch => ch.challenge_id === challengeId);
    if (c && !c.rewardedAt) {
      c.completed = true;
      c.rewardedAt = new Date().toISOString();
      _applyCoins(c.rewardCoins, `Class challenge completed: ${c.title}`, mockUser.user_id);
      _saveChallenges();
    }
    return { data: { success: true, rewardCoins: c?.rewardCoins ?? 0 }, status: 200, statusText: 'OK', headers: {}, config };
  }
  // ─────────────────────────────────────────────────────────────────────────

  return null;
}

if (process.env.REACT_APP_USE_MOCK === 'true') {

// Axios: use request interceptor to inject mock adapter per-request (avoids replacing
// axios.defaults.adapter which is an array in axios v1.x and would throw when called).
axios.interceptors.request.use((config) => {
  const url = config.url || '';
  const fullUrl = config.baseURL ? new URL(config.url || '', config.baseURL).href : url;
  const path = getPath(fullUrl);
  const mock = getMockResponse(path, config.method, config);
  if (mock) {
    config.adapter = () => Promise.resolve(mock);
  }
  return config;
});

// WebSocket mock: intercepts all ws:// connections.
// Jam-specific URLs (/jam/:jamId) are backed by jamBus for real-time score updates.
// All other URLs use a no-op so the UI doesn't hang on failed connections.
window.WebSocket = function (url) {
  const jamMatch = typeof url === 'string' && url.match(/\/jam\/([A-Za-z0-9_-]+)/);
  if (jamMatch) {
    const jamId = jamMatch[1];
    let unsub = null;
    const ws = {
      readyState: 1,
      close() { this.readyState = 3; if (unsub) unsub(); },
      send(data) {
        try {
          const msg = typeof data === 'string' ? JSON.parse(data) : data;
          if (msg && msg.type === 'score_update' && msg.playerId) {
            jamBus.setScore(jamId, msg.playerId, msg.score);
          }
        } catch (_) {}
      },
      addEventListener(type, fn) {
        if (type === 'message') this.onmessage = fn;
        if (type === 'open') setTimeout(() => fn({ type: 'open' }), 0);
      },
      removeEventListener() {},
    };
    unsub = jamBus.subscribe(jamId, (event) => {
      if (ws.readyState === 1 && typeof ws.onmessage === 'function') {
        ws.onmessage({ data: JSON.stringify(event) });
      }
    });
    setTimeout(() => {
      if (typeof ws.onopen === 'function') ws.onopen({ type: 'open' });
    }, 0);
    return ws;
  }
  // No-op fallback for non-jam WebSockets (community, etc.)
  const ws = {
    readyState: 1,
    close() { this.readyState = 3; },
    send() {},
    addEventListener() {},
    removeEventListener() {},
  };
  setTimeout(() => {
    if (typeof ws.onopen === 'function') ws.onopen({ type: 'open' });
  }, 0);
  return ws;
};

// Fetch wrapper for Success, Pricing, NotesStudio
const originalFetch = window.fetch;
window.fetch = function (url, opts) {
  const urlStr = typeof url === 'string' ? url : (url && url.url);
  if (!urlStr || !urlStr.includes('/api/')) return originalFetch.apply(this, arguments);

  const path = urlStr.includes('http') ? getPath(urlStr) : (urlStr.startsWith('/') ? urlStr : `/${urlStr}`);
  const method = (opts && opts.method) || 'GET';
  const body = opts && opts.body;
  let data = null;
  try {
    if (body && typeof body === 'string') data = JSON.parse(body);
  } catch (_) {}

  // Payments verify (Success.jsx)
  if (path.includes('/api/payments/verify') && method === 'POST') {
    return Promise.resolve(
      new Response(JSON.stringify({ success: true, message: 'Payment verified (mock)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
  // Founders status (Pricing.jsx)
  if (path.includes('/api/founders/status')) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          is_founder: false,
          tier: null,
          can_claim: false,
          founder_pass_active: false
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
  // Checkout founder-pass (Pricing.jsx)
  if (path.includes('/api/checkout/founder-pass') && method === 'POST') {
    return Promise.resolve(
      new Response(
        JSON.stringify({ checkout_url: '/success', session_id: 'mock_session' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
  // Notes save (NotesStudio.jsx)
  if (path.includes('/api/notes/save') && method === 'POST') {
    const noteId = (data && data.note_id) || genId('note');
    return Promise.resolve(
      new Response(
        JSON.stringify({
          note_id: noteId,
          title: (data && data.title) || 'Note',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
  // Notes suggest-diagram (NotesStudio.jsx - relative URL /api/notes/suggest-diagram)
  if (path.includes('/api/notes/suggest-diagram') && method === 'POST') {
    const mockDiagram = {
      type: 'mindmap',
      nodes: [
        { id: '1', text: 'Main Idea', position: { x: 350, y: 250 }, shape: 'ellipse', color: '#7C3AED' },
        { id: '2', text: 'Topic 1', position: { x: 150, y: 150 }, shape: 'rectangle', color: '#10B981' },
        { id: '3', text: 'Topic 2', position: { x: 550, y: 150 }, shape: 'rectangle', color: '#F59E0B' },
        { id: '4', text: 'Topic 3', position: { x: 150, y: 350 }, shape: 'rectangle', color: '#EF4444' },
        { id: '5', text: 'Topic 4', position: { x: 550, y: 350 }, shape: 'rectangle', color: '#3B82F6' }
      ],
      edges: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '1', to: '4' },
        { from: '1', to: '5' }
      ],
      suggestion: 'Mock diagram. Connect real API for AI-generated diagrams.'
    };
    return Promise.resolve(
      new Response(
        JSON.stringify(mockDiagram),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  return originalFetch.apply(this, arguments);
};

} // end if (REACT_APP_USE_MOCK === 'true')
