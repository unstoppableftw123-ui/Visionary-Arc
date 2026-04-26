import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./styles/animations.css";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import axios from "axios";
import apiService, { isUsingRealAPI } from "./services/apiService";
import { supabase } from "./services/supabaseClient";
import { getMockUserSync } from "./services/dataService";
import { getDefaultThemeId, getTheme, applyTheme as doApplyTheme, themes as themeList } from "./lib/themes";
import { getDefaultFontId, getFont, applyFont as doApplyFont } from "./lib/fonts";
import { awardActivityXP, checkAndUpdateStreak, updateFriendStreaks } from "./services/xpService";
import { autoJoinAdventurersGuild } from "./services/guildService";
import { getProfile } from "./services/db";
import XPToast, { showXPToast } from "./components/XPToast";

if (!isUsingRealAPI()) {
  require("./services/mockAdapter");
}

const LandingPage = lazy(() => import("./pages/LandingPage"));
const StudentAIToolsPage = lazy(() => import("./pages/student/AIToolsPage"));
const MyGrades = lazy(() => import("./pages/MyGrades"));
const DMInbox = lazy(() => import("./pages/DMInbox"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const StudyHub = lazy(() => import("./pages/StudyHub"));
const Library = lazy(() => import("./pages/Library"));
const Shop = lazy(() => import("./pages/Shop"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Competitions = lazy(() => import("./pages/Competitions"));
const SATACTPractice = lazy(() => import("./pages/SATACTPractice"));
const PracticePage = lazy(() => import("./pages/PracticePage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const ChallengesPage = lazy(() => import("./pages/ChallengesPage"));
const NotesStudio = lazy(() => import("./pages/NotesStudio"));
const NotesGraph = lazy(() => import("./pages/NotesGraph"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Success = lazy(() => import("./pages/Success"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const LevelUpOverlay = lazy(() => import("./components/LevelUpOverlay"));
const TrackHubPage = lazy(() => import("./pages/tracks/TrackHubPage"));
const TrackDetailPage = lazy(() => import("./pages/tracks/TrackDetailPage"));
const BriefGeneratorPage = lazy(() => import("./pages/tracks/BriefGeneratorPage"));
const ProjectPage = lazy(() => import("./pages/projects/ProjectPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const MissionBoard = lazy(() => import("./pages/MissionBoard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
// const VisionaryChatbox = lazy(() => import("./components/VisionaryChatbox")); // replaced by FloatingAIChat in Layout.jsx
const Layout = lazy(() => import("./components/Layout"));
const GuildHall = lazy(() => import("./pages/GuildHall"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const GuildDiscover = lazy(() => import("./pages/GuildDiscover"));

// ── Global axios interceptor: catch 429 rate-limit responses and show a toast ──
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 429) {
      const retryAfter = error.response.data?.retry_after ?? 60;
      toast.warning("Whoa, slow down! ⏳", {
        description: `You're doing that too fast. Try again in ${retryAfter} second${retryAfter !== 1 ? "s" : ""}.`,
        duration: 5000,
      });
    }
    return Promise.reject(error);
  }
);

// Context
export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);

// API configuration (kept for compatibility, but using apiService)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

// Theme + Font provider (uses lib/themes.js and lib/fonts.js)
function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(null);
  const [activeFont, setActiveFont] = useState(null);

  useEffect(() => {
    const themeId = getDefaultThemeId();
    setActiveTheme(themeId);
    doApplyTheme(themeId);
  }, []);

  useEffect(() => {
    const fontId = getDefaultFontId();
    setActiveFont(fontId);
    doApplyFont(fontId);
  }, []);

  const setTheme = (themeId) => {
    if (!getTheme(themeId)) return;
    setActiveTheme(themeId);
    doApplyTheme(themeId);
  };

  const setFont = (fontId) => {
    if (!getFont(fontId)) return;
    setActiveFont(fontId);
    doApplyFont(fontId);
  };

  const toggleMode = () => {
    const current = getTheme(activeTheme);
    const next = current?.mode === "dark"
      ? themeList.find((t) => t.mode === "light") ?? themeList[0]
      : themeList.find((t) => t.mode === "dark") ?? themeList[1];
    if (next) setTheme(next.id);
  };

  // Legacy: theme = "light" | "dark" for backwards compatibility (e.g. Sidebar)
  const theme = activeTheme ? (getTheme(activeTheme)?.mode ?? "dark") : "dark";
  const toggleTheme = toggleMode;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        toggleMode,
        activeTheme: activeTheme ?? "dark",
        activeFont: activeFont ?? "inter",
        setFont,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Auth Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    isUsingRealAPI() ? null : getMockUserSync()
  );
  const [loading, setLoading] = useState(() => isUsingRealAPI());
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const handleDailyLogin = async (loadedUser) => {
    if (!loadedUser || !isUsingRealAPI()) return;
    try {
      const xpResult = await awardActivityXP(loadedUser.id, 'login', null);
      const streakResult = await checkAndUpdateStreak(loadedUser.id);
      updateFriendStreaks(loadedUser.id).catch(() => {});
      if (streakResult.milestone) {
        const milestoneXP = streakResult.milestone === '30_day' ? 1000 : 200;
        const milestoneCoins = streakResult.milestone === '30_day' ? 200 : 50;
        showXPToast({ xp: milestoneXP, coins: milestoneCoins, levelUp: false, tier: '' });
        toast.success(
          streakResult.milestone === '30_day'
            ? '🔥 30-day streak! +1000 XP +200 coins'
            : '🔥 7-day streak! +200 XP +50 coins',
          { duration: 5000 }
        );
      } else if (xpResult.awarded) {
        showXPToast({
          xp: xpResult.xpGained,
          coins: xpResult.coinsGained,
          levelUp: xpResult.levelUp,
          tier: xpResult.newTier,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isUsingRealAPI()) {
      const checkAuth = async () => {
        const justAuth = sessionStorage.getItem("just_authenticated");
        if (!justAuth) {
          await new Promise(r => setTimeout(r, 150));
        } else {
          sessionStorage.removeItem("just_authenticated");
        }
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            const userData = profile || session.user;
            setUser(userData);
            localStorage.setItem('auth_user', JSON.stringify(userData));
            localStorage.setItem('auth_token', session.access_token);
            handleDailyLogin(userData);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (e) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        } finally {
          setLoading(false);
        }
      };
      checkAuth();
    } else {
      // Mock mode: sync with localStorage in case it was updated
      apiService.auth.getCurrentUser().then(u => {
        setUser(u);
      }).catch(() => {});
    }
  }, [token]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    const userData = profile || data.user;
    setUser(userData);
    setToken(data.session.access_token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', data.session.access_token);
    return { user: userData, token: data.session.access_token };
  };

  const register = async (email, password, name, role = 'student') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const newUser = {
      id: data.user.id,
      email,
      name,
      role,
      avatar: '',
      school: '',
      grade: 0,
      xp: 0,
      level: 1,
      coins: 50,
      streak: 0,
      max_streak: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      is_premium: false,
      founder_tier: 'seed',
    };
    await supabase.from('users').insert(newUser);
    await autoJoinAdventurersGuild(data.user.id);
    return login(email, password);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const processOAuthCode = async (code) => {
    const response = await apiService.auth.processOAuthCode(code);
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("token", response.token);
    return response;
  };

  const refreshCoins = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('users').select('coins').eq('id', user.id).single();
    if (error || !data) return;
    setUser(prev => ({ ...prev, coins: data.coins }));
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        localStorage.setItem('auth_user', JSON.stringify({ ...parsed, coins: data.coins }));
      } catch (_) {}
    }
  };

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isInvestor = user?.role === 'investor';
  const isCompany = user?.role === 'company';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, setUser, loading, token, login, register, logout, processOAuthCode, isStudent, isTeacher, isInvestor, isCompany, isAdmin, refreshCoins }}>
      {children}
    </AuthContext.Provider>
  );
}

// Mock mode indicator (demo data, no backend)
function MockModeBanner() {
  if (isUsingRealAPI()) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-40 py-1.5 px-4 text-center text-xs bg-amber-500/90 text-amber-950 font-medium">
      Using demo data – no backend
    </div>
  );
}

// Protected Route
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let active = true;

    const checkProfile = async () => {
      if (!user) {
        if (active) {
          setCheckingProfile(false);
          setNeedsOnboarding(false);
        }
        return;
      }

      if (!isUsingRealAPI()) {
        if (active) {
          setCheckingProfile(false);
          setNeedsOnboarding(false);
        }
        return;
      }

      setCheckingProfile(true);
      try {
        const { data: profile } = await getProfile(user.id);
        if (!active) return;
        setNeedsOnboarding(!profile?.onboarded);
      } catch (_) {
        if (active) setNeedsOnboarding(true);
      } finally {
        if (active) setCheckingProfile(false);
      }
    };

    checkProfile();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || (user && checkingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Streak at-risk notification — fires after 8 PM if user hasn't studied today
function StreakAtRiskEffect() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id || !isUsingRealAPI()) return;

    let shownToday = false;

    const check = async () => {
      if (shownToday) return;
      const hour = new Date().getHours();
      if (hour < 20) return; // before 8 PM

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('streaks')
        .select('current_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (!data || (data.last_activity_date ?? '') >= today) return;
      const streak = data.current_streak ?? 0;
      if (streak === 0) return;

      shownToday = true;
      toast.warning(`🔥 Your ${streak}-day streak ends at midnight!`, {
        description: 'Study something quick to keep it going.',
        duration: Infinity,
        action: {
          label: 'Quick Study →',
          onClick: () => navigate('/study'),
        },
      });
    };

    check();
    const interval = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, navigate]);

  return null;
}

// App Router
function AppRouter() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Handle OAuth callback synchronously
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <StreakAtRiskEffect />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/tasks" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<TasksPage />} />
      </Route>
      <Route path="/tracks" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<TrackHubPage />} />
        <Route path=":trackId" element={<TrackDetailPage />} />
        <Route path=":trackId/brief" element={<BriefGeneratorPage />} />
      </Route>
      <Route path="/projects/:projectId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProjectPage />} />
      </Route>
      <Route path="/portfolio" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<PortfolioPage />} />
      </Route>
      <Route path="/portfolio/:userId" element={<Layout />}>
        <Route index element={<PortfolioPage />} />
      </Route>
      <Route path="/study" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<StudyHub />} />
      </Route>
      <Route path="/library" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Library />} />
      </Route>
      <Route path="/shop" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Shop />} />
      </Route>
      <Route path="/competitions" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Competitions />} />
      </Route>
      <Route path="/challenges" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ChallengesPage />} />
      </Route>
      <Route path="/referrals" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ReferralPage />} />
      </Route>
      <Route path="/practice" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<SATACTPractice />} />
      </Route>
      <Route path="/practice-hub" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<PracticePage />} />
      </Route>
      <Route path="/notes-studio" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<NotesStudio />} />
      </Route>
      <Route path="/graph" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<NotesGraph />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Profile />} />
        <Route path=":userId" element={<Profile />} />
      </Route>
      <Route path="/settings" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Settings />} />
      </Route>
      <Route path="/student" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="ai-tools" element={<StudentAIToolsPage />} />
      </Route>
      <Route path="/rewards" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<LeaderboardPage />} />
      </Route>
      <Route path="/grades" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MyGrades />} />
      </Route>
      <Route path="/messages" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DMInbox />} />
        <Route path=":userId" element={<DMInbox />} />
      </Route>
      <Route path="/friends" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<FriendsPage />} />
      </Route>
      <Route path="/missions" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MissionBoard />} />
      </Route>
      <Route path="/analytics" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Analytics />} />
      </Route>
      <Route path="/guild/:slug" element={<GuildHall />} />
      <Route path="/company" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DiscoverPage />} />
      </Route>
      <Route path="/guilds" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<GuildDiscover />} />
      </Route>
      <Route path="/u/:id" element={<PublicProfile />} />
      <Route path="/u/:username/portfolio" element={<Portfolio />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/success" element={<Success />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <AuthProvider>
            <MockModeBanner />
            <AppRouter />
            <LevelUpOverlay />
            <XPToast />
            {/* <VisionaryChatbox /> */}{/* replaced by FloatingAIChat in Layout.jsx */}
            <Toaster position="top-right" />
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
