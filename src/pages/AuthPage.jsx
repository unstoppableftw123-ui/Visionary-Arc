import { useState, useContext } from "react";
import { useNavigate, Link, Navigate, useLocation } from "react-router-dom";
import { trackReferral } from "../services/referralService";
import { isUsingRealAPI } from "../services/apiService";
import { supabase } from "../services/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AuthContext, ThemeContext, API } from "../App";
import { getProfile } from "../services/db";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Moon, Sun, LockKeyhole, ShieldCheck, GraduationCap, BookOpen, Briefcase, Info, X } from "lucide-react";
import { loginSchema, registerSchema, formatZodErrors } from "../lib/validation";
import axios from "axios";

const ROLE_OPTIONS = [
  {
    value: 'student',
    icon: GraduationCap,
    label: 'Student',
    description: "I'm here to study, track progress, and get discovered",
  },
  {
    value: 'teacher',
    icon: BookOpen,
    label: 'Teacher',
    description: 'I create assignments and monitor my students',
  },
  {
    value: 'investor',
    icon: Briefcase,
    label: 'Investor',
    description: "I'm looking for talented students to support",
  },
];

export default function AuthPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [showInvestorPopup, setShowInvestorPopup] = useState(false);
  const [showRolePopup, setShowRolePopup] = useState(null); // 'student' | 'teacher' | null
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});

  // Account-locked unlock flow
  const [lockedEmail, setLockedEmail] = useState("");
  const [unlockStep, setUnlockStep] = useState(null); // null | "request" | "verify"
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const { login, register, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // In real API mode, redirect already-logged-in users away from auth.
  // In mock mode, keep the page accessible so the role flow can be tested.
  if (user && isUsingRealAPI()) return <Navigate to="/dashboard" replace />;

  const getRoleRoute = (role) => {
    if (role === 'company') return '/company';
    return '/dashboard';
  };

  const resolvePostAuthRoute = async (nextUser) => {
    if (!isUsingRealAPI() || !nextUser?.id) {
      return getRoleRoute(nextUser?.role);
    }

    try {
      const { data: profile } = await getProfile(nextUser.id);
      if (!profile?.onboarded) return "/onboarding";
    } catch (_) {
      return "/onboarding";
    }

    return getRoleRoute(nextUser?.role);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErrors({});
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      setLoginErrors(formatZodErrors(result.error));
      return;
    }
    setLoading(true);
    try {
      const response = await login(loginEmail, loginPassword);
      toast.success("Welcome back!");
      navigate(await resolvePostAuthRoute(response.user));
    } catch (error) {
      // apiService throws errors with .response = { status, data }
      const status = error.status ?? error.response?.status;
      const detail = error.response?.data?.detail;
      if (status === 423) {
        // Account locked — show the unlock flow
        const msg = typeof detail === "object" ? detail?.message : detail;
        setLockMessage(msg || "Your account is temporarily locked.");
        setLockedEmail(loginEmail);
        setUnlockStep("request");
      } else {
        const msg = typeof detail === "object" ? detail?.message || JSON.stringify(detail) : (detail || error.message);
        toast.error(msg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterErrors({});
    const result = registerSchema.safeParse({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    });
    if (!result.success) {
      setRegisterErrors(formatZodErrors(result.error));
      return;
    }
    setLoading(true);
    try {
      const response = await register(registerEmail, registerPassword, registerName, selectedRole);
      const newUser = response.user;
      const refCode = (new URLSearchParams(location.search).get("ref") ?? "")
        .trim()
        .slice(0, 8)
        .toUpperCase();
      if (refCode && newUser?.id) {
        await trackReferral(refCode, newUser.id).catch(() => {});
      }
      toast.success("Account created successfully!");
      navigate(await resolvePostAuthRoute(newUser ?? { role: selectedRole }));
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === "object" ? detail?.message || JSON.stringify(detail) : (detail || error.message);
      toast.error(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUnlock = async () => {
    setUnlockLoading(true);
    try {
      const res = await axios.post(`${API}/auth/unlock/request`, { email: lockedEmail });
      // In dev environments the backend may return _dev_code
      if (res.data._dev_code) {
        toast.info(`Dev mode — your unlock code is: ${res.data._dev_code}`, { duration: 30000 });
      } else {
        toast.success("Unlock code sent! Check your email.");
      }
      setUnlockStep("verify");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send unlock code. Try again.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleVerifyUnlock = async () => {
    if (!unlockCode.trim()) {
      toast.error("Please enter the 6-digit code from your email.");
      return;
    }
    setUnlockLoading(true);
    try {
      await axios.post(`${API}/auth/unlock/verify`, { email: lockedEmail, code: unlockCode });
      toast.success("Account unlocked! You can now log in.");
      setUnlockStep(null);
      setUnlockCode("");
      setLockMessage("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    if (error) toast.error(error.message || 'Google sign-in failed');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to home</span>
          </Link>
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-2xl">TaskFlow</span>
          </div>
          <h1 className="font-heading text-4xl font-semibold mb-4">
            Start your productivity journey
          </h1>
          <p className="text-muted-foreground text-lg">
            Track tasks, build streaks, study with AI, connect with communities, and organize gift exchanges.
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2025 TaskFlow. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex flex-col p-6 lg:p-12">
        <div className="flex justify-between items-center mb-8 lg:mb-0">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold">TaskFlow</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-soft">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-2xl">Welcome</CardTitle>
                <CardDescription>Sign in or create an account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6">
                    <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                          data-testid="login-email"
                          className={loginErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {loginErrors.email && (
                          <p className="text-sm md:text-xs text-destructive">{loginErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                          data-testid="login-password"
                          className={loginErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {loginErrors.password && (
                          <p className="text-sm md:text-xs text-destructive">{loginErrors.password}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Your name"
                          value={registerName}
                          onChange={(e) => { setRegisterName(e.target.value); setRegisterErrors((p) => ({ ...p, name: undefined })); }}
                          data-testid="register-name"
                          className={registerErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {registerErrors.name && (
                          <p className="text-sm md:text-xs text-destructive">{registerErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>I am a…</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {ROLE_OPTIONS.map(({ value, icon: Icon, label, description }) => {
                            if (value === 'investor') {
                              return (
                                <div
                                  key={value}
                                  className="relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center border-border text-muted-foreground opacity-70 cursor-not-allowed select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowInvestorPopup(true); }}
                                    className="absolute top-1 right-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title="Learn more"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                  <Icon className="h-5 w-5 shrink-0" />
                                  <span className="text-sm md:text-xs font-semibold leading-tight">{label}</span>
                                  <span className="text-[9px] font-medium text-brand-orange leading-tight">Coming Soon</span>
                                </div>
                              );
                            }
                            return (
                              <div key={value} className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setShowRolePopup(value); }}
                                  className="absolute top-1 right-1 z-10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  title="Learn more"
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRole(value)}
                                  className={`w-full flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                                    selectedRole === value
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border hover:bg-secondary text-foreground'
                                  }`}
                                >
                                  <Icon className="h-5 w-5 shrink-0" />
                                  <span className="text-sm md:text-xs font-semibold leading-tight">{label}</span>
                                  <span className="text-sm md:text-[10px] text-muted-foreground leading-tight">{description}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="you@example.com"
                          value={registerEmail}
                          onChange={(e) => { setRegisterEmail(e.target.value); setRegisterErrors((p) => ({ ...p, email: undefined })); }}
                          data-testid="register-email"
                          className={registerErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {registerErrors.email && (
                          <p className="text-sm md:text-xs text-destructive">{registerErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => { setRegisterPassword(e.target.value); setRegisterErrors((p) => ({ ...p, password: undefined })); }}
                          data-testid="register-password"
                          className={registerErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {registerErrors.password && (
                          <p className="text-sm md:text-xs text-destructive">{registerErrors.password}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit">
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm md:text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleAuth}
                  data-testid="google-auth-btn"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── Student / Teacher Info Popup ───────────────────────────────── */}
      <AnimatePresence>
        {showRolePopup && (
          <motion.div
            key="role-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--va-bg)]/80 backdrop-blur-sm p-4"
            onClick={() => setShowRolePopup(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-primary/30 shadow-xl">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" />
                    <div className="flex justify-center mb-3 flex-1">
                      {showRolePopup === 'student'
                        ? <GraduationCap className="w-10 h-10 text-primary" />
                        : <BookOpen className="w-10 h-10 text-primary" />}
                    </div>
                    <div className="flex-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRolePopup(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="font-heading text-xl">
                    {showRolePopup === 'student' ? 'Student / Learner' : 'Teacher / Tutor'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-5">
                  {showRolePopup === 'student' ? (
                    <>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        No more forgetting. No more falling behind. Just you, your goals, and an AI that actually has your back.
                      </p>
                      <p className="text-sm text-foreground text-center leading-relaxed mt-3 font-medium">
                        Your personal command center for school, life, and everything in between.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        Less grading. Less guessing. More teaching.
                      </p>
                      <p className="text-sm text-foreground text-center leading-relaxed mt-3 font-medium">
                        Build smarter assignments, understand every student deeply, and let AI handle the busywork — so you can do what you actually came here to do.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Investor Coming Soon Popup ─────────────────────────────────── */}
      <AnimatePresence>
        {showInvestorPopup && (
          <motion.div
            key="investor-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--va-bg)]/80 backdrop-blur-sm p-4"
            onClick={() => setShowInvestorPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-brand-orange/40 shadow-xl">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" />
                    <div className="flex justify-center mb-3 flex-1">
                      <Briefcase className="w-10 h-10 text-brand-orange" />
                    </div>
                    <div className="flex-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowInvestorPopup(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="font-heading text-xl">Investor Hub</CardTitle>
                  <span className="inline-block text-sm md:text-[11px] font-semibold text-brand-orange bg-brand-orange/10 rounded-full px-2.5 py-0.5 mt-1">Coming Soon</span>
                </CardHeader>
                <CardContent className="pt-2 pb-5">
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    Forget résumés. Real investors find real talent here — before anyone else does.
                  </p>
                  <p className="text-sm text-foreground text-center leading-relaxed mt-3 font-medium">
                    The Investor Hub is coming soon. Be the first to back the next generation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Account Locked Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {unlockStep && (
          <motion.div
            key="unlock-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--va-bg)]/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm"
            >
              <Card className="border-destructive/40 shadow-xl">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3">
                    {unlockStep === "verify"
                      ? <ShieldCheck className="w-10 h-10 text-primary" />
                      : <LockKeyhole className="w-10 h-10 text-destructive" />}
                  </div>
                  <CardTitle className="font-heading text-xl">
                    {unlockStep === "verify" ? "Enter Unlock Code" : "Account Locked"}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {unlockStep === "verify"
                      ? `A 6-digit code was sent to ${lockedEmail}. Enter it below.`
                      : lockMessage}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  {unlockStep === "request" && (
                    <>
                      <p className="text-sm text-muted-foreground text-center">
                        We'll send a one-time unlock code to <strong>{lockedEmail}</strong>.
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleRequestUnlock}
                        disabled={unlockLoading}
                      >
                        {unlockLoading ? "Sending…" : "Send Unlock Code"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setUnlockStep(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {unlockStep === "verify" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="unlock-code">6-digit code</Label>
                        <Input
                          id="unlock-code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={unlockCode}
                          onChange={(e) => setUnlockCode(e.target.value.replace(/\D/g, ""))}
                          className="text-center text-2xl tracking-[0.4em] font-mono"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleVerifyUnlock}
                        disabled={unlockLoading || unlockCode.length !== 6}
                      >
                        {unlockLoading ? "Verifying…" : "Unlock Account"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground text-sm"
                        onClick={handleRequestUnlock}
                        disabled={unlockLoading}
                      >
                        Resend code
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setUnlockStep(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
