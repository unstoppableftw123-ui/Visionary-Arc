import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AuthContext, API } from "../App";
import FounderBadge from "../components/FounderBadge";
import TierBadge from "../components/ui/TierBadge";
import { getTierForXP } from "../services/xpService";
import { toast } from "sonner";
import { profileSchema, formatZodErrors } from "../lib/validation";
import { getTemplateList } from "../templates/noteTemplates";
import { BADGES, getEarnedBadgeMap, hasBadge } from "../data/rewardsProgram";
import { getBadgeColorClasses } from "../lib/badges";
import {
  Camera,
  Edit,
  LayoutTemplate,
  Crown,
  Star,
  Coins,
  Store,
  Trophy,
  Flame,
  Target,
  Clock,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Switch } from "../components/ui/switch";
import dataService from "../services/dataService";
import TransactionLog from "../components/TransactionLog";
import { getPortfolio } from "../services/db";

// Map task template category to note template preview (for thumbnail fallback)
const CATEGORY_PREVIEW_MAP = {
  math: "cornell",
  sat_prep: "comparison",
  english: "blank",
  science: "flowchart",
  history: "timeline",
  default: "blank"
};

function getTemplatePreviewUrl(category) {
  const list = getTemplateList();
  const id = CATEGORY_PREVIEW_MAP[category?.toLowerCase()] || CATEGORY_PREVIEW_MAP.default;
  const t = list.find((x) => x.id === id);
  return t?.preview || "/templates/previews/blank.svg";
}

// Subject/folder → color for shared notes cards (aligned with Library styling)
const SUBJECT_COLORS = {
  math: { border: "border-l-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  sat_prep: { border: "border-l-brand-orange", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 dark:bg-amber-900/40 text-brand-deep dark:text-brand-tan" },
  english: { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  science: { border: "border-l-green-500", bg: "bg-green-50 dark:bg-green-950/30", badge: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  history: { border: "border-l-orange-500", bg: "bg-orange-600/10 dark:bg-orange-600/10", badge: "bg-orange-600/10 dark:bg-orange-600/10 text-orange-400 dark:text-orange-400" },
  default: { border: "border-l-primary", bg: "bg-muted/50", badge: "bg-secondary text-secondary-foreground" }
};

function getSubjectStyle(folder) {
  return SUBJECT_COLORS[folder?.toLowerCase()] || SUBJECT_COLORS.default;
}

function formatEarnedDate(earnedAt) {
  if (!earnedAt) return null;

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(earnedAt));
  } catch (_) {
    return null;
  }
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileErrors, setProfileErrors] = useState({});
  const [behavioralProfile, setBehavioralProfile] = useState(null);
  const [scorePublic, setScorePublic] = useState(true);
  const [portfolioEntries, setPortfolioEntries] = useState([]);

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const isOwnProfile = !userId || userId === currentUser?.user_id;

  const fetchProfile = useCallback(async () => {
    try {
      if (isOwnProfile) {
        const response = await axios.get(`${API}/auth/me`, { headers, withCredentials: true });
        setProfile(response.data);
        setName(response.data.name || "");
        setBio(response.data.bio || "");
      } else {
        const response = await axios.get(`${API}/profile/${userId}`, { headers, withCredentials: true });
        setProfile(response.data);
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [headers, isOwnProfile, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const effectiveUserId = userId || currentUser?.user_id;
  useEffect(() => {
    if (!effectiveUserId) return;
    dataService.getBehavioralProfile(effectiveUserId).then(setBehavioralProfile).catch(() => setBehavioralProfile(null));
    try {
      const stored = localStorage.getItem(`profile_score_public_${effectiveUserId}`);
      setScorePublic(stored !== null ? stored === "true" : isOwnProfile);
    } catch {
      setScorePublic(isOwnProfile);
    }
    getPortfolio(effectiveUserId).then(({ data }) => {
      if (data) setPortfolioEntries(data.slice(0, 3));
    }).catch(() => {});
  }, [effectiveUserId, isOwnProfile]);

  const setScorePublicAndPersist = (value) => {
    setScorePublic(value);
    if (effectiveUserId) {
      try {
        localStorage.setItem(`profile_score_public_${effectiveUserId}`, String(value));
      } catch (_) {}
    }
  };

  const handleUpdateProfile = async () => {
    setProfileErrors({});
    const result = profileSchema.safeParse({ name, bio });
    if (!result.success) {
      setProfileErrors(formatZodErrors(result.error));
      return;
    }
    try {
      const response = await axios.put(
        `${API}/profile`,
        { name, bio },
        { headers, withCredentials: true }
      );
      setProfile(response.data);
      setUser(response.data);
      setEditOpen(false);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(`${API}/profile/avatar`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      setProfile({ ...profile, avatar: response.data.avatar });
      setUser({ ...currentUser, avatar: response.data.avatar });
      toast.success("Avatar updated!");
    } catch (error) {
      toast.error("Failed to upload avatar");
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(`${API}/profile/banner`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      setProfile({ ...profile, banner: response.data.banner });
      setUser({ ...currentUser, banner: response.data.banner });
      toast.success("Banner updated!");
    } catch (error) {
      toast.error("Failed to upload banner");
    }
  };

  const handleUseTemplate = (template) => {
    navigate("/notes-studio", { state: { useTemplate: template } });
  };

  if (loading) {
    return (
      <div data-testid="profile-page" className="max-w-4xl mx-auto px-4 md:px-8 pb-12">
        <div className="animate-pulse space-y-6">
          <div className="h-48 md:h-64 bg-white/5 rounded-b-2xl" />
          <div className="h-36 bg-white/5 rounded-xl -mt-16 relative z-10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="h-10 bg-white/5 rounded-full w-64" />
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-xl break-inside-avoid mb-4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const templates = profile?.templates ?? [];
  const sharedNotes = profile?.shared_notes ?? [];
  const consistencyScore = profile?.consistency_score ?? 0;
  const totalStudyHours = profile?.total_study_hours ?? 0;
  const streak = profile?.max_streak ?? profile?.streak ?? 0;
  const earnedBadgeMap = getEarnedBadgeMap(profile);

  return (
    <div data-testid="profile-page">
      {/* Hero: Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10 rounded-b-2xl overflow-hidden">
        {profile?.banner && (
          <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-colors">
              <Camera className="w-4 h-4" />
              <span className="text-sm">Change Banner</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
              data-testid="banner-upload"
            />
          </label>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-16 relative z-10 pb-12">
        {/* Profile card: avatar, name, bio, edit */}
        <Card className="border-border shadow-lg overflow-hidden">
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative -mt-12 shrink-0">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-md">
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl md:text-4xl">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      data-testid="avatar-upload"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 pt-4 md:pt-8 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">
                        {profile?.name}
                      </h1>
                      <TierBadge label={getTierForXP(profile?.xp ?? 0)} />
                      {profile?.founder_tier ? (
                        <FounderBadge user={profile} size="md" showLabel />
                      ) : profile?.is_premium ? (
                        <Badge className="bg-gradient-to-r from-brand-orange to-orange-500 text-[var(--text-primary)]">
                          <Crown className="w-3 h-3 mr-1" /> Premium
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm">{profile?.email}</p>
                    {profile?.bio && (
                      <p className="mt-2 text-foreground/90 leading-relaxed">{profile.bio}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isOwnProfile && (
                      <Link to="/store">
                        <Button variant="outline" size="icon">
                          <Store className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    {isOwnProfile && (
                      <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid="edit-profile-btn">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  setProfileErrors((p) => ({ ...p, name: undefined }));
                                }}
                                data-testid="profile-name-input"
                                className={profileErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                              />
                              {profileErrors.name && (
                                <p className="text-sm md:text-xs text-destructive">{profileErrors.name}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Bio</Label>
                              <Textarea
                                value={bio}
                                onChange={(e) => {
                                  setBio(e.target.value);
                                  setProfileErrors((p) => ({ ...p, bio: undefined }));
                                }}
                                placeholder="Tell us about yourself..."
                                data-testid="profile-bio-input"
                                className={profileErrors.bio ? "border-destructive focus-visible:ring-destructive" : ""}
                              />
                              {profileErrors.bio && (
                                <p className="text-sm md:text-xs text-destructive">{profileErrors.bio}</p>
                              )}
                            </div>
                            <Button onClick={handleUpdateProfile} className="w-full" data-testid="save-profile-btn">
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {/* XP & Level (compact) */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium">Level {profile?.level ?? 1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{profile?.xp ?? 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins className="w-4 h-4 text-brand-orange" />
                    <span className="text-sm font-medium">{profile?.coins ?? 0} coins</span>
                  </div>
                </div>

                {/* View Portfolio button */}
                <div className="mt-4">
                  <Link to="/portfolio">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Briefcase className="w-4 h-4" /> View Portfolio
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral stats strip (visible to all viewers) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{consistencyScore}%</p>
              <p className="text-sm md:text-xs text-muted-foreground">Consistency</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalStudyHours}h</p>
              <p className="text-sm md:text-xs text-muted-foreground">Study hours</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{streak}</p>
              <p className="text-sm md:text-xs text-muted-foreground">Day streak</p>
            </div>
          </motion.div>
        </div>

        {/* Portfolio preview */}
        {portfolioEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="mt-6"
          >
            <Card className="border-border overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Portfolio</h2>
                    <p className="text-sm text-muted-foreground">Recent completed projects</p>
                  </div>
                  <Link to="/portfolio">
                    <Button variant="ghost" size="sm" className="gap-1 text-sm md:text-xs">
                      View all <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {portfolioEntries.map((entry, i) => (
                    <motion.div
                      key={entry.id ?? i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <div className="rounded-xl border border-border bg-muted/30 p-3 h-full">
                        <p className="text-sm md:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {entry.role}
                        </p>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                          {entry.title}
                        </h3>
                        {entry.submission_url && (
                          <a
                            href={entry.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm md:text-xs text-primary hover:opacity-80 transition-opacity"
                          >
                            View project <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {profile?.role === "student" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-6"
          >
            <Card className="border-border overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Badges</h2>
                    <p className="text-sm text-muted-foreground">
                      Track every milestone badge on your profile.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm md:text-xs">
                    {Array.isArray(profile?.badges) ? profile.badges.filter((badgeId) => BADGES.some((badge) => badge.id === badgeId)).length : 0}/{BADGES.length} unlocked
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {BADGES.map((badge, index) => {
                    const unlocked = hasBadge(profile, badge.id);
                    const earnedAt = earnedBadgeMap[badge.id];

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * index }}
                      >
                        <Card
                          className={`h-full border transition-colors ${unlocked ? "border-border bg-card" : "border-border/70 bg-muted/30"}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="relative shrink-0">
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl ${getBadgeColorClasses(badge.color, unlocked)}`}
                                >
                                  <span className={unlocked ? "" : "grayscale opacity-60"}>{badge.icon}</span>
                                </div>
                                {!unlocked && (
                                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
                                    <Lock className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className={`font-medium ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                      {badge.name}
                                    </h3>
                                    <p className={`mt-1 text-sm leading-relaxed ${unlocked ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                                      {badge.description}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className={unlocked ? "" : "opacity-70"}>
                                    {unlocked ? "Unlocked" : "Locked"}
                                  </Badge>
                                </div>

                                <p className="mt-3 text-sm md:text-xs text-muted-foreground">
                                  {unlocked && earnedAt ? `Earned ${formatEarnedDate(earnedAt)}` : "Not earned yet"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* My Profile Score card (radar chart + privacy) */}
        {behavioralProfile != null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className="border-border overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">My Profile Score</h2>
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center gap-2">
                      {scorePublic ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Label htmlFor="score-privacy" className="text-sm text-muted-foreground whitespace-nowrap">
                        {scorePublic ? "Visible to others" : "Private"}
                      </Label>
                      <Switch
                        id="score-privacy"
                        checked={scorePublic}
                        onCheckedChange={setScorePublicAndPersist}
                        data-testid="profile-score-privacy-toggle"
                      />
                    </div>
                  )}
                </div>
                {!isOwnProfile && !scorePublic ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-muted/50 border border-dashed border-border">
                    <EyeOff className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Profile score is private</p>
                    <p className="text-sm md:text-xs text-muted-foreground mt-1">This user has hidden their behavioral scores.</p>
                  </div>
                ) : (
                  <>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          data={[
                            { subject: "Consistency", value: behavioralProfile.consistencyScore, fullMark: 100 },
                            { subject: "Resilience", value: behavioralProfile.resilienceScore, fullMark: 100 },
                            { subject: "Follow-Through", value: behavioralProfile.followThroughRate, fullMark: 100 },
                            { subject: "Contribution", value: behavioralProfile.contributionScore, fullMark: 100 },
                            { subject: "Growth", value: behavioralProfile.growthVelocity, fullMark: 100 }
                          ]}
                          margin={{ top: 16, right: 24, left: 24, bottom: 16 }}
                        >
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="Score"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                        Consistency {behavioralProfile.consistencyScore}%
                      </Badge>
                      <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                        Resilience {behavioralProfile.resilienceScore}%
                      </Badge>
                      <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                        Follow-through {behavioralProfile.followThroughRate}%
                      </Badge>
                      <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                        Contribution {behavioralProfile.rawContributions} shared
                      </Badge>
                      <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                        Growth {behavioralProfile.growthPct >= 0 ? "+" : ""}{behavioralProfile.growthPct}%
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs: My Templates | Shared Notes | Coin History */}
        <div className="mt-10">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="w-4 h-4" /> My Templates
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="w-4 h-4" /> Shared Notes
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="coins" className="gap-2">
                  <Coins className="w-4 h-4" /> Coin History
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="templates" className="mt-6">
              {templates.length > 0 ? (
                <div
                  className="columns-2 md:columns-3 gap-4 space-y-4"
                  style={{ columnFill: "balance" }}
                >
                  {templates.map((template, index) => (
                    <motion.div
                      key={template.task_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="break-inside-avoid mb-4"
                    >
                      <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-[4/3] relative bg-muted/50 overflow-hidden">
                          <img
                            src={getTemplatePreviewUrl(template.category)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const fallback = e.target.nextElementSibling;
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                          <div className="absolute inset-0 hidden flex items-center justify-center bg-muted">
                            <LayoutTemplate className="w-12 h-12 text-muted-foreground" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2">{template.title}</h3>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {template.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-sm md:text-xs">
                              {template.category}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                              className="gap-1"
                              data-testid={`use-template-${template.task_id}`}
                            >
                              Use Template <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <LayoutTemplate className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No templates yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Create a task and check &quot;Save as template&quot; to share it here with others.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              {sharedNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedNotes.map((note, index) => {
                    const style = getSubjectStyle(note.folder);
                    return (
                      <motion.div
                        key={note.note_id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`border-border overflow-hidden border-l-4 ${style.border} hover:shadow-md transition-shadow`}
                        >
                          <div className={`p-4 ${style.bg} min-h-[80px] flex flex-col justify-center`}>
                            <FileText className="w-8 h-8 text-muted-foreground/70 mb-2" />
                            <h3 className="font-semibold line-clamp-2">{note.title}</h3>
                            {note.content_preview && (
                              <p className="text-sm md:text-xs text-muted-foreground mt-1 line-clamp-2">
                                {note.content_preview}
                              </p>
                            )}
                          </div>
                          <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2">
                            <Badge className={`text-sm md:text-xs ${style.badge}`}>
                              {note.folder || "Note"}
                            </Badge>
                            <Link to="/library">
                              <Button variant="ghost" size="sm" className="gap-1">
                                View <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-border border-dashed">
                  <CardContent className="py-16 text-center">
                    <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No shared notes yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Notes you make public will appear here for others to discover.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="coins" className="mt-6">
                <TransactionLog />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
