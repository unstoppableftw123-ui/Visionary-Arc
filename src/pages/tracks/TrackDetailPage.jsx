import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Palette, TrendingUp, Mic2, Heart, ArrowLeft, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../../App';
import { getTrack } from '../../data/tracksData';
import { getUserProjects } from '../../services/db';

const ICON_MAP = { Cpu, Palette, TrendingUp, Mic2, Heart };

const STATUS_LABELS = {
  active:    { label: 'In Progress', className: 'bg-blue-500/20 text-blue-300' },
  submitted: { label: 'Submitted',   className: 'bg-brand-orange/20 text-brand-tan' },
  completed: { label: 'Completed',   className: 'bg-green-500/20 text-green-300' },
  abandoned: { label: 'Abandoned',   className: 'bg-neutral-500/20 text-neutral-400' },
};

export default function TrackDetailPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const track = getTrack(trackId);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getUserProjects(user.id).then(({ data }) => {
      if (data) setProjects(data.filter((p) => p.track === trackId));
    }).finally(() => setLoadingProjects(false));
  }, [user?.id, trackId]);

  if (!track) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Track not found.{' '}
        <button className="underline" onClick={() => navigate('/tracks')}>Go back</button>
      </div>
    );
  }

  const Icon = ICON_MAP[track.icon] ?? Cpu;

  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto space-y-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/tracks')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Tracks
      </button>

      {/* Track header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border ${track.colors.border} ${track.colors.bg} p-6`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${track.colors.bgSolid}/20`}>
            <Icon className={`w-6 h-6 ${track.colors.text}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{track.name}</h1>
            <p className={`text-sm mt-0.5 ${track.colors.text}`}>{track.tagline}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{track.description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {track.skills.map((skill) => (
            <span key={skill} className={`text-sm md:text-xs font-medium px-2.5 py-1 rounded-full ${track.colors.badge}`}>
              {skill}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Start a new project CTA */}
      <motion.button
        type="button"
        onClick={() => navigate(`/tracks/${trackId}/brief`)}
        className={`w-full rounded-2xl ${track.colors.button} p-6 text-left group transition-all`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-lg">Start a New Project</span>
            </div>
            <p className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm">
              AI generates a personalised brief — just for you
            </p>
            <p className="text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] text-sm md:text-xs mt-1">{track.xpRange}</p>
          </div>
          <ArrowLeft className="w-5 h-5 rotate-180 opacity-70 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.button>

      {/* Projects in this track */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Your Projects</h2>

        {loadingProjects && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-4 w-4 rounded-full bg-white/5" />
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-white/5" />
                    <div className="mt-3 flex gap-2">
                      <div className="h-5 w-24 rounded-full bg-white/5" />
                      <div className="h-5 w-16 rounded-full bg-white/5" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingProjects && projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            No projects yet in this track. Generate your first brief above!
          </div>
        )}

        <div className="space-y-3">
          {projects.map((project) => {
            const status = STATUS_LABELS[project.status] ?? STATUS_LABELS.active;
            return (
              <div key={project.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${project.status === 'completed' ? track.colors.text : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.title ?? 'Untitled Project'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm md:text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    {project.difficulty && (
                      <span className="text-sm md:text-xs text-muted-foreground capitalize">{project.difficulty}</span>
                    )}
                  </div>
                </div>
                {project.xp_awarded > 0 && (
                  <span className="text-sm md:text-xs text-brand-orange font-semibold shrink-0">+{project.xp_awarded} XP</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
