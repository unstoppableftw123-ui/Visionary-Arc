/**
 * API Service Abstraction Layer
 * Provides a unified interface that can switch between localStorage and real APIs
 * Set USE_REAL_API = true to use backend APIs, false to use localStorage mock data
 */

// Import the localStorage data service
import dataService from './dataService.js';
import { getMockGraphNotes } from '../data/mockGraphNotes';
import axios from 'axios';
import { awardBadge, checkAndAwardBadges, showBadgeUnlockToast } from '../lib/badges';
import { getXpForLevel, getXpForNextLevel } from '../data/rewardsProgram';

// Keep false for local dev without backend; set true to use real backend APIs
const USE_REAL_API = false;

// API configuration for real backend
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${API_BASE_URL}/api`;

const notifyUnlockedBadges = (unlocked = []) => {
  unlocked.forEach(({ badge }) => showBadgeUnlockToast(badge));
};

// Utility functions for API calls
const apiRequest = async (endpoint, options = {}) => {
  if (!USE_REAL_API) {
    throw new Error('Real API is disabled. Set USE_REAL_API = true to enable.');
  }

  const url = `${API}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(
        typeof data.detail === 'string'
          ? data.detail
          : data.detail?.message || data.message || `HTTP error! status: ${response.status}`
      );
      err.status = response.status;
      err.response = { status: response.status, data };
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Login — looks up user by email so different mock accounts work
  login: async (email, password) => {
    if (USE_REAL_API) {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } else {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const found = users.find(u => u.email === email);
      const user = found || await dataService.getCurrentUser();
      localStorage.setItem('mock_current_user', JSON.stringify(user));
      return { user, token: 'mock_token_' + Date.now() };
    }
  },

  // Register — creates a new user with the selected role
  register: async (email, password, name, role = 'student') => {
    if (USE_REAL_API) {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role })
      });
    } else {
      const newUser = {
        user_id: `user_${Date.now()}`,
        email, name, role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        banner: null,
        bio: '',
        xp: 0, coins: 100, level: 1,
        is_premium: false, avatar_frame: null,
        badges: [],
        badge_earned_at: {},
        school_id: null,
        created_at: new Date().toISOString(),
      };
      // Persist to users list and set as current user
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('mock_current_user', JSON.stringify(newUser));
      const awardResult = await awardBadge(newUser.user_id, 'first_login');
      const registeredUser = awardResult?.user || {
        ...newUser,
        badges: ['first_login'],
        badge_earned_at: { first_login: new Date().toISOString() },
      };
      showBadgeUnlockToast(awardResult?.badge);
      return { user: registeredUser, token: 'mock_token_' + Date.now() };
    }
  },

  // Get current user — prefers the last logged-in/registered user
  getCurrentUser: async () => {
    if (USE_REAL_API) {
      return apiRequest('/auth/me');
    } else {
      const token = localStorage.getItem('token') || 'mock_token_demo';
      localStorage.setItem('token', token);
      const stored = localStorage.getItem('mock_current_user');
      if (stored) { try { return JSON.parse(stored); } catch (_) {} }
      return dataService.getCurrentUser();
    }
  },

  // Logout
  logout: async () => {
    if (USE_REAL_API) {
      return apiRequest('/auth/logout', { method: 'POST' });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('mock_current_user');
      return { message: 'Logged out successfully' };
    }
  },

  // Google OAuth code exchange
  processOAuthCode: async (code) => {
    if (USE_REAL_API) {
      return apiRequest('/auth/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    } else {
      const user = await dataService.getCurrentUser();
      return {
        user,
        token: 'mock_oauth_token_' + Date.now()
      };
    }
  }
};

// Tasks API
export const tasksAPI = {
  // Get all tasks for user
  getTasks: async () => {
    if (USE_REAL_API) {
      return apiRequest('/tasks');
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.getTasks(user.user_id);
    }
  },

  // Create new task
  createTask: async (taskData) => {
    if (USE_REAL_API) {
      return apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.createTask({ ...taskData, user_id: user.user_id });
    }
  },

  // Update task
  updateTask: async (taskId, updates) => {
    if (USE_REAL_API) {
      return apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } else {
      return dataService.updateTask(taskId, updates);
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    if (USE_REAL_API) {
      return apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
    } else {
      return dataService.deleteTask(taskId);
    }
  },

  // Update task progress
  updateTaskProgress: async (taskId, progress) => {
    if (USE_REAL_API) {
      return apiRequest(`/tasks/${taskId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progress })
      });
    } else {
      return dataService.updateTask(taskId, { progress });
    }
  },

  // Get task stats for dashboard
  getStats: async () => {
    if (USE_REAL_API) {
      return apiRequest('/tasks/stats');
    } else {
      const user = await dataService.getCurrentUser();
      const [tasks, streakResp] = await Promise.all([
        dataService.getTasks(user.user_id),
        axios.get(`${API_BASE_URL}/api/streaks`),
      ]);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const today = new Date().toISOString().split('T')[0];
      const todayCheckins = tasks.filter(t => (t.check_ins || []).includes(today)).length;
      return {
        total_tasks: total,
        completed_tasks: completed,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
        today_checkins: todayCheckins,
        max_streak: streakResp.data.current_streak ?? 0,
      };
    }
  }
};

// Missions API (dashboard daily/weekly missions)
export const missionsAPI = {
  getMissions: async () => {
    if (USE_REAL_API) {
      return apiRequest('/missions');
    } else {
      const today = new Date().toISOString().split('T')[0];
      return [
        { mission_id: 'mock_mission_1', title: 'Complete 3 tasks', xp_reward: 50, coin_reward: 10, mission_type: 'daily', completed: false, claimed: false },
        { mission_id: 'mock_mission_2', title: 'Study for 30 minutes', xp_reward: 75, coin_reward: 15, mission_type: 'daily', completed: true, claimed: false },
        { mission_id: 'mock_mission_3', title: 'Check in to all tasks', xp_reward: 100, coin_reward: 20, mission_type: 'daily', completed: false, claimed: false },
        { mission_id: 'mock_mission_4', title: 'Complete 20 tasks this week', xp_reward: 200, coin_reward: 50, mission_type: 'weekly', completed: false, claimed: false }
      ];
    }
  },
  claimMission: async (missionId) => {
    if (USE_REAL_API) {
      return apiRequest(`/missions/${missionId}/claim`, { method: 'POST' });
    } else {
      return { message: 'Rewards claimed', xp: 50, coins: 10 };
    }
  }
};

// Gamification API (XP, level, coins for dashboard)
export const gamificationAPI = {
  getStats: async () => {
    if (USE_REAL_API) {
      return apiRequest('/gamification/stats');
    } else {
      const [user, balanceData] = await Promise.all([
        dataService.getCurrentUser(),
        coinsAPI.getBalance(),
      ]);
      const xp = user.xp ?? 0;
      const level = user.level ?? 1;
      const xpForCurrent = getXpForLevel(level);
      const xpForNext = getXpForNextLevel(level);
      const xpInLevel = xp - xpForCurrent;
      return {
        xp,
        coins: balanceData.balance,
        level,
        xp_in_level: Math.max(0, xpInLevel),
        xp_for_next_level: xpForNext,
        level_progress: Math.min(100, (xpInLevel / xpForNext) * 100),
        is_premium: user.is_premium ?? false
      };
    }
  }
};

export const xpAPI = {
  award: async ({ amount, reason, classId } = {}) => {
    if (USE_REAL_API) {
      return apiRequest('/xp/award', {
        method: 'POST',
        body: JSON.stringify({ amount, reason, classId }),
      });
    }

    const { data } = await axios.post(`${API_BASE_URL}/api/xp/award`, { amount, reason, classId });
    let nextUser = data?.user;

    try {
      const { unlocked, user } = await checkAndAwardBadges({
        user: nextUser,
        stats: { level: data?.newLevel ?? nextUser?.level, created_at: nextUser?.created_at },
      });
      nextUser = user || nextUser;
      notifyUnlockedBadges(unlocked);
    } catch (_) {}

    return { ...data, user: nextUser };
  },
};

// Notes API
export const notesAPI = {
  // Get all notes for user
  getNotes: async () => {
    if (USE_REAL_API) {
      return apiRequest('/notes');
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.getNotes(user.user_id);
    }
  },

  // Create new note
  createNote: async (noteData) => {
    if (USE_REAL_API) {
      return apiRequest('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.createNote({ ...noteData, user_id: user.user_id });
    }
  },

  // Update note
  updateNote: async (noteId, updates) => {
    if (USE_REAL_API) {
      return apiRequest(`/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } else {
      return dataService.updateNote(noteId, updates);
    }
  },

  // Delete note
  deleteNote: async (noteId) => {
    if (USE_REAL_API) {
      return apiRequest(`/notes/${noteId}`, { method: 'DELETE' });
    } else {
      return dataService.deleteNote(noteId);
    }
  },

  // Get note folders
  getFolders: async () => {
    if (USE_REAL_API) {
      return apiRequest('/notes/folders');
    } else {
      // Mock folders
      return ['math', 'science', 'english', 'history', 'sat_prep', 'projects'];
    }
  }
};

// Notes Studio API  (rich text + Excalidraw canvas)
export const notesStudioAPI = {
  /**
   * Save (create or update) a Notes Studio note.
   * @param {{ title, content, canvas_data, template_id, is_draft, note_id? }} payload
   */
  saveNote: async (payload) => {
    if (USE_REAL_API) {
      return apiRequest('/notes/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } else {
      // localStorage mock — mirrors what the component does directly
      const key = `notes-studio-${payload.title}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      const noteId = existing.note_id || `studio_mock_${Date.now()}`;
      const now = new Date().toISOString();
      const doc = {
        note_id: noteId,
        user_id: 'mock_user',
        ...payload,
        created_at: existing.created_at || now,
        updated_at: now,
      };
      localStorage.setItem(key, JSON.stringify(doc));
      return doc;
    }
  },

  /** Retrieve all saved studio notes for the current user. */
  getStudioNotes: async () => {
    if (USE_REAL_API) {
      return apiRequest('/notes/studio');
    } else {
      // Return any studio notes stored in localStorage; fallback to mock graph notes when empty
      const notes = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notes-studio-')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item && item.note_id) notes.push(item);
          } catch (_) { /* skip malformed entries */ }
        }
      }
      const list = notes.length > 0 ? notes : getMockGraphNotes();
      return list.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    }
  },
};

// Library API
export const libraryAPI = {
  // Get all library items
  getItems: async () => {
    if (USE_REAL_API) {
      return apiRequest('/library');
    } else {
      return dataService.getLibraryItems();
    }
  },

  // Create new library item
  createItem: async (itemData) => {
    if (USE_REAL_API) {
      return apiRequest('/library', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
    } else {
      return dataService.createLibraryItem(itemData);
    }
  },

  // Get item by type
  getItemsByType: async (itemType) => {
    if (USE_REAL_API) {
      return apiRequest(`/library?type=${itemType}`);
    } else {
      const items = await dataService.getLibraryItems();
      return items.filter(item => item.item_type === itemType);
    }
  }
};

// Competitions API
export const competitionsAPI = {
  // Get all competitions
  getCompetitions: async () => {
    if (USE_REAL_API) {
      return apiRequest('/competitions');
    } else {
      return dataService.getCompetitions();
    }
  },

  // Join competition
  joinCompetition: async (competitionId) => {
    if (USE_REAL_API) {
      return apiRequest(`/competitions/${competitionId}/join`, {
        method: 'POST'
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.joinCompetition(competitionId, user.user_id);
    }
  },

  // Submit competition entry
  submitEntry: async (competitionId, submissionData) => {
    if (USE_REAL_API) {
      return apiRequest(`/competitions/${competitionId}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });
    } else {
      return dataService.submitCompetition(submissionData);
    }
  },

  // Get competition history
  getHistory: async () => {
    if (USE_REAL_API) {
      return apiRequest('/competitions/history');
    } else {
      // Mock competition history
      return [
        {
          competition_id: 'comp_demo_001',
          title: 'Math Challenge',
          score: 85,
          placement: 3,
          xp_earned: 200,
          coins_earned: 25,
          submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  }
};

// Shop API
export const shopAPI = {
  // Get shop items
  getItems: async () => {
    if (USE_REAL_API) {
      return apiRequest('/shop');
    } else {
      return dataService.getShopItems();
    }
  },

  // Purchase item
  purchaseItem: async (itemId) => {
    if (USE_REAL_API) {
      return apiRequest('/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId })
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.purchaseItem(itemId, user.user_id);
    }
  },

  // Get purchase history
  getPurchaseHistory: async () => {
    if (USE_REAL_API) {
      return apiRequest('/shop/history');
    } else {
      // Mock purchase history
      return [
        {
          item_id: 'shop_demo_001',
          item_name: 'Energy Boost',
          price: 50,
          purchased_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  }
};

// Community API
export const communityAPI = {
  // Get servers
  getServers: async () => {
    if (USE_REAL_API) {
      return apiRequest('/community/servers');
    } else {
      return dataService.getCommunityServers();
    }
  },

  // Get server channels
  getChannels: async (serverId) => {
    if (USE_REAL_API) {
      return apiRequest(`/community/servers/${serverId}/channels`);
    } else {
      return dataService.getServerChannels(serverId);
    }
  },

  // Get channel messages
  getMessages: async (channelId) => {
    if (USE_REAL_API) {
      return apiRequest(`/community/channels/${channelId}/messages`);
    } else {
      return dataService.getChannelMessages(channelId);
    }
  },

  // Send message
  sendMessage: async (channelId, content) => {
    if (USE_REAL_API) {
      return apiRequest(`/community/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.sendMessage(channelId, user.user_id, content);
    }
  },

  // Join server
  joinServer: async (serverId) => {
    if (USE_REAL_API) {
      return apiRequest(`/community/servers/${serverId}/join`, {
        method: 'POST'
      });
    } else {
      return { success: true, message: 'Joined server successfully' };
    }
  }
};

// Practice API (SAT/ACT)
export const practiceAPI = {
  // Get practice stats
  getStats: async () => {
    if (USE_REAL_API) {
      return apiRequest('/practice/stats');
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.getPracticeStats(user.user_id);
    }
  },

  // Start practice session
  startSession: async (sessionData) => {
    if (USE_REAL_API) {
      return apiRequest('/practice/session', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
    } else {
      return dataService.startPracticeSession(sessionData);
    }
  },

  // Submit answer
  submitAnswer: async (sessionId, answerData) => {
    if (USE_REAL_API) {
      return apiRequest(`/practice/session/${sessionId}/answer`, {
        method: 'POST',
        body: JSON.stringify(answerData)
      });
    } else {
      return dataService.submitPracticeAnswer(sessionId, answerData);
    }
  },

  // Record a practice answer (mastery tracking)
  recordAnswer: async (userId, topic, correct) => {
    if (USE_REAL_API) {
      return apiRequest('/practice/answer', {
        method: 'POST',
        body: JSON.stringify({ userId, topic, correct }),
      });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/practice/answer`, { userId, topic, correct });
      return data;
    }
  },

  // Get mastery levels per topic for a user
  getMastery: async (userId) => {
    if (USE_REAL_API) {
      return apiRequest(`/practice/mastery/${userId}`);
    } else {
      const { data } = await axios.get(`${API_BASE_URL}/api/practice/mastery/${userId}`);
      return data;
    }
  },

  // Get practice questions
  getQuestions: async (testType, section, difficulty = 'medium') => {
    if (USE_REAL_API) {
      return apiRequest(`/practice/questions?test=${testType}&section=${section}&difficulty=${difficulty}`);
    } else {
      // Mock questions
      return {
        questions: [
          {
            id: 1,
            question: `Sample ${testType} ${section} question`,
            options: ['A', 'B', 'C', 'D'],
            correct: 0,
            time_limit: 60
          }
        ]
      };
    }
  }
};

// Strengths API
export const strengthsAPI = {
  // Get strength profile
  getProfile: async () => {
    if (USE_REAL_API) {
      return apiRequest('/strengths/profile');
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.getStrengthProfile(user.user_id);
    }
  },

  // Save onboarding data
  saveOnboarding: async (onboardingData) => {
    if (USE_REAL_API) {
      return apiRequest('/strengths/onboarding', {
        method: 'POST',
        body: JSON.stringify(onboardingData)
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.saveOnboardingData(user.user_id, onboardingData);
    }
  },

  // Update strengths
  updateStrengths: async (strengthsData) => {
    if (USE_REAL_API) {
      return apiRequest('/strengths/update', {
        method: 'PUT',
        body: JSON.stringify(strengthsData)
      });
    } else {
      return { success: true, message: 'Strengths updated successfully' };
    }
  }
};

// AI Generation API
export const aiAPI = {
  // Generate quiz
  generateQuiz: async (content, numQuestions = 5) => {
    if (USE_REAL_API) {
      return apiRequest('/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({ content, num_questions: numQuestions })
      });
    } else {
      return dataService.generateQuiz(content, numQuestions);
    }
  },

  // Generate flashcards
  generateFlashcards: async (content, numCards = 10) => {
    if (USE_REAL_API) {
      return apiRequest('/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify({ content, num_cards: numCards })
      });
    } else {
      return dataService.generateFlashcards(content, numCards);
    }
  },

  // Summarize text
  summarizeText: async (content, style = 'concise') => {
    if (USE_REAL_API) {
      return apiRequest('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ content, style })
      });
    } else {
      return dataService.summarizeText(content, style);
    }
  },

  // Get AI job status
  getJobStatus: async (jobId) => {
    if (USE_REAL_API) {
      return apiRequest(`/ai/jobs/${jobId}`);
    } else {
      // Mock job status
      return {
        job_id: jobId,
        status: 'completed',
        stage: 4,
        output: 'Mock AI output',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }
};

// User Profile API
export const profileAPI = {
  // Get user profile
  getProfile: async (userId) => {
    if (USE_REAL_API) {
      return apiRequest(`/profile/${userId}`);
    } else {
      const user = await dataService.getCurrentUser();
      return user;
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    if (USE_REAL_API) {
      return apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } else {
      const user = await dataService.getCurrentUser();
      return dataService.updateUser(user.user_id, updates);
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    if (USE_REAL_API) {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiRequest('/profile/avatar', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      });
    } else {
      // Mock avatar upload
      const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      const user = await dataService.getCurrentUser();
      return dataService.updateUser(user.user_id, { avatar: mockUrl });
    }
  }
};

// Streaks API
export const streaksAPI = {
  getStreak: async () => {
    if (USE_REAL_API) {
      return apiRequest('/streaks');
    } else {
      const { data } = await axios.get(`${API_BASE_URL}/api/streaks`);
      return data;
    }
  },
  increment: async () => {
    if (USE_REAL_API) {
      return apiRequest('/streaks/increment', { method: 'POST' });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/streaks/increment`);
      try {
        const user = await authAPI.getCurrentUser();
        const { unlocked } = await checkAndAwardBadges({
          user,
          stats: { level: user?.level, created_at: user?.created_at, streak: data?.current_streak },
        });
        notifyUnlockedBadges(unlocked);
      } catch (_) {}
      return data;
    }
  },
  repair: async () => {
    if (USE_REAL_API) {
      return apiRequest('/streaks/repair', { method: 'POST' });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/streaks/repair`);
      return data;
    }
  },
};

export const badgesAPI = {
  award: async (userId, badgeId) => {
    if (USE_REAL_API) {
      return apiRequest('/badges/award', {
        method: 'POST',
        body: JSON.stringify({ userId, badgeId }),
      });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/badges/award`, { userId, badgeId });
      return data;
    }
  },
};

// Coins API
export const coinsAPI = {
  getBalance: async () => {
    if (USE_REAL_API) {
      return apiRequest('/coins/balance');
    } else {
      const { data } = await axios.get(`${API_BASE_URL}/api/coins/balance`);
      return data;
    }
  },
  award: async (amount, reason) => {
    if (USE_REAL_API) {
      return apiRequest('/coins/award', { method: 'POST', body: JSON.stringify({ amount, reason }) });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/coins/award`, { amount, reason });
      try {
        const user = await authAPI.getCurrentUser();
        const { unlocked } = await checkAndAwardBadges({
          user: { ...user, coins: data?.balance ?? user?.coins },
          stats: { level: user?.level, created_at: user?.created_at, coins: data?.balance },
        });
        notifyUnlockedBadges(unlocked);
      } catch (_) {}
      return data;
    }
  },
  spend: async (amount, reason) => {
    if (USE_REAL_API) {
      return apiRequest('/coins/spend', { method: 'POST', body: JSON.stringify({ amount, reason }) });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/coins/spend`, { amount, reason });
      return data;
    }
  },
  getTransactions: async () => {
    if (USE_REAL_API) {
      return apiRequest('/coins/transactions');
    } else {
      const { data } = await axios.get(`${API_BASE_URL}/api/coins/transactions`);
      return data;
    }
  },
};

// Gradebook API
export const gradebookAPI = {
  getGradebook: async (classId) => {
    if (USE_REAL_API) return apiRequest(`/gradebook/class/${classId}`);
    const { data } = await axios.get(`${API_BASE_URL}/api/gradebook/class/${classId}`);
    return data;
  },
  updateComment: async (submissionId, comment) => {
    if (USE_REAL_API) return apiRequest(`/submissions/${submissionId}/comment`, { method: 'PATCH', body: JSON.stringify({ comment }) });
    const { data } = await axios.patch(`${API_BASE_URL}/api/submissions/${submissionId}/comment`, { comment });
    return data;
  },
  updateScore: async (submissionId, score) => {
    if (USE_REAL_API) return apiRequest(`/submissions/${submissionId}/score`, { method: 'PATCH', body: JSON.stringify({ score }) });
    const { data } = await axios.patch(`${API_BASE_URL}/api/submissions/${submissionId}/score`, { score });
    return data;
  },
  getMyGrades: async () => {
    if (USE_REAL_API) return apiRequest('/submissions/my');
    const { data } = await axios.get(`${API_BASE_URL}/api/submissions/my`);
    return data;
  },
};

// Challenges API
export const challengesAPI = {
  createChallenge: async (payload) => {
    if (USE_REAL_API) {
      return apiRequest('/challenges', { method: 'POST', body: JSON.stringify(payload) });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/challenges`, payload);
      return data;
    }
  },
  getChallenges: async (classId) => {
    if (USE_REAL_API) {
      return apiRequest(`/challenges/class/${classId}`);
    } else {
      const { data } = await axios.get(`${API_BASE_URL}/api/challenges/class/${classId}`);
      return data;
    }
  },
  completeChallenge: async (challengeId) => {
    if (USE_REAL_API) {
      return apiRequest(`/challenges/${challengeId}/complete`, { method: 'POST' });
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/api/challenges/${challengeId}/complete`);
      return data;
    }
  },
};

// Utility function to check if using real API
export const isUsingRealAPI = () => USE_REAL_API;

// Export all APIs
const apiService = {
  auth: authAPI,
  tasks: tasksAPI,
  missions: missionsAPI,
  gamification: gamificationAPI,
  notes: notesAPI,
  notesStudio: notesStudioAPI,
  library: libraryAPI,
  competitions: competitionsAPI,
  shop: shopAPI,
  community: communityAPI,
  practice: practiceAPI,
  strengths: strengthsAPI,
  ai: aiAPI,
  profile: profileAPI,
  badges: badgesAPI,
  xp: xpAPI,
  coins: coinsAPI,
  streaks: streaksAPI,
  gradebook: gradebookAPI,
  challenges: challengesAPI,
  isUsingRealAPI
};

export default apiService;
