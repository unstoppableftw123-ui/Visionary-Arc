import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckSquare, Square, Clock, Zap, Loader2,
  ExternalLink, Send, PartyPopper, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../../App';
import { getTrack } from '../../data/tracksData';
import { supabase } from '../../services/supabaseClient';
import { submitProject, addPortfolioEntry } from '../../services/db';
import { awardCoins } from '../../services/coinService';
import { awardProjectSubmissionXP } from '../../services/xpService';
import { showXPToast } from '../../components/XPToast';

const DIFFICULTY_XP    = { starter: 200, standard: 400, advanced: 700, expert: 1000 };
const DIFFICULTY_COINS = { starter: 50,  standard: 100, advanced: 175, expert: 250  };

const EXTERNAL_TOOLS = [
  { name: 'Figma',       url: 'https://figma.com',       label: 'free' },
  { name: 'Google Docs', url: 'https://docs.google.com', label: '' },
  { name: 'Canva',       url: 'https://canva.com',       label: 'free' },
  { name: 'GitHub',      url: 'https://github.com',      label: '' },
  { name: 'YouTube',     url: 'https://youtube.com',     label: '' },
];

const STAGES = ['Reading your brief', 'Working on it', 'Submit'];

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [stage, setStage]       = useState(0);
  const [checked, setChecked]   = useState({});
  const [url, setUrl]           = useState('');
  const [notes, setNotes]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [celebrated, setCelebrated] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Restore stage from localStorage
  useEffect(() => {
    if (!projectId) return;
    const saved = localStorage.getItem(`project_stage_${projectId}`);
    if (saved !== null) setStage(parseInt(saved, 10));
  }, [projectId]);

  const setAndSaveStage = (s) => {
    setStage(s);
    localStorage.setItem(`project_stage_${projectId}`, String(s));
  };

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error || !data) {
        toast.error('Project not found');
        navigate('/tracks');
        return;
      }
      setProject(data);
      setLoading(false);
    }
    loadProject();
  }, [projectId, navigate]);

  const brief      = project?.brief_json ?? {};
  const track      = getTrack(project?.track ?? '');
  const difficulty = (project?.difficulty ?? 'starter').toLowerCase();
  const colors     = track?.colors ?? {
    bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary',
    badge: 'bg-primary/20 text-primary', button: 'bg-primary text-[var(--text-primary)]',
  };

  const toggleCheck = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleSubmit = async () => {
    if (!isValidUrl(url.trim())) {
      setUrlError('Please paste a valid URL (Google Doc, Figma, GitHub, etc.)');
      return;
    }
    setUrlError('');
    setSubmitting(true);
    try {
      const xpAmount = DIFFICULTY_XP[difficulty] ?? 200;
      const coinsAmount = DIFFICULTY_COINS[difficulty] ?? 50;

      // 1) mark submitted with rewards
      const { error: submitErr } = await submitProject(projectId, url.trim(), notes, xpAmount, coinsAmount);
      if (submitErr) throw submitErr;

      // 2) auto-create portfolio entry
      const portfolioDescription =
        `${brief.role} built "${brief.title}" for ${brief.client}. ${brief.briefSummary}`;
      const { error: portfolioErr } = await addPortfolioEntry({
        user_id:        user.id,
        project_id:     projectId,
        track:          project.track,
        title:          brief.title,
        role:           brief.role,
        description:    portfolioDescription,
        skills:         brief.skills ?? [],
        submission_url: url.trim(),
        is_public:      true,
      });
      if (portfolioErr) throw portfolioErr;

      // 3) award XP (single source via xpService) + coins (coinService)
      const xpReward = await awardProjectSubmissionXP(user.id, xpAmount);
      if (!xpReward?.awarded) {
        const { awardXP } = await import('../../services/db');
        await awardXP(user.id, xpAmount);
      }
      await awardCoins(user.id, coinsAmount, `project_submitted_${difficulty}`);

      // 6. Celebrate
      setCelebrated(true);
      showXPToast({ xp: xpAmount, coins: coinsAmount, levelUp: false, tier: '' });

      // Confetti — requires canvas-confetti (npm install canvas-confetti)
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } catch (_) {}

      setTimeout(() => navigate('/portfolio'), 3000);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  // ── Celebration screen ──────────────────────────────────────────────────────
  if (celebrated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-full flex flex-col items-center justify-center gap-6 text-center px-6"
      >
        <PartyPopper className="w-20 h-20 text-brand-orange" />
        <h1 className="text-3xl font-bold">Project Submitted!</h1>
        <p className="text-muted-foreground max-w-sm">
          Your portfolio is being updated. Redirecting to your portfolio in a moment…
        </p>
        <div className="flex items-center gap-2 text-brand-orange font-semibold text-lg">
          <Zap className="w-5 h-5" />
          +{(DIFFICULTY_XP[difficulty] ?? 200).toLocaleString()} XP earned
        </div>
      </motion.div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto space-y-6 bg-[#0A0A0F] font-[Satoshi]">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(`/tracks/${project.track}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {track?.name ?? 'Back'}
      </button>

      {/* Progress tracker */}
      <div>
        <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Your progress
        </p>
        <div className="flex items-center">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => setAndSaveStage(i)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  i <= stage ? colors.text : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm md:text-xs font-bold border-2 transition-colors ${
                    i < stage
                      ? `${colors.bg} ${colors.text} border-transparent`
                      : i === stage
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    i < stage ? colors.bg : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brief card (read-only) */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <div className={`px-6 py-5 border-b border-border ${colors.bg}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm md:text-xs font-medium uppercase tracking-wide mb-1">
                You are a
              </p>
              <p className="text-foreground font-medium text-xl">{brief.role}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{brief.title}</p>
            </div>
            <span
              className={`text-sm md:text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${colors.badge}`}
            >
              {brief.difficulty ?? difficulty}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Client */}
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-sm md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Your Client
            </p>
            <p className="text-foreground font-semibold">{brief.client}</p>
            <p className="text-muted-foreground text-sm mt-1">{brief.clientNeed}</p>
          </div>

          {/* Summary */}
          <p className="text-sm text-foreground/90 leading-relaxed">{brief.briefSummary}</p>

          {/* Deliverables (checkable) */}
          <div>
            <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Deliverables
            </p>
            <div className="space-y-2">
              {(brief.deliverables ?? []).map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCheck(i)}
                  className="flex items-start gap-2.5 w-full text-left hover:opacity-80 transition-opacity"
                >
                  {checked[i]
                    ? <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${colors.text}`} />
                    : <Square className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                  <span className={`text-sm ${checked[i] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Skills You'll Build
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(brief.skills ?? []).map((skill) => (
                <span
                  key={skill}
                  className={`text-sm md:text-[11px] font-medium px-2.5 py-1 rounded-full ${colors.badge}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-1.5 text-sm md:text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            {brief.timeline}
          </div>
        </div>
      </div>

      {/* External tools */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Build your project using tools like Figma, Google Docs, Canva, GitHub, YouTube — then come
          back here to submit.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXTERNAL_TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {tool.name}
              {tool.label && (
                <span className="text-sm md:text-[10px] text-muted-foreground">({tool.label})</span>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Stage advance button (stages 0 and 1) */}
      {stage < 2 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setAndSaveStage(stage + 1)}
            className={`${colors.button} px-6 py-3 rounded-xl font-semibold text-sm transition-all`}
          >
            {stage === 0 ? "I've read the brief →" : "I'm ready to submit →"}
          </button>
        </div>
      )}

      {/* Submission form (stage 2) */}
      {stage === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4"
        >
          <h2 className="font-semibold text-foreground">Submit Your Project</h2>

          <div className="space-y-1.5">
            <label className="text-sm md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Project link *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(''); setConfirming(false); }}
              onBlur={() => {
                if (!url.trim()) return;
                if (isValidUrl(url.trim())) {
                  setConfirming(true);
                } else {
                  setConfirming(false);
                }
              }}
              placeholder="Paste your Google Doc, Figma, GitHub, or YouTube link…"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {urlError && (
              <p className="flex items-center gap-1.5 text-sm md:text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {urlError}
              </p>
            )}
            {confirming && !urlError && (
              <p className="text-sm md:text-xs text-emerald-400">Link looks valid and ready to submit.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              What did you build?{' '}
              <span className="normal-case font-normal">(optional, 2–3 sentences)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you built…"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className={`w-full ${colors.button} py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting…' : 'Submit Project'}
          </button>

          <p className="text-sm md:text-xs text-center text-muted-foreground">
            Earn +{(DIFFICULTY_XP[difficulty] ?? 200).toLocaleString()} XP
            &nbsp;+&nbsp;{DIFFICULTY_COINS[difficulty] ?? 50} coins on completion
          </p>
        </motion.div>
      )}
    </div>
  );
}
