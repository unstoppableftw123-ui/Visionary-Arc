import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../App';
import { supabase } from '../services/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Users, Swords, Star, Lock, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { RANK_COLORS } from '../styles/ranks';

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

function rankLabel(rank) {
  return RANK_COLORS[rank]?.label ?? rank;
}

function meetsRequirements(guild, userRank, userStars) {
  const reqRankIdx = RANK_ORDER.indexOf(guild.entry_min_rank ?? 'E');
  const userRankIdx = RANK_ORDER.indexOf(userRank ?? 'E');
  if (userRankIdx < reqRankIdx) return false;
  if ((userStars ?? 0) < (guild.entry_min_stars ?? 0)) return false;
  return true;
}

function MissionCard({ mission, accent }) {
  const diffColor = RANK_COLORS[mission.difficulty]?.color ?? '#9CA3AF';
  return (
    <Card className="bg-[var(--va-surface)] border-[var(--va-border)] hover:border-[var(--va-orange)]/40 transition-colors">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm leading-tight">{mission.title}</span>
          <Badge
            style={{ borderColor: diffColor, color: diffColor }}
            className="shrink-0 border bg-transparent text-sm md:text-xs"
          >
            {mission.difficulty}
          </Badge>
        </div>
        <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">{mission.description}</p>
        <div className="flex items-center gap-3 pt-1 text-sm md:text-xs text-muted-foreground">
          <span style={{ color: accent }}>+{mission.xp_reward} XP</span>
          <span className="text-brand-orange">+{mission.coin_reward} coins</span>
          <Badge variant="outline" className="text-sm md:text-[10px] capitalize">{mission.track}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRow({ member, rank }) {
  const name = member.profiles?.name ?? 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const hue = (name.charCodeAt(0) * 19) % 360;
  const rankColor = RANK_COLORS[member.profiles?.rank ?? 'E']?.color ?? '#9CA3AF';

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-6 text-center text-sm text-muted-foreground font-mono">#{rank}</span>
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-primary)] text-sm font-semibold shrink-0"
        style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
      >
        {member.profiles?.avatar ? (
          <img src={member.profiles.avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-sm md:text-xs text-muted-foreground">{member.profiles?.school ?? ''}</p>
      </div>
      <span className="text-sm md:text-xs font-semibold" style={{ color: rankColor }}>
        {rankLabel(member.profiles?.rank ?? 'E')}
      </span>
      <span className="text-sm md:text-xs text-muted-foreground">{member.profiles?.xp ?? 0} XP</span>
    </div>
  );
}

export default function GuildHall() {
  const { slug } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [guild, setGuild] = useState(null);
  const [missions, setMissions] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missionsExpanded, setMissionsExpanded] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [userMembership, setUserMembership] = useState(null);

  const userRank = user?.rank ?? 'E';
  const userStars = user?.stars ?? 0;
  const accent = guild?.color_theme ?? 'var(--accent)';

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: g, error } = await supabase
          .from('guilds')
          .select('*')
          .eq('slug', slug)
          .single();
        if (error || !g) { setLoading(false); return; }
        setGuild(g);

        // Missions
        const { data: m } = await supabase
          .from('guild_missions')
          .select('*')
          .eq('guild_id', g.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(10);
        setMissions(m ?? []);

        // Members (top 5 by XP for leaderboard)
        const { data: allMembers, count } = await supabase
          .from('guild_members')
          .select('user_id, status, profiles(name, avatar, xp, rank, school)', { count: 'exact' })
          .eq('guild_id', g.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: true });

        setMemberCount(count ?? 0);
        const sorted = (allMembers ?? []).sort(
          (a, b) => (b.profiles?.xp ?? 0) - (a.profiles?.xp ?? 0)
        );
        setMembers(sorted.slice(0, 5));

        // Check user membership
        if (user) {
          const { data: mem } = await supabase
            .from('guild_members')
            .select('status')
            .eq('guild_id', g.id)
            .eq('user_id', user.id)
            .maybeSingle();
          setUserMembership(mem);
        }
      } catch (e) {
        console.error('GuildHall load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, user]);

  const handleApply = async () => {
    if (!user) { navigate('/auth'); return; }
    setApplying(true);
    try {
      const { error } = await supabase
        .from('guild_members')
        .upsert(
          { guild_id: guild.id, user_id: user.id, status: 'pending' },
          { onConflict: 'guild_id,user_id', ignoreDuplicates: true }
        );
      if (error) throw error;
      setUserMembership({ status: 'pending' });
      setApplyModalOpen(false);
      toast.success('Application submitted! The company will review it soon.');
    } catch (e) {
      toast.error(e.message ?? 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const canApply = guild && user && meetsRequirements(guild, userRank, userStars);
  const membershipStatus = userMembership?.status;

  const visibleMissions = missionsExpanded ? missions : missions.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">Guild not found</p>
          <p className="text-muted-foreground">This guild may have been removed or the link is invalid.</p>
          <Button variant="outline" onClick={() => navigate('/')}>Go home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Banner with CSS parallax ── */}
      <div
        className="relative h-56 sm:h-72 overflow-hidden"
        style={{
          backgroundImage: guild.banner_url ? `url(${guild.banner_url})` : undefined,
          backgroundColor: guild.banner_url ? undefined : `${accent}22`,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${accent}33 0%, rgba(0,0,0,0.7) 100%)`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0"
                style={{ backgroundColor: accent, boxShadow: `0 0 20px ${accent}55` }}
              >
                🏰
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight drop-shadow">
                  {guild.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className="text-sm md:text-xs"
                    style={{ backgroundColor: `${accent}33`, color: accent, borderColor: `${accent}66` }}
                  >
                    {guild.tier === 'elite' ? 'Elite Guild' : 'Company Guild'}
                  </Badge>
                  <span className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm md:text-xs flex items-center gap-1">
                    <Users className="h-3 w-3" /> {memberCount} members
                  </span>
                  <span className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm md:text-xs flex items-center gap-1">
                    <Swords className="h-3 w-3" /> {missions.length} active missions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Description + Apply */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <p className="text-muted-foreground max-w-xl">{guild.description}</p>

          {membershipStatus === 'active' ? (
            <Badge style={{ borderColor: accent, color: accent }} className="border bg-transparent px-4 py-2">
              Member
            </Badge>
          ) : membershipStatus === 'pending' ? (
            <Badge variant="secondary" className="px-4 py-2">Application Pending</Badge>
          ) : (
            <div className="relative">
              {!canApply && user && (
                <p className="text-sm md:text-xs text-muted-foreground mb-1 text-right">
                  Requires {rankLabel(guild.entry_min_rank ?? 'E')} rank
                  {guild.entry_min_stars > 0 ? ` & ${guild.entry_min_stars}★ avg` : ''}
                </p>
              )}
              <Button
                onClick={() => canApply ? setApplyModalOpen(true) : null}
                disabled={!canApply}
                style={canApply ? { backgroundColor: accent, color: '#000' } : {}}
                className="font-semibold"
                title={!canApply && user ? 'Your rank is too low to apply' : undefined}
              >
                {!user ? 'Sign in to Apply' : canApply ? 'Apply to Join' : (
                  <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> Rank Too Low</span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Requirements card */}
        {(guild.entry_min_rank || guild.entry_min_stars || guild.entry_track) && (
          <Card className="bg-[var(--va-surface)] border-[var(--va-border)]">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-2" style={{ color: accent }}>Entry Requirements</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {guild.entry_min_rank && guild.entry_min_rank !== 'E' && (
                  <span className="flex items-center gap-1">
                    Min rank: <span style={{ color: RANK_COLORS[guild.entry_min_rank]?.color }}>{rankLabel(guild.entry_min_rank)}</span>
                  </span>
                )}
                {guild.entry_min_stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-brand-orange" /> {guild.entry_min_stars}★ avg rating
                  </span>
                )}
                {guild.entry_track && (
                  <span>Track: <span className="capitalize">{guild.entry_track}</span></span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Missions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Swords className="h-5 w-5" style={{ color: accent }} />
              Active Missions
            </h2>
            {missions.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMissionsExpanded(v => !v)}
                className="text-muted-foreground text-sm md:text-xs"
              >
                {missionsExpanded ? (
                  <><ChevronUp className="h-4 w-4 mr-1" />Show less</>
                ) : (
                  <><ChevronDown className="h-4 w-4 mr-1" />See all ({missions.length})</>
                )}
              </Button>
            )}
          </div>
          {missions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active missions yet.</p>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {visibleMissions.map(m => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MissionCard mission={m} accent={accent} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Top Members Leaderboard */}
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5" style={{ color: accent }} />
            Top Members
          </h2>
          <Card className="bg-[var(--va-surface)] border-[var(--va-border)]">
            <CardContent className="p-4 divide-y divide-white/5">
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">No members yet.</p>
              ) : (
                members.map((m, i) => (
                  <MemberRow key={m.user_id} member={m} rank={i + 1} />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ── Apply Modal ── */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to {guild.name}</DialogTitle>
            <DialogDescription>
              Your application will be reviewed by the company. Make sure you meet the requirements below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground py-2">
            <p>Min rank: <span style={{ color: RANK_COLORS[guild.entry_min_rank ?? 'E']?.color }}>{rankLabel(guild.entry_min_rank ?? 'E')}</span></p>
            {guild.entry_min_stars > 0 && <p>Min avg rating: {guild.entry_min_stars}★</p>}
            {guild.entry_track && <p>Track: <span className="capitalize">{guild.entry_track}</span></p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              style={{ backgroundColor: accent, color: '#000' }}
            >
              {applying ? 'Submitting…' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
