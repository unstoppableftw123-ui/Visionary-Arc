import { useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";
import { AuthContext, ThemeContext } from "../App";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import AIToolsPanel from "./ai-tools/AIToolsPanel";
import { FounderDot } from "./FounderBadge";
import { isFounder, getFounderMeta } from "../lib/founder";
import {
  LayoutDashboard,
  Home,
  Map,
  GraduationCap,
  Target,
  User,
  Settings,
  LogOut,
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  Coins,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Gift,
  Network,
  ClipboardList,
  BarChart2,
  BookOpen,
  Search,
  Star,
  Briefcase,
  ShoppingBag,
  FileText,
  Gamepad2,
  HardDrive,
  Archive,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Brain,
  School,
  Zap,
  MessageSquare,
  UserCheck,
  MoreHorizontal,
  Bell,
} from "lucide-react";
import { Notebook, Books, Users, Storefront, PencilLine } from "phosphor-react";
import PhosphorIcon from "./icons/PhosphorIcon";
import axios from "axios";
import { supabase } from "../services/supabaseClient";
import { getUnreadCount, getNotifications, markAllRead } from "../services/notificationService";
import { AnimatePresence, motion } from "framer-motion";

const DM_API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/messages/inbox`;

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";
const LEARN_ROUTES = ["/study", "/library", "/notes-studio", "/graph", "/practice", "/strengths"];
function isLearnRoute(pathname) {
  return LEARN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isSubActive(href, pathname, search) {
  if (href.includes("?")) {
    const [p, q] = href.split("?");
    return pathname === p && search.includes(q);
  }
  return pathname === href;
}

function isNavItemActive(item, pathname, search) {
  if (!item?.href) return false;
  if (item.href.includes("?")) {
    const [p, q] = item.href.split("?");
    return pathname === p && search.includes(q);
  }
  return pathname === item.href;
}

const STORAGE_DATA = {
  used: 1.4,
  total: 2,
  plan: "Free",
  addedThisMonth: 0.2,
  breakdown: [
    { label: "Notes",       gb: 0.6, Icon: FileText, color: "var(--track-tech)" },
    { label: "Whiteboards", gb: 0.4, Icon: Layers,   color: "var(--track-content)" },
    { label: "Files",       gb: 0.4, Icon: Archive,  color: "var(--track-impact)" },
  ],
};

function storageBarColor(pct) {
  if (pct >= 80) return "bg-red-500";
  if (pct >= 60) return "bg-brand-orange";
  return "bg-green-500";
}

/** Compact profile card at bottom of sidebar; click opens popover (Profile, Shop, Settings, theme, Log out). */
function ProfileCardWithPopover({
  user,
  founder,
  founderMeta,
  level,
  levelProgress,
  xpInLevel,
  xpForNextLevel,
  collapsed,
  theme,
  toggleTheme,
  onNavigate,
  onLogout,
  onCloseMobile,
  onOpenAITools,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleAction = (fn) => {
    fn?.();
    setOpen(false);
    onCloseMobile?.();
  };

  return (
    <div
      className={`shrink-0 border-t border-brand-border p-3 transition-opacity duration-200 ${
        collapsed ? "flex justify-center py-3" : ""
      }`}
    >
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[rgba(200,130,60,0.05)] ${
            collapsed ? "justify-center p-2" : ""
          }`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div className="relative shrink-0">
            {founder && founderMeta && (
              <div
                className={`absolute -inset-[2px] rounded-full bg-gradient-to-br ${founderMeta.gradient} opacity-75`}
                aria-hidden
              />
            )}
            <Avatar className={`relative ring-1 ring-brand-orange/50 ${collapsed ? "h-9 w-9" : "h-9 w-9"}`}>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {founder ? (
              <FounderDot user={user} className="absolute -bottom-0.5 -right-0.5" />
            ) : user?.is_premium ? (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--rank-s), var(--rank-a))" }}>
                <Crown className="h-2.5 w-2.5" style={{ color: "var(--bg-base)" }} />
              </div>
            ) : null}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{user?.name}</p>
                {user?.role === 'student' && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold leading-none" style={{ borderRadius: "var(--radius-full)", background: "rgba(59,130,246,0.12)", color: "var(--rank-c)" }}>Student</span>
                )}
                {user?.role === 'teacher' && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold leading-none" style={{ borderRadius: "var(--radius-full)", background: "rgba(34,197,94,0.12)", color: "var(--rank-d)" }}>Teacher</span>
                )}
                {user?.role === 'investor' && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold leading-none" style={{ borderRadius: "var(--radius-full)", background: "var(--accent-dim)", color: "var(--accent)" }}>Investor</span>
                )}
              </div>
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontSize: "9px" }}>
                <span>Lvl {level}</span>
                <span className="flex items-center gap-0.5 text-brand-orange">
                  <Coins className="h-3 w-3" /> {user?.coins ?? 0}
                </span>
              </div>
              <div className="xp-bar-track mt-1" style={{ height: 4 }}>
                <div className="xp-bar-fill" style={{ width: `${levelProgress}%`, background: 'linear-gradient(90deg, var(--brown), var(--accent))' }} />
              </div>
            </div>
          )}
        </button>

        {open && (
          <div
            ref={popoverRef}
            className={`absolute z-50 ${collapsed ? "left-full top-1/2 -translate-y-1/2 ml-2" : "bottom-full left-0 mb-1"}`}
            style={{
              animation: "profilePopoverIn 0.18s ease-out forwards",
              transformOrigin: collapsed ? "left center" : "left bottom",
            }}
          >
            <style>{`
              @keyframes profilePopoverIn {
                from { opacity: 0; transform: translateY(8px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <div className="w-56 rounded-xl border border-border bg-popover p-1 shadow-hover">
            <div className="px-2 py-2 border-b border-border mb-1">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-sm md:text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAction(() => onNavigate("/profile"))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
              data-testid="profile-menu-item"
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => handleAction(() => onNavigate("/shop"))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
              data-testid="store-menu-item"
            >
              <PhosphorIcon icon={Storefront} className="h-4 w-4 shrink-0" />
              Shop
            </button>
            <button
              type="button"
              onClick={() => handleAction(() => onNavigate("/referrals"))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
              data-testid="referrals-menu-item"
            >
              <Gift className="h-4 w-4 shrink-0" />
              Referrals
            </button>
            <button
              type="button"
              onClick={() => handleAction(() => onNavigate("/settings"))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
              data-testid="settings-menu-item"
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => handleAction(onOpenAITools)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
              data-testid="ai-tools-menu-item"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-left">AI Tools</span>
              <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-1.5 py-0.5">New</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction(toggleTheme)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[rgba(200,130,60,0.08)]"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => handleAction(onLogout)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
              data-testid="logout-menu-item"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout, isStudent, isTeacher, isInvestor } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) ?? "false");
    } catch {
      return false;
    }
  });
  const [learnOpen, setLearnOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("va_nav_learn") ?? "true"); } catch { return true; }
  });
  const [competeOpen, setCompeteOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("va_nav_compete") ?? "true"); } catch { return true; }
  });
  const [youOpen, setYouOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("va_nav_you") ?? "false"); } catch { return false; }
  });
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [dmUnread, setDmUnread] = useState(0);
  const [pendingFriends, setPendingFriends] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchDmUnread = () => {
      axios.get(DM_API).then(res => {
        const total = (res.data || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
        setDmUnread(total);
      }).catch(() => {});
    };
    fetchDmUnread();
    const poll = setInterval(fetchDmUnread, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPending = () => {
      supabase
        .from('friends')
        .select('id', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .then(({ count }) => setPendingFriends(count ?? 0))
        .catch(() => {});
    };
    fetchPending();
    const poll = setInterval(fetchPending, 60000);
    return () => clearInterval(poll);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifCount = () => {
      getUnreadCount(user.id).then(setNotifUnread).catch(() => {});
    };
    fetchNotifCount();
    const poll = setInterval(fetchNotifCount, 60000);
    return () => clearInterval(poll);
  }, [user?.id]);

  useEffect(() => {
    if (!notifOpen || !user?.id) return;
    getNotifications(user.id, 10).then(setNotifications).catch(() => {});
    markAllRead(user.id).then(() => setNotifUnread(0)).catch(() => {});
  }, [notifOpen, user?.id]);

  useEffect(() => {
    if (!notifOpen) return;
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const learnRoutes = ["/study", "/practice", "/notes-studio"];
    const competeRoutes = ["/challenges", "/rewards", "/friends"];
    const youRoutes = ["/shop", "/referrals", "/analytics"];
    if (learnRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + "/"))) setLearnOpen(true);
    if (competeRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + "/"))) setCompeteOpen(true);
    if (youRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + "/"))) setYouOpen(true);
  }, [location.pathname]);

  useEffect(() => { localStorage.setItem("va_nav_learn", JSON.stringify(learnOpen)); }, [learnOpen]);
  useEffect(() => { localStorage.setItem("va_nav_compete", JSON.stringify(competeOpen)); }, [competeOpen]);
  useEffect(() => { localStorage.setItem("va_nav_you", JSON.stringify(youOpen)); }, [youOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const founder = isFounder(user);
  const founderMeta = getFounderMeta(user);

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpForCurrentLevel = Array.from({ length: level - 1 }, (_, i) => 100 + i * 50).reduce(
    (a, b) => a + b,
    0
  );
  const xpForNextLevel = 100 + (level - 1) * 50;
  const xpInLevel = xp - xpForCurrentLevel;
  const levelProgress = Math.min(100, (xpInLevel / xpForNextLevel) * 100);

  const coreItems = [
    { icon: <Home className="w-4 h-4 shrink-0" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Map className="w-4 h-4 shrink-0" />, label: "Tracks", href: "/tracks" },
    { icon: <Briefcase className="w-4 h-4 shrink-0" />, label: "Portfolio", href: "/portfolio" },
  ];
  const learnItems = [
    { icon: <Brain className="w-4 h-4 shrink-0" />, label: "Study Hub", href: "/study" },
    // SAT/ACT Practice hidden from nav — community-gated at 1,000 members (direct URL /practice still works)
    // { icon: <Target className="w-4 h-4 shrink-0" />, label: "Practice", href: "/practice" },
    { icon: <FileText className="w-4 h-4 shrink-0" />, label: "Notes", href: "/notes-studio" },
  ];
  const competeItems = [
    { icon: <Trophy className="w-4 h-4 shrink-0" />, label: "Challenges", href: "/challenges" },
    { icon: <BarChart2 className="w-4 h-4 shrink-0" />, label: "Leaderboard", href: "/rewards" },
    { icon: <UserCheck className="w-4 h-4 shrink-0" />, label: "Friends", href: "/friends", badge: pendingFriends > 0 ? pendingFriends : null },
  ];
  const youItems = [
    // Shop, Referrals, and Analytics removed from nav — accessible via /profile
    // { icon: <ShoppingBag className="w-5 h-5 shrink-0" />, label: "Shop", href: "/shop" },
    // { icon: <PhosphorIcon icon={Users} className="w-5 h-5 shrink-0" />, label: "Referrals", href: "/referrals" },
    // { icon: <TrendingUp className="w-5 h-5 shrink-0" />, label: "Analytics", href: "/analytics" },
  ];
  const bottomItems = [
    { icon: <User className="w-4 h-4 shrink-0" />, label: "Profile", href: "/profile" },
    { icon: <Settings className="w-4 h-4 shrink-0" />, label: "Settings", href: "/settings" },
  ];
  const allNavItems = [...coreItems, ...learnItems, ...competeItems, ...youItems, ...bottomItems];

  const mobileBottomItems = [
    { icon: <Home className="h-4 w-4" />, label: "Home", href: "/dashboard" },
    { icon: <Map className="h-4 w-4" />, label: "Tracks", href: "/tracks" },
    { icon: <Brain className="h-4 w-4" />, label: "Study", href: "/study" },
    { icon: <User className="h-4 w-4" />, label: "Profile", href: "/profile" },
  ];
  const mobileMoreItems = allNavItems.filter(
    (item) => !mobileBottomItems.some((bottomItem) => bottomItem.href === item.href)
  );
  const moreActive = mobileMoreItems.some((item) =>
    isNavItemActive(item, location.pathname, location.search)
  );

  const navLinkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border-l-2 ${
      isActive
        ? "bg-[rgba(234,179,8,0.12)] border-[var(--accent)] text-brand-cream"
        : "border-transparent hover:bg-[rgba(200,130,60,0.05)] text-foreground"
    }`;

  const subLinkClass = (isActive) =>
    `flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-r-lg font-sans text-sm border-l-2 ml-3 transition-colors ${
      isActive
        ? "border-[var(--accent)] bg-[rgba(234,179,8,0.12)] text-brand-cream"
        : "border-brand-border hover:bg-[rgba(200,130,60,0.05)] text-muted-foreground hover:text-brand-cream"
    }`;

  const groupMotion = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.2, ease: "easeInOut" },
  };

  const renderNavItem = (item) => {
    const isActive = isNavItemActive(item, location.pathname, location.search);
    const link = (
      <Link
        to={item.href}
        onClick={() => setMobileOpen(false)}
        className={navLinkClass(isActive)}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {item.icon}
        {!collapsed && <span className="text-sm flex-1" style={{ fontFamily: "var(--font-heading)" }}>{item.label}</span>}
        {item.badge != null && !collapsed && (
          <span className="ml-auto flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-sm font-semibold text-primary-foreground md:text-[10px]">
            {item.badge}
          </span>
        )}
      </Link>
    );
    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="relative">
              {link}
              {item.badge != null && (
                <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-brand-card border-brand-border text-brand-cream">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.href}>{link}</div>;
  };

  const renderBottomNavItem = (item) => {
    const isActive = isNavItemActive(item, location.pathname, location.search);
    const link = (
      <Link
        to={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${isActive ? "bg-[rgba(232,114,42,0.12)] text-brand-orange" : "text-muted-foreground hover:bg-[rgba(200,130,60,0.05)] hover:text-foreground"}`}
        data-testid={`nav-${item.label.toLowerCase()}`}
        aria-label={item.label}
      >
        {item.icon}
      </Link>
    );
    return (
      <Tooltip key={item.href} delayDuration={300}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side={collapsed ? "right" : "top"}>{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const renderGroupLabel = (label, isOpen, onToggle) => {
    if (collapsed) return null;
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-1 group"
      >
        <span className="uppercase select-none" style={{ fontFamily: "var(--font-heading)", fontSize: "7px", letterSpacing: "3px", color: "var(--text-muted)" }}>{label}</span>
        <ChevronDown
          className={`h-3 w-3 opacity-40 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo + collapse */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-brand-border p-3">
        <Link
          to="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-orange shadow-[0_0_18px_rgba(232,114,42,0.35)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold truncate" style={{ fontFamily: "var(--font-display)", letterSpacing: "2px", color: "var(--accent)" }}>Visionary Arc</span>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifUnread > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-semibold text-destructive-foreground">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </Button>
            {notifOpen && (
              <div
                className="absolute z-50 top-full right-0 mt-1 w-72 rounded-xl border border-border bg-card shadow-hover overflow-hidden"
                style={{ animation: "profilePopoverIn 0.15s ease-out forwards" }}
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground md:text-xs">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 text-sm ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        <p className="leading-snug">{n.message}</p>
                        <p className="mt-1 text-sm text-muted-foreground md:text-[10px]">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">

        {/* CORE — always visible, no collapse */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 py-1 uppercase select-none" style={{ fontFamily: "var(--font-heading)", fontSize: "7px", letterSpacing: "3px", color: "var(--text-muted)" }}>Core</p>
          )}
          {coreItems.map(renderNavItem)}
        </div>

        <div className="border-t border-brand-border/40 my-2" />

        {/* LEARN — collapsible */}
        <div className="space-y-0.5">
          {renderGroupLabel("Learn", learnOpen, () => setLearnOpen((o) => !o))}
          {collapsed ? (
            learnItems.map(renderNavItem)
          ) : (
            <AnimatePresence initial={false}>
              {learnOpen && (
                <motion.div
                  key="learn-group"
                  initial={groupMotion.initial}
                  animate={groupMotion.animate}
                  exit={groupMotion.exit}
                  transition={groupMotion.transition}
                  style={{ overflow: "hidden" }}
                  className="space-y-0.5"
                >
                  {learnItems.map(renderNavItem)}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-brand-border/40 my-2" />

        {/* COMPETE — collapsible */}
        <div className="space-y-0.5">
          {renderGroupLabel("Compete", competeOpen, () => setCompeteOpen((o) => !o))}
          {collapsed ? (
            competeItems.map(renderNavItem)
          ) : (
            <AnimatePresence initial={false}>
              {competeOpen && (
                <motion.div
                  key="compete-group"
                  initial={groupMotion.initial}
                  animate={groupMotion.animate}
                  exit={groupMotion.exit}
                  transition={groupMotion.transition}
                  style={{ overflow: "hidden" }}
                  className="space-y-0.5"
                >
                  {competeItems.map(renderNavItem)}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {youItems.length > 0 && (
          <>
            <div className="border-t border-brand-border/40 my-2" />

            {/* YOU — collapsible, default collapsed */}
            <div className="space-y-0.5">
              {renderGroupLabel("You", youOpen, () => setYouOpen((o) => !o))}
              {collapsed ? (
                youItems.map(renderNavItem)
              ) : (
                <AnimatePresence initial={false}>
                  {youOpen && (
                    <motion.div
                      key="you-group"
                      initial={groupMotion.initial}
                      animate={groupMotion.animate}
                      exit={groupMotion.exit}
                      transition={groupMotion.transition}
                      style={{ overflow: "hidden" }}
                      className="space-y-0.5"
                    >
                      {youItems.map(renderNavItem)}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </>
        )}

        {/* Spacer pushes bottom items down */}
        <div className="flex-1" />

        {/* BOTTOM — icon-only, always visible */}
        <div className="border-t border-brand-border/40 mt-2 pt-2 flex gap-1 justify-center">
          {bottomItems.map(renderBottomNavItem)}
        </div>
      </nav>

      {/* Storage bar — students and teachers only */}
      {(isStudent || isTeacher) && (() => {
        const pct = Math.round((STORAGE_DATA.used / STORAGE_DATA.total) * 100);
        const barColor = storageBarColor(pct);
        const showUpgrade = pct >= 75;
        if (collapsed) {
          return (
            <div className="shrink-0 px-2 pb-2 flex justify-center">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setStorageOpen(true)}
                    className={`h-11 w-11 rounded-lg flex items-center justify-center transition-colors hover:bg-secondary ${
                      pct >= 80 ? "text-red-500" : pct >= 60 ? "text-brand-orange" : "text-muted-foreground"
                    }`}
                  >
                    <HardDrive className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{STORAGE_DATA.used} GB / {STORAGE_DATA.total} GB used</TooltipContent>
              </Tooltip>
            </div>
          );
        }
        return (
          <div className="shrink-0 px-3 pb-2">
            <button
              type="button"
              onClick={() => setStorageOpen(true)}
              className="w-full rounded-xl border border-brand-border bg-brand-card/40 hover:bg-brand-card/80 transition-colors p-3 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <HardDrive className={`h-3.5 w-3.5 ${pct >= 80 ? "text-red-500" : pct >= 60 ? "text-brand-orange" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium text-foreground md:text-[11px]">{STORAGE_DATA.used} GB / {STORAGE_DATA.total} GB</span>
                </div>
                <span className={`text-sm font-semibold ${pct >= 80 ? "text-red-500" : pct >= 60 ? "text-brand-orange" : "text-muted-foreground"} md:text-[10px]`}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center gap-2">
                {STORAGE_DATA.breakdown.map(({ label, gb, color }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              {showUpgrade && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand-orange md:text-[10px]">
                    <ArrowUpRight className="h-3 w-3" /> Upgrade Storage
                  </span>
                </div>
              )}
            </button>
          </div>
        );
      })()}

      {/* Profile card + popover — pinned bottom */}
      <ProfileCardWithPopover
        user={user}
        founder={founder}
        founderMeta={founderMeta}
        level={level}
        levelProgress={levelProgress}
        xpInLevel={xpInLevel}
        xpForNextLevel={xpForNextLevel}
        collapsed={collapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        onNavigate={navigate}
        onLogout={handleLogout}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenAITools={() => setAiToolsOpen(true)}
      />
    </>
  );

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-brand-border bg-brand-surface/95 p-4 backdrop-blur md:hidden">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange shadow-[0_0_18px_rgba(232,114,42,0.35)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="truncate font-display font-semibold" style={{ fontFamily: "var(--font-display)", letterSpacing: "2px", color: "var(--accent)" }}>Visionary Arc</span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen((o) => !o)}>
              <Bell className="h-5 w-5" />
              {notifUnread > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-semibold text-destructive-foreground">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </Button>
            {notifOpen && (
              <div className="absolute z-50 top-full right-0 mt-1 w-72 rounded-xl border border-border bg-card shadow-hover overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground md:text-xs">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        <p className="leading-snug">{n.message}</p>
                        <p className="mt-1 text-sm text-muted-foreground md:text-[10px]">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile More Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(85vw,320px)] p-0 md:hidden bg-brand-surface border-brand-border">
          <div className="flex h-full flex-col pt-16">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileBottomItems.map((item) => {
            const active = isNavItemActive(item, location.pathname, location.search);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex min-h-11 min-w-0 items-center justify-center rounded-xl px-2 py-2 transition-colors ${
                  active
                    ? "bg-[rgba(232,114,42,0.12)] text-brand-orange"
                    : "text-muted-foreground hover:bg-[rgba(200,130,60,0.05)] hover:text-foreground"
                }`}
                aria-label={item.label}
              >
                {item.icon}
              </Link>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMobileOpen(true)}
            className={`flex min-h-11 min-w-0 items-center justify-center rounded-xl px-2 py-2 ${
              moreActive
                ? "bg-[rgba(232,114,42,0.12)] text-brand-orange hover:bg-[rgba(232,114,42,0.12)]"
                : "text-muted-foreground hover:bg-[rgba(200,130,60,0.05)] hover:text-foreground"
            }`}
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className={`sidebar hidden md:flex h-screen sticky top-0 flex-col border-r border-brand-border transition-[width] duration-200 ease-out relative ${collapsed ? "w-16 collapsed" : "w-[220px]"}`}
        style={{ background: "var(--bg-base)" }}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SidebarContent />
        </div>
        {/* Collapse/expand toggle — fixed to right edge, vertically centered */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: "-12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" style={{ color: "var(--text-secondary)" }} />
          ) : (
            <ChevronLeft className="h-3 w-3" style={{ color: "var(--text-secondary)" }} />
          )}
        </button>
      </aside>

      <div className="h-16 md:hidden" aria-hidden />
      <div className="h-20 md:hidden" aria-hidden />

      {/* AI Tools Sheet */}
      {(isStudent || isTeacher) && (
        <Sheet open={aiToolsOpen} onOpenChange={setAiToolsOpen}>
          <SheetContent side="left" className="flex w-[min(90vw,580px)] flex-col gap-0 p-0 sm:max-w-[580px]">
            <SheetHeader className="border-b border-border px-4 pb-4 pt-6 shrink-0 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="font-heading text-lg">AI Toolkit</SheetTitle>
                  <SheetDescription className="mt-0.5 text-primary/60 font-medium text-sm md:text-xs">
                    {isTeacher ? "Generate, scaffold, and personalize." : "Study smarter. Learn faster. Earn XP."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <AIToolsPanel gridCols="grid-cols-1 sm:grid-cols-2" />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Storage detail sheet */}
      {(isStudent || isTeacher) && (
        <Sheet open={storageOpen} onOpenChange={setStorageOpen}>
          <SheetContent side="left" className="flex w-[min(100vw-2rem,20rem)] flex-col gap-0 p-0 sm:max-w-80">
            <SheetHeader className="border-b border-border px-4 pb-4 pt-6 sm:px-6">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <SheetTitle className="font-heading text-lg">Storage</SheetTitle>
              </div>
              <SheetDescription>
                {STORAGE_DATA.plan} plan · {STORAGE_DATA.total} GB total
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto space-y-6 px-4 py-5 sm:px-6">
              {/* Big usage meter */}
              {(() => {
                const pct = Math.round((STORAGE_DATA.used / STORAGE_DATA.total) * 100);
                const barColor = storageBarColor(pct);
                return (
                  <div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className="text-3xl font-bold">{STORAGE_DATA.used}</span>
                        <span className="text-muted-foreground ml-1 text-sm">/ {STORAGE_DATA.total} GB</span>
                      </div>
                      <span className={`text-sm font-semibold ${pct >= 80 ? "text-red-500" : pct >= 60 ? "text-brand-orange" : "text-green-500"}`}>
                        {pct}% used
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* Breakdown */}
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground md:text-xs">Breakdown</p>
                <div className="space-y-3">
                  {STORAGE_DATA.breakdown.map(({ label, gb, Icon, color }) => {
                    const itemPct = Math.round((gb / STORAGE_DATA.total) * 100);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
                              <Icon className="h-3.5 w-3.5" style={{ color }} />
                            </div>
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{gb} GB</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${itemPct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* This month */}
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Added this month</span>
                </div>
                <p className="text-2xl font-bold">{STORAGE_DATA.addedThisMonth} <span className="text-base font-normal text-muted-foreground">GB</span></p>
                <p className="mt-0.5 text-sm text-muted-foreground md:text-xs">At this rate, you'll fill your plan in ~2 months.</p>
              </div>
            </div>

            {/* Upgrade card pinned at bottom */}
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-3">
                <p className="text-sm font-semibold mb-0.5">You're running out of room.</p>
                <p className="text-sm text-muted-foreground md:text-xs">Upgrade to keep everything safe.</p>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground md:text-xs">
                  <div className="flex justify-between"><span>Lite plan</span><span className="font-medium text-foreground">10 GB</span></div>
                  <div className="flex justify-between"><span>Pro plan</span><span className="font-medium text-foreground">50 GB</span></div>
                </div>
              </div>
              <Link
                to="/pricing"
                onClick={() => setStorageOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 transition-colors"
              >
                Upgrade Storage <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}
