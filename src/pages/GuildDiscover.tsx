// @ts-nocheck
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { supabase } from '../services/supabaseClient';
import { notifyGuildApplication } from '../services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Users, Swords, Star, Sparkles } from 'lucide-react';

const TRACKS = ['All', 'tech', 'design', 'content', 'business', 'impact'];
const RANKS = ['All', 'E', 'D', 'C', 'B', 'A', 'S'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_members', label: 'Most Members' },
  { value: 'most_missions', label: 'Most Missions' },
];

interface Guild {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  entry_track: string | null;
  entry_min_rank: string;
  is_featured: boolean;
  member_count: number;
  active_missions_count: number;
  created_at: string;
  company_id: string;
  company?: { name: string; avatar: string | null };
}

interface Filters {
  track: string;
  minRank: string;
  sort: string;
}

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

function meetsRankReq(userRank: string, requiredRank: string): boolean {
  return RANK_ORDER.indexOf(userRank) >= RANK_ORDER.indexOf(requiredRank);
}

function GuildCard({
  guild,
  userRank,
  onApply,
  applying,
}: {
  guild: Guild;
  userRank: string;
  onApply: (guild: Guild) => void;
  applying: boolean;
}) {
  const eligible = meetsRankReq(userRank, guild.entry_min_rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`relative border transition-colors ${
          guild.is_featured
            ? 'border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] bg-gradient-to-b from-[color:color-mix(in_srgb,var(--accent)_5%,transparent)] to-card shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_8%,transparent)]'
            : 'border-border bg-card hover:border-primary/30'
        }`}
      >
        {guild.is_featured && (
          <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {guild.is_featured && <Star className="h-4 w-4 text-[var(--accent)] shrink-0" />}
                <CardTitle className="text-base truncate">{guild.name}</CardTitle>
              </div>
              {guild.entry_track && (
                <p className="text-sm md:text-xs text-muted-foreground capitalize mt-0.5">{guild.entry_track} track</p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 text-sm md:text-xs">
              Rank {guild.entry_min_rank}+
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {guild.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{guild.description}</p>
          )}

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{guild.member_count} members</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Swords className="h-3.5 w-3.5" />
              <span>{guild.active_missions_count} active missions</span>
            </div>
          </div>

          {!eligible && (
            <p className="text-sm md:text-xs text-brand-orange/80">
              Requires rank {guild.entry_min_rank} — keep earning XP to qualify.
            </p>
          )}

          <Button
            size="sm"
            variant={eligible ? 'default' : 'secondary'}
            className="w-full"
            disabled={!eligible || applying}
            onClick={() => onApply(guild)}
          >
            {applying ? 'Applying…' : eligible ? 'Apply' : 'Rank too low'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GuildDiscover() {
  const { user, isStudent } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ track: 'All', minRank: 'All', sort: 'newest' });
  const [applying, setApplying] = useState<string | null>(null);
  const [userRank, setUserRank] = useState('E');

  useEffect(() => {
    if (!isStudent) return;
    fetchUserRank();
    fetchGuilds();
  }, [isStudent]);

  async function fetchUserRank() {
    if (!user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('rank')
      .eq('id', user.id)
      .single();
    if (data?.rank) setUserRank(data.rank);
  }

  async function fetchGuilds() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guilds')
        .select(`
          id, name, slug, description, entry_track, entry_min_rank,
          is_featured, member_count, active_missions_count, created_at, company_id
        `)
        .eq('type', 'company')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuilds((data as Guild[]) ?? []);
    } catch {
      toast.error('Failed to load guilds');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(guild: Guild) {
    if (!user?.id) return;
    setApplying(guild.id);
    try {
      const { error } = await supabase
        .from('guild_members')
        .insert({ guild_id: guild.id, user_id: user.id, status: 'pending' });

      if (error) {
        if (error.code === '23505') {
          toast.info('You already applied to this guild.');
        } else {
          throw error;
        }
        return;
      }

      // Notify company
      try {
        await notifyGuildApplication(guild.company_id, user.name ?? user.email ?? 'A student');
      } catch (_) {}

      toast.success(`Applied to ${guild.name}!`);
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setApplying(null);
    }
  }

  const filtered = guilds
    .filter((g) => {
      if (filters.track !== 'All' && g.entry_track !== filters.track) return false;
      if (filters.minRank !== 'All' && !meetsRankReq(g.entry_min_rank, filters.minRank)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'most_members') return b.member_count - a.member_count;
      if (filters.sort === 'most_missions') return b.active_missions_count - a.active_missions_count;
      // newest — featured first, then by date
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const featured = filtered.filter((g) => g.is_featured);
  const regular = filtered.filter((g) => !g.is_featured);

  if (!isStudent) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        This page is only accessible to students.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Discover Guilds</h1>
        <p className="text-muted-foreground mt-1">Find and join company guilds to access exclusive missions and rewards.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.track} onValueChange={(v) => setFilters((f) => ({ ...f, track: v }))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            {TRACKS.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.minRank} onValueChange={(v) => setFilters((f) => ({ ...f, minRank: v }))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Entry rank" />
          </SelectTrigger>
          <SelectContent>
            {RANKS.map((r) => (
              <SelectItem key={r} value={r}>{r === 'All' ? 'Any rank' : `Rank ${r}+`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <Sparkles className="h-8 w-8 opacity-30" />
          <p>No guilds match your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-brand-orange uppercase tracking-wide flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Featured Guilds
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((guild) => (
                  <GuildCard
                    key={guild.id}
                    guild={guild}
                    userRank={userRank}
                    onApply={handleApply}
                    applying={applying === guild.id}
                  />
                ))}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div className="space-y-3">
              {featured.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Guilds</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regular.map((guild) => (
                  <GuildCard
                    key={guild.id}
                    guild={guild}
                    userRank={userRank}
                    onApply={handleApply}
                    applying={applying === guild.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
