import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, ExternalLink, Globe, FolderOpen, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import { getPortfolio, getProfile, getUserProjects, updateProfile } from '../services/db';
import { getTierForXP } from '../services/xpService';
import { getTrack } from '../data/tracksData';
import { Switch } from '../components/ui/switch';

// ── Tier display config ─────────────────────────────────────────────────────
const TIER_CONFIG = {
  Beginner: { bg: 'bg-[var(--va-border)]/40', text: 'text-muted-foreground', dot: 'bg-[var(--va-muted)]' },
  Builder:  { bg: 'bg-green-500/20',  text: 'text-green-400',  dot: 'bg-green-400' },
  Creator:  { bg: 'bg-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  Pro:      { bg: 'bg-orange-600/20', text: 'text-orange-400', dot: 'bg-orange-600/10' },
  Elite:    { bg: 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]', text: 'text-[var(--accent)]', dot: 'bg-[var(--accent)]' },
};

function TierBadge({ xp }) {
  const tier   = getTierForXP(xp ?? 0);
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.Beginner;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm md:text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {tier}
    </span>
  );
}

function PortfolioCard({ entry }) {
  const track  = getTrack(entry.track ?? '');
  const colors = track?.colors ?? {
    bg: 'bg-primary/10', text: 'text-primary', badge: 'bg-primary/20 text-primary',
    border: 'border-primary',
  };

  const completedDate = entry.created_at
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
        new Date(entry.created_at)
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden border-l-4 ${colors.border}`}
    >
      <div className={`px-5 py-4 ${colors.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm md:text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text}`}>
              {track?.name ?? entry.track}
            </p>
            <h3 className="font-bold text-foreground leading-snug">{entry.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{entry.role}</p>
          </div>
          {entry.submission_url && (
            <a
              href={entry.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`shrink-0 flex items-center gap-1 text-sm md:text-xs font-medium ${colors.text} hover:opacity-80 transition-opacity`}
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {entry.description && (
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {entry.description}
          </p>
        )}

        {/* Skills */}
        {Array.isArray(entry.skills) && entry.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.skills.map((skill) => (
              <span
                key={skill}
                className={`text-sm md:text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {completedDate && (
          <p className="text-sm md:text-[11px] text-muted-foreground">{completedDate}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function PortfolioPage() {
  const { userId: paramUserId } = useParams();
  const { user: currentUser } = useContext(AuthContext);

  const viewingUserId = paramUserId ?? currentUser?.id;
  const isOwnProfile  = !paramUserId || paramUserId === currentUser?.id;

  const [profile,   setProfile]   = useState(null);
  const [entries,   setEntries]   = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);
  const [available, setAvailable] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    if (!viewingUserId) { setLoading(false); return; }

    async function load() {
      const [profileResult, portfolioResult] = await Promise.all([
        getProfile(viewingUserId),
        getPortfolio(viewingUserId),
      ]);

      if (profileResult.data)  setProfile(profileResult.data);
      if (portfolioResult.data) setEntries(portfolioResult.data);
      if (profileResult.data?.available_for_opportunities !== undefined) {
        setAvailable(profileResult.data.available_for_opportunities);
      }
      const projectResult = await getUserProjects(viewingUserId);
      if (projectResult.data) setProjects(projectResult.data);
      setLoading(false);
    }
    load();
  }, [viewingUserId]);

  const handleCopyUrl = () => {
    const url = `https://visionary-arc.app/portfolio/${viewingUserId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAvailabilityToggle = async (val) => {
    setAvailable(val);
    setSavingAvail(true);
    try {
      await updateProfile(viewingUserId, { available_for_opportunities: val });
    } catch (_) {
      toast.error('Could not save preference');
    } finally {
      setSavingAvail(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-16 w-16 rounded-2xl bg-white/5" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-40 rounded bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/5" />
              <div className="h-4 w-52 rounded bg-white/5" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
              <div className="h-20 rounded-xl bg-white/5" />
              <div className="mt-4 h-5 w-2/3 rounded bg-white/5" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/5" />
              <div className="mt-4 h-4 w-full rounded bg-white/5" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-20 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const xp             = profile?.xp ?? 0;
  const projectsCount  = entries.length;
  const activeTracks   = [...new Set(entries.map((e) => e.track).filter(Boolean))];
  const initials       = profile?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="min-h-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0 overflow-hidden">
            {profile?.avatar
              ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              : initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{profile?.name ?? 'Student'}</h1>
              <TierBadge xp={xp} />
            </div>
            {(profile?.school || profile?.grade) && (
              <p className="text-sm text-muted-foreground mb-3">
                {[profile.school, profile.grade ? `Grade ${profile.grade}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{xp.toLocaleString()}</span> XP
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{projectsCount}</span> project{projectsCount !== 1 ? 's' : ''}
              </span>
              {activeTracks.length > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{activeTracks.length}</span> track{activeTracks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:shrink-0 sm:items-end">
            {/* Copy public URL */}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 text-sm md:text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors text-muted-foreground"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Globe className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy public URL'}
            </button>

            {/* Available toggle (own profile only) */}
            {isOwnProfile && (
              <label className="flex items-center gap-2 text-sm md:text-xs text-muted-foreground cursor-pointer">
                <span>Available for opportunities</span>
                <Switch
                  checked={available}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={savingAvail}
                />
              </label>
            )}
          </div>
        </div>
      </motion.div>

      {/* Portfolio grid */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((entry, i) => (
            <PortfolioCard key={entry.id ?? i} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-6 py-12 sm:px-10 flex flex-col items-center text-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
            <FolderOpen className="h-12 w-12" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground mb-2">
              {isOwnProfile ? 'Your portfolio is empty' : 'No projects yet'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {isOwnProfile
                ? 'Start with your first AI brief and your completed work will auto-appear here.'
                : 'This student has no public portfolio entries yet.'}
            </p>
          </div>
          {isOwnProfile && (
            <Link
              to="/tracks/tech-ai/brief?difficulty=starter"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Generate your first brief <Sparkles className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Project Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const track = getTrack(project.track ?? '');
              const colors = track?.colors ?? { border: 'border-primary', bg: 'bg-primary/10', text: 'text-primary', badge: 'bg-primary/20 text-primary' };
              return (
                <div key={project.id} className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 border-l-4 ${colors.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${colors.text}`}>{track?.name ?? project.track}</p>
                      <h3 className="font-semibold text-foreground">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.role}</p>
                    </div>
                    {project.submission_url && (
                      <a href={project.submission_url} target="_blank" rel="noreferrer" className={`text-xs ${colors.text} inline-flex items-center gap-1`}>
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {project.brief_json?.briefSummary && (
                    <p className="mt-3 text-sm text-muted-foreground">{project.brief_json.briefSummary}</p>
                  )}
                  {Array.isArray(project.brief_json?.skills) && project.brief_json.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.brief_json.skills.map((skill) => (
                        <span key={skill} className={`text-[11px] rounded-full px-2 py-0.5 ${colors.badge}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
