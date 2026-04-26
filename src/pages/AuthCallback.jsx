import { useEffect, useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { supabase } from "../services/supabaseClient";
import { getProfile } from "../services/db";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { GraduationCap, BookOpen, Briefcase } from "lucide-react";

const ROLE_OPTIONS = [
  { value: 'student', icon: GraduationCap, label: 'Student', description: "I'm here to study, track progress, and get discovered" },
  { value: 'teacher', icon: BookOpen, label: 'Teacher', description: 'I create assignments and monitor my students' },
  { value: 'investor', icon: Briefcase, label: 'Investor', description: "I'm looking for talented students to support" },
];

const getRoleRoute = (role) => {
  if (role === 'company') return '/company';
  return '/dashboard';
};

const resolvePostAuthRoute = async (user) => {
  if (!user?.id) return getRoleRoute(user?.role);

  try {
    const { data: profile } = await getProfile(user.id);
    if (!profile?.onboarded) return "/onboarding";
  } catch (_) {
    return "/onboarding";
  }

  return getRoleRoute(user?.role);
};

export default function AuthCallback() {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const processed = useRef(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [pendingSession, setPendingSession] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processed.current) return;
      processed.current = true;

      // Exchange the URL code for a session (PKCE flow used by Supabase)
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error || !data?.session) {
        toast.error(error?.message || 'Authentication failed');
        navigate('/auth', { replace: true });
        return;
      }

      const session = data.session;
      const authUser = session.user;

      // Check if user row already exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        // Known user — restore context and navigate
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('auth_user', JSON.stringify(existingUser));
        setUser(existingUser);
        toast.success('Welcome back!');
        navigate(await resolvePostAuthRoute(existingUser), { replace: true });
      } else {
        // New user — need role selection before creating the row
        setPendingSession(session);
        setShowRoleModal(true);
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  const handleRoleConfirm = async () => {
    if (!pendingSession) return;
    setSaving(true);

    const authUser = pendingSession.user;
    const newUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      role: selectedRole,
      avatar: authUser.user_metadata?.avatar_url || '',
      school: '',
      grade: null,
      xp: 0,
      level: 1,
      coins: 100,
      streak: 0,
      max_streak: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      is_premium: false,
      founder_tier: null,
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (insertError) {
      toast.error(insertError.message || 'Failed to create account');
      setSaving(false);
      return;
    }

    const userRow = insertedUser || newUser;
    localStorage.setItem('auth_token', pendingSession.access_token);
    localStorage.setItem('auth_user', JSON.stringify(userRow));
    setUser(userRow);
    toast.success('Account created! Welcome to Visionary Academy.');
    navigate(await resolvePostAuthRoute(userRow), { replace: true });
  };

  if (showRoleModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-soft">
              <CardHeader className="text-center">
                <CardTitle className="font-heading text-2xl">One last step</CardTitle>
                <CardDescription>How will you use Visionary Academy?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(({ value, icon: Icon, label, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRole(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                        selectedRole === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm md:text-xs font-semibold leading-tight">{label}</span>
                      <span className="text-sm md:text-[10px] text-muted-foreground leading-tight">{description}</span>
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={handleRoleConfirm} disabled={saving}>
                  {saving ? 'Setting up your account…' : 'Continue'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
