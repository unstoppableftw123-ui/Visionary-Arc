import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Palette, TrendingUp, Mic2, Heart,
  ArrowLeft, Sparkles, RefreshCw, CheckSquare, Square,
  Clock, Zap, Loader2, AlertCircle,
} from 'lucide-react';
import { AuthContext } from '../../App';
import { getTrack } from '../../data/tracksData';
import { generateBrief } from '../../services/briefService';
import { supabase } from '../../services/supabaseClient';
import { showXPToast } from '../../components/XPToast';
import { getProfile } from '../../services/db';
import { canAccessBriefDifficulty, getTierForXP } from '../../services/xpService';
import { toast } from 'sonner';

const ICON_MAP = { Cpu, Palette, TrendingUp, Mic2, Heart };

const DIFFICULTIES = [
  { id: 'starter',  label: 'Starter',  time: '3–5 days',   xp: '+200 XP' },
  { id: 'standard', label: 'Standard', time: '1–2 weeks',  xp: '+400 XP' },
  { id: 'advanced', label: 'Advanced', time: '2–3 weeks',  xp: '+700 XP' },
  { id: 'expert',   label: 'Expert',   time: '3–4 weeks',  xp: '+1,000 XP' },
];

const LOADING_MESSAGES = [
  'Finding the right client for you…',
  'Crafting your project scenario…',
  'Assembling your deliverables…',
];

// ── XP reward per difficulty (CLAUDE.md §5) ───────────────────────────────────
const DIFFICULTY_XP = { starter: 200, standard: 400, advanced: 700, expert: 1000 };
const DIFFICULTY_COINS = { starter: 50, standard: 100, advanced: 175, expert: 250 };

export default function BriefGeneratorPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const track = getTrack(trackId);
  const [difficulty, setDifficulty] = useState('starter');
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [checked, setChecked] = useState({});
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState(null);
  const userTier = getTierForXP((profile?.xp ?? user?.xp) ?? 0);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!user?.id) return;
      const { data } = await getProfile(user.id);
      if (mounted) setProfile(data ?? null);
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user?.id]);

  // Cycle loading messages
  const msgTimer = useRef(null);
  useEffect(() => {
    if (loading) {
      msgTimer.current = setInterval(() => {
        setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      clearInterval(msgTimer.current);
      setMsgIdx(0);
    }
    return () => clearInterval(msgTimer.current);
  }, [loading]);

  // Reset brief when difficulty changes (if one was showing)
  useEffect(() => {
    setBrief(null);
    setError(null);
    setChecked({});
  }, [difficulty]);

  useEffect(() => {
    const requestedDifficulty = (searchParams.get('difficulty') ?? '').toLowerCase();
    if (DIFFICULTIES.some((item) => item.id === requestedDifficulty)) {
      setDifficulty(requestedDifficulty);
    }
  }, [searchParams]);

  if (!track) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Track not found.{' '}
        <button className="underline" onClick={() => navigate('/tracks')}>Go back</button>
      </div>
    );
  }

  const Icon = ICON_MAP[track.icon] ?? Cpu;

  const handleGenerate = async () => {
    if (!user?.id) return;
    if (!canAccessBriefDifficulty(userTier, difficulty)) {
      setError(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} briefs unlock at higher tier.`);
      return;
    }
    setLoading(true);
    setError(null);
    setBrief(null);
    setChecked({});
    try {
      const { brief: generated, fallback } = await generateBrief(trackId, difficulty, {
        userId: user.id,
        name: profile?.name ?? user.name,
        grade: profile?.grade ?? user.grade,
        school: profile?.school ?? user.school,
      });
      if (fallback) {
        toast.warning('AI offline — showing a sample brief.', { duration: 4000 });
      }
      setBrief(generated);
    } catch (err) {
      if (err?.message === 'INSUFFICIENT_COINS') {
        setError('Not enough coins. Visit the Shop to top up.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!brief || !user?.id) return;
    setCreating(true);
    try {
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          track: trackId,
          difficulty,
          title: brief.title,
          role: brief.role,
          client_name: brief.client,
          brief_json: brief,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Show XP preview toast (actual award happens on submission)
      showXPToast({ xp: 50, coins: 5, levelUp: false, tier: '' });
      toast.success('Project started! Complete it to earn XP.', { duration: 3500 });
      navigate(`/projects/${data.id}`);
    } catch (err) {
      toast.error('Could not save project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleCheck = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="min-h-full max-w-2xl mx-auto space-y-6 p-4 sm:p-6 bg-[#0A0A0F] font-[Satoshi]">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(`/tracks/${trackId}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {track.name}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${track.colors.bg}`}>
          <Icon className={`w-5 h-5 ${track.colors.text}`} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl font-[Clash_Display]">Generate Your Brief</h1>
          <p className="text-sm text-muted-foreground">AI writes a real project just for you</p>
        </div>
      </div>

      {/* Difficulty selector */}
      <div>
        <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Choose Difficulty
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            const unlocked = canAccessBriefDifficulty(userTier, d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                disabled={!unlocked}
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? `${track.colors.border} ${track.colors.bg} ${track.colors.text}`
                    : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                }`}
              >
                <p className={`text-sm font-semibold ${active ? track.colors.text : ''}`}>{d.label}</p>
                <p className="text-sm md:text-[11px] mt-0.5 opacity-70 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {d.time}
                </p>
                <p className="text-sm md:text-[11px] mt-0.5 opacity-70 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {d.xp}
                </p>
                {!unlocked && <p className="mt-1 text-[10px] text-muted-foreground">Locked by tier</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* State 1 — Before generate */}
      {!loading && !brief && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-12 gap-4"
        >
          <motion.button
            type="button"
            onClick={handleGenerate}
            className={`${track.colors.button} px-8 py-4 rounded-2xl font-semibold text-base flex items-center gap-2 shadow-lg transition-all`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="w-5 h-5" />
            Generate My Brief
          </motion.button>
          <p className="text-sm md:text-xs text-muted-foreground">AI creates a brief written just for you</p>
        </motion.div>
      )}

      {/* State 2 — Loading */}
      {loading && (
        <div className="flex flex-col items-center py-14 gap-5">
          <Loader2 className={`w-8 h-8 animate-spin ${track.colors.text}`} />
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {LOADING_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* State 3 — Brief card */}
      {brief && !loading && (
        <AnimatePresence>
          <motion.div
            key="brief-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
          >
            {/* Card header */}
            <div className={`border-b border-border px-4 py-5 sm:px-6 ${track.colors.bg}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm md:text-xs font-medium uppercase tracking-wide mb-1">
                    You are a
                  </p>
                  <p className="text-foreground text-xl font-medium break-words sm:text-[1.35rem]">
                    {brief.role}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-foreground break-words sm:text-xl">{brief.title}</p>
                </div>
                <span className={`self-start shrink-0 rounded-full px-2.5 py-1 text-sm md:text-[11px] font-bold uppercase tracking-wide ${track.colors.badge}`}>
                  {brief.difficulty ?? difficulty}
                </span>
              </div>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-6">
              {/* Client box */}
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Your Client
                </p>
                <p className="text-foreground font-semibold">{brief.client}</p>
                <p className="text-muted-foreground text-sm mt-1">{brief.clientNeed}</p>
              </div>

              {/* Brief summary */}
              <p className="text-sm text-foreground/90 leading-relaxed">{brief.briefSummary}</p>

              {/* Deliverables */}
              <div>
                <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Deliverables
                </p>
                <div className="space-y-2">
                  {brief.deliverables.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleCheck(i)}
                      className="flex items-start gap-2.5 w-full text-left hover:opacity-80 transition-opacity"
                    >
                      {checked[i]
                        ? <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${track.colors.text}`} />
                        : <Square className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      }
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
                  {brief.skills.map((skill) => (
                    <span key={skill} className={`text-sm md:text-[11px] font-medium px-2.5 py-1 rounded-full ${track.colors.badge}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timeline + XP */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-sm md:text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {brief.timeline}
                </div>
                <div className="flex items-center gap-1.5 text-sm md:text-xs text-brand-orange bg-brand-orange/10 rounded-full px-3 py-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {DIFFICULTY_XP[difficulty]?.toLocaleString()} XP on completion
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleStartProject}
                  disabled={creating}
                  className={`flex-1 ${track.colors.button} py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60`}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Start This Project
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || creating}
                  className="flex-1 sm:flex-none border border-border text-muted-foreground hover:text-foreground hover:border-border/80 py-3 px-5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Different Brief
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
