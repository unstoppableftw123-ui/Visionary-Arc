import { useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../App';
import apiService from '../services/apiService';

/**
 * Custom hook for API operations
 * Provides easy access to all API endpoints with automatic authentication
 * Return value is memoized to prevent infinite re-renders in consumers that depend on it.
 */
export const useApi = () => {
  const { user, token } = useContext(AuthContext);

  const isAuthenticated = useCallback(() => !!user && !!token, [user, token]);

  const withAuth = useCallback(
    (apiCall) => {
      if (!isAuthenticated()) {
        throw new Error('Authentication required');
      }
      return apiCall();
    },
    [isAuthenticated]
  );

  return useMemo(
    () => ({
      auth: {
        login: apiService.auth.login,
        register: apiService.auth.register,
        getCurrentUser: apiService.auth.getCurrentUser,
        logout: apiService.auth.logout,
        processOAuthCode: apiService.auth.processOAuthCode
      },

      tasks: {
        getTasks: () => withAuth(() => apiService.tasks.getTasks()),
        createTask: (taskData) => withAuth(() => apiService.tasks.createTask(taskData)),
        updateTask: (taskId, updates) => withAuth(() => apiService.tasks.updateTask(taskId, updates)),
        deleteTask: (taskId) => withAuth(() => apiService.tasks.deleteTask(taskId)),
        updateTaskProgress: (taskId, progress) =>
          withAuth(() => apiService.tasks.updateTaskProgress(taskId, progress))
      },

      notes: {
        getNotes: () => withAuth(() => apiService.notes.getNotes()),
        createNote: (noteData) => withAuth(() => apiService.notes.createNote(noteData)),
        updateNote: (noteId, updates) => withAuth(() => apiService.notes.updateNote(noteId, updates)),
        deleteNote: (noteId) => withAuth(() => apiService.notes.deleteNote(noteId)),
        getFolders: () => withAuth(() => apiService.notes.getFolders())
      },

      library: {
        getItems: () => withAuth(() => apiService.library.getItems()),
        getItemsByType: (itemType) => withAuth(() => apiService.library.getItemsByType(itemType)),
        createItem: (itemData) => withAuth(() => apiService.library.createItem(itemData))
      },

      competitions: {
        getCompetitions: () => withAuth(() => apiService.competitions.getCompetitions()),
        joinCompetition: (competitionId) =>
          withAuth(() => apiService.competitions.joinCompetition(competitionId)),
        submitEntry: (competitionId, submissionData) =>
          withAuth(() => apiService.competitions.submitEntry(competitionId, submissionData)),
        getHistory: () => withAuth(() => apiService.competitions.getHistory())
      },

      shop: {
        getItems: () => withAuth(() => apiService.shop.getItems()),
        purchaseItem: (itemId) => withAuth(() => apiService.shop.purchaseItem(itemId)),
        getPurchaseHistory: () => withAuth(() => apiService.shop.getPurchaseHistory())
      },

      community: {
        getServers: () => withAuth(() => apiService.community.getServers()),
        getChannels: (serverId) => withAuth(() => apiService.community.getChannels(serverId)),
        getMessages: (channelId) => withAuth(() => apiService.community.getMessages(channelId)),
        sendMessage: (channelId, content) =>
          withAuth(() => apiService.community.sendMessage(channelId, content)),
        joinServer: (serverId) => withAuth(() => apiService.community.joinServer(serverId))
      },

      practice: {
        getStats: () => withAuth(() => apiService.practice.getStats()),
        startSession: (sessionData) =>
          withAuth(() => apiService.practice.startSession(sessionData)),
        submitAnswer: (sessionId, answerData) =>
          withAuth(() => apiService.practice.submitAnswer(sessionId, answerData)),
        getQuestions: (testType, section, difficulty) =>
          withAuth(() =>
            apiService.practice.getQuestions(testType, section, difficulty)
          )
      },

      strengths: {
        getProfile: () => withAuth(() => apiService.strengths.getProfile()),
        saveOnboarding: (onboardingData) =>
          withAuth(() => apiService.strengths.saveOnboarding(onboardingData)),
        updateStrengths: (strengthsData) =>
          withAuth(() => apiService.strengths.updateStrengths(strengthsData))
      },

      ai: {
        generateQuiz: (content, numQuestions) =>
          withAuth(() => apiService.ai.generateQuiz(content, numQuestions)),
        generateFlashcards: (content, numCards) =>
          withAuth(() => apiService.ai.generateFlashcards(content, numCards)),
        summarizeText: (content, style) =>
          withAuth(() => apiService.ai.summarizeText(content, style)),
        getJobStatus: (jobId) => withAuth(() => apiService.ai.getJobStatus(jobId))
      },

      profile: {
        getProfile: (userId) => withAuth(() => apiService.profile.getProfile(userId)),
        updateProfile: (updates) => withAuth(() => apiService.profile.updateProfile(updates)),
        uploadAvatar: (file) => withAuth(() => apiService.profile.uploadAvatar(file))
      },

      isAuthenticated,
      isUsingRealAPI: apiService.isUsingRealAPI,
      currentUser: user,
      token
    }),
    [withAuth, isAuthenticated, user, token]
  );
};

export default useApi;
