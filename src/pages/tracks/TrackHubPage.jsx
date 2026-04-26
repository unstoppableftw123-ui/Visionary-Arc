import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Palette, TrendingUp, Mic2, Heart, ChevronRight } from 'lucide-react';
import { TRACKS } from '../../data/tracksData';
import { AuthContext } from '../../App';
import { getUserProjects } from '../../services/db';

const ICON_MAP = { Cpu, Palette, TrendingUp, Mic2, Heart };

function ProgressRing({ value, colorClass }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (safe / 100) * circumference;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r={radius} className="fill-none stroke-white/10" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`fill-none ${colorClass}`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">
        {Math.round(safe)}%
      </div>
    </div>
  );
}

function TrackCard({ track, index, completedCount, totalCount }) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[track.icon] ?? Cpu;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/tracks/${track.id}`)}
      className={`group relative text-left w-full overflow-hidden p-6 flex flex-col gap-4 transition-shadow hover:shadow-lg hover:shadow-black/30 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl ${track.colors.ring} focus:outline-none focus:ring-2`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
    >
      {/* Color accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${track.colors.bgSolid}`} />

      <div className="flex items-start gap-4 pl-3">
        <div className={`p-2.5 rounded-xl ${track.colors.bg} shrink-0 border border-white/10`}>
          <Icon className={`w-5 h-5 ${track.colors.text} `} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-tight font-[Clash_Display]">{track.name}</p>
          <p className={`text-sm mt-0.5 ${track.colors.text} font-[Satoshi]`}>{track.tagline}</p>
        </div>
        <ProgressRing value={progress} colorClass={track.colors.text.replace('text-', 'stroke-')} />
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
      </div>

      <div className="pl-3 flex flex-wrap gap-1.5">
        {track.skills.slice(0, 3).map((skill) => (
          <span key={skill} className={`text-sm md:text-[11px] font-medium px-2 py-0.5 rounded-full ${track.colors.badge} font-[Satoshi]`}>
            {skill}
          </span>
        ))}
      </div>

      <p className="pl-3 text-sm md:text-xs text-muted-foreground leading-relaxed line-clamp-2 font-[Satoshi]">
        {track.description}
      </p>
      <p className="pl-3 text-xs text-muted-foreground/90 font-[Satoshi]">
        {completedCount} completed project{completedCount === 1 ? '' : 's'}
      </p>
    </motion.button>
  );
}

export default function TrackHubPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadProjects() {
      if (!user?.id) {
        if (mounted) {
          setProjects([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await getUserProjects(user.id);
      if (mounted) {
        setProjects(data ?? []);
        setLoading(false);
      }
    }
    loadProjects();
    return () => { mounted = false; };
  }, [user?.id]);

  const countsByTrack = useMemo(() => {
    const byTrack = {};
    for (const track of TRACKS) byTrack[track.id] = { completed: 0, total: 0 };
    for (const project of projects) {
      if (byTrack[project.track] !== undefined) {
        byTrack[project.track].total += 1;
        if (project.status === 'completed') byTrack[project.track].completed += 1;
      }
    }
    return byTrack;
  }, [projects]);

  const totalCompleted = useMemo(
    () => Object.values(countsByTrack).reduce((sum, item) => sum + item.completed, 0),
    [countsByTrack]
  );

  return (
    <div className="min-h-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#0A0A0F]">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-[Clash_Display]">Choose Your Path</h1>
        <p className="mt-2 text-muted-foreground text-base font-[Satoshi]">
          Build real skills. Build a real portfolio.
        </p>
        <p className="mt-1 text-sm text-white/60 font-[Satoshi]">{totalCompleted} projects completed across tracks</p>
      </motion.div>

      {/* Track grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-28 rounded bg-white/5" />
                    <div className="h-4 w-44 rounded bg-white/5" />
                    <div className="h-4 w-full rounded bg-white/5" />
                  </div>
                  <div className="h-14 w-14 rounded-full bg-white/5" />
                </div>
                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-white/5" />
                  <div className="h-6 w-24 rounded-full bg-white/5" />
                  <div className="h-6 w-16 rounded-full bg-white/5" />
                </div>
                <div className="mt-5 h-4 w-32 rounded bg-white/5" />
              </div>
            ))
          : TRACKS.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                index={i}
                completedCount={countsByTrack[track.id]?.completed ?? 0}
                totalCount={countsByTrack[track.id]?.total ?? 0}
              />
            ))}
      </div>
    </div>
  );
}
