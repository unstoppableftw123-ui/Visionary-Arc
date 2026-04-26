// @ts-nocheck
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { supabase } from '../services/supabaseClient';
import { notifyScoutView } from '../services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Search, Star, Eye, User, Briefcase } from 'lucide-react';

const TRACKS = ['All', 'tech', 'design', 'content', 'business', 'impact'];
const RANK_COLORS: Record<string, string> = {
  S: 'bg-gradient-to-r from-brand-orange to-orange-500 text-black',
  A: 'bg-orange-600 text-[var(--text-primary)]',
  B: 'bg-blue-600 text-[var(--text-primary)]',
  C: 'bg-green-600 text-[var(--text-primary)]',
  D: 'bg-[var(--va-surface)] text-[var(--va-text)] border border-[var(--va-border)]',
  E: 'bg-[var(--va-border)] text-[var(--va-text-muted)]',
};

interface StudentProfile {
  id: string;
  name: string;
  avatar: string | null;
  rank: string;
  xp: number;
  track_primary: string | null;
  avg_star_rating: number;
  missions_completed: number;
  portfolio_entries: Array<{ title: string; track: string; submission_url: string }>;
}

interface Filters {
  track: string;
  minStars: string;
}

function StatRadarMini({ xp, missions }: { xp: number; missions: number }) {
  const maxXP = 15000;
  const maxMissions = 50;
  const xpPct = Math.min(100, Math.round((xp / maxXP) * 100));
  const missionPct = Math.min(100, Math.round((missions / maxMissions) * 100));
  return (
    <div className="flex gap-3 text-sm md:text-xs text-muted-foreground">
      <div className="flex-1">
        <div className="mb-0.5 flex justify-between">
          <span>XP</span>
          <span>{xp.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--va-border)]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      <div className="flex-1">
        <div className="mb-0.5 flex justify-between">
          <span>Missions</span>
          <span>{missions}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--va-border)]">
          <div className="h-full rounded-full bg-brand-orange" style={{ width: `${missionPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function StudentCard({
  student,
  companyGuildName,
  onView,
}: {
  student: StudentProfile;
  companyGuildName: string;
  onView: (student: StudentProfile) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-border bg-card hover:border-primary/40 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{student.name}</p>
                {student.track_primary && (
                  <p className="text-sm md:text-xs text-muted-foreground capitalize">{student.track_primary} track</p>
                )}
              </div>
            </div>
            <Badge className={`shrink-0 font-bold text-sm px-2.5 ${RANK_COLORS[student.rank] ?? RANK_COLORS.E}`}>
              {student.rank}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRadarMini xp={student.xp} missions={student.missions_completed} />

          <div className="flex items-center gap-1.5 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={n <= Math.round(student.avg_star_rating) ? 'text-[var(--accent)]' : 'text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]'}
              >
                ★
              </span>
            ))}
            <span className="ml-1 text-sm md:text-xs text-muted-foreground">
              {student.avg_star_rating > 0 ? student.avg_star_rating.toFixed(1) : 'No reviews'}
            </span>
          </div>

          {student.portfolio_entries.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio</p>
              {student.portfolio_entries.slice(0, 3).map((entry, i) => (
                <a
                  key={i}
                  href={entry.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm md:text-xs text-primary hover:underline truncate"
                >
                  <Briefcase className="h-3 w-3 shrink-0" />
                  <span className="truncate">{entry.title}</span>
                </a>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="w-full"
            onClick={() => onView(student)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { user, isCompany } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ track: 'All', minStars: '0' });
  const [search, setSearch] = useState('');
  const [companyGuildName, setCompanyGuildName] = useState('');

  useEffect(() => {
    if (!isCompany) return;
    fetchGuildName();
    fetchStudents();
  }, [isCompany]);

  async function fetchGuildName() {
    if (!user?.id) return;
    const { data } = await supabase
      .from('guilds')
      .select('name')
      .eq('company_id', user.id)
      .single();
    if (data) setCompanyGuildName(data.name);
  }

  async function fetchStudents() {
    setLoading(true);
    try {
      // Fetch A and S rank students with portfolio entries
      let query = supabase
        .from('profiles')
        .select(`
          id, name, avatar, xp, track_primary,
          rank, avg_star_rating, missions_completed,
          portfolio_entries(title, track, submission_url)
        `)
        .in('rank', ['A', 'S'])
        .order('xp', { ascending: false })
        .limit(50);

      const { data, error } = await query;
      if (error) throw error;
      setStudents((data as any[]) ?? []);
    } catch (err: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  async function handleViewProfile(student: StudentProfile) {
    // Log scout view
    try {
      await supabase.from('scout_views').insert({
        viewer_id: user.id,
        student_id: student.id,
        guild_name: companyGuildName,
      });
      await notifyScoutView(student.id, companyGuildName);
    } catch (_) {
      // Non-fatal
    }
    navigate(`/u/${student.name.toLowerCase().replace(/\s+/g, '-')}`);
  }

  const filtered = students.filter((s) => {
    if (filters.track !== 'All' && s.track_primary !== filters.track) return false;
    if (parseFloat(filters.minStars) > 0 && s.avg_star_rating < parseFloat(filters.minStars)) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isCompany) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        This page is only accessible to Guild Commanders.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Discover Students</h1>
        <p className="text-muted-foreground mt-1">Browse top-ranked students and find talent for your missions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <Select value={filters.minStars} onValueChange={(v) => setFilters((f) => ({ ...f, minStars: v }))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Min stars" />
          </SelectTrigger>
          <SelectContent>
            {['0', '1', '2', '3', '4', '5'].map((s) => (
              <SelectItem key={s} value={s}>{s === '0' ? 'Any stars' : `${s}+ stars`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <Star className="h-8 w-8 opacity-30" />
          <p>No students match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              companyGuildName={companyGuildName}
              onView={handleViewProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
