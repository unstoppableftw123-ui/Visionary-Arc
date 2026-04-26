import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../App';
import { supabase } from '../services/supabaseClient';
import {
  createCompanyGuild,
  postMission,
  publishMission,
  reviewSubmission,
  approveApplication,
  rejectApplication,
} from '../services/guildService';
import {
  createGuildSubscription,
  depositCoinBudget,
} from '../services/stripeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
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
import {
  Settings,
  Swords,
  ClipboardList,
  Users,
  Wallet,
  BarChart2,
  Plus,
  ExternalLink,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
} from 'lucide-react';

const TABS = [
  { id: 'setup', label: 'Guild Setup', icon: Settings },
  { id: 'missions', label: 'Missions', icon: Swords },
  { id: 'submissions', label: 'Submissions', icon: ClipboardList },
  { id: 'applications', label: 'Applications', icon: Users },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const DIFFICULTY_OPTIONS = ['E', 'D', 'C', 'B', 'A', 'S'];
const MISSION_TYPES = ['story', 'bounty', 'repeatable', 'gathering', 'escort'];
const TRACK_OPTIONS = ['tech', 'design', 'content', 'business', 'impact'];
const RANK_OPTIONS = ['E', 'D', 'C', 'B', 'A', 'S'];

function CompanyDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: TABS.length }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] p-5"
            >
              <div className="space-y-4 animate-pulse">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-white/5" />
                    <div className="h-6 w-40 rounded bg-white/5" />
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/5" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-white/5" />
                  <div className="h-4 w-4/5 rounded bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-white/5" />
                  <div className="h-16 rounded-2xl bg-white/5" />
                </div>
                <div className="h-11 rounded-xl bg-white/5" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] p-5">
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-40 rounded bg-white/5" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] p-5">
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-32 rounded bg-white/5" />
              <div className="h-40 rounded-2xl bg-white/5" />
              <div className="h-10 rounded-xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarSelector({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition-colors ${n <= value ? 'text-[var(--accent)]' : 'text-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)]'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-[var(--va-border)]/40 text-muted-foreground border-[var(--va-border)]',
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    expired: 'bg-red-500/20 text-red-400 border-red-500/30',
    submitted: 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return (
    <Badge className={`border text-sm md:text-xs capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </Badge>
  );
}

// ── Tab: Guild Setup ──────────────────────────────────────────────────────────
function GuildSetupTab({ guild, onGuildCreated }) {
  const { user } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: guild?.name ?? '',
    description: guild?.description ?? '',
    tier: guild?.tier ?? 'basic',
    entryMinRank: guild?.entry_min_rank ?? 'E',
    entryMinStars: guild?.entry_min_stars ?? 0,
    entryTrack: guild?.entry_track ?? '',
    bannerUrl: guild?.banner_url ?? '',
    colorTheme: guild?.color_theme ?? 'var(--accent)',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!guild) {
        const created = await createCompanyGuild(user.id, form);
        toast.success('Guild created!');
        onGuildCreated(created);
      } else {
        const { error } = await supabase
          .from('guilds')
          .update({
            name: form.name,
            description: form.description,
            tier: form.tier,
            entry_min_rank: form.entryMinRank,
            entry_min_stars: form.entryMinStars,
            entry_track: form.entryTrack || null,
            banner_url: form.bannerUrl || null,
            color_theme: form.colorTheme,
          })
          .eq('id', guild.id);
        if (error) throw error;
        toast.success('Guild updated!');
      }
    } catch (e) {
      toast.error(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      {!guild && (
        <p className="text-sm text-muted-foreground">
          You don't have a guild yet. Set it up below to start posting missions.
        </p>
      )}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Guild Name</label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Corp Guild" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="What your company looks for in candidates..."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tier</label>
            <select
              value={form.tier}
              onChange={e => set('tier', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!!guild}
            >
              <option value="basic">Basic (50 members)</option>
              <option value="elite">Elite (200 members)</option>
            </select>
            {guild && <p className="text-sm md:text-xs text-muted-foreground">Tier cannot be changed after creation.</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.colorTheme}
                onChange={e => set('colorTheme', e.target.value)}
                className="h-9 w-16 rounded border border-input cursor-pointer bg-background"
              />
              <span className="text-sm text-muted-foreground font-mono">{form.colorTheme}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Banner Image URL</label>
          <Input
            value={form.bannerUrl}
            onChange={e => set('bannerUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Min Rank</label>
            <select
              value={form.entryMinRank}
              onChange={e => set('entryMinRank', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Min Stars</label>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={form.entryMinStars}
              onChange={e => set('entryMinStars', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Required Track</label>
            <select
              value={form.entryTrack}
              onChange={e => set('entryTrack', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {TRACK_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving || !form.name}>
        {saving ? 'Saving…' : guild ? 'Save Changes' : 'Create Guild'}
      </Button>
      {guild && (
        <Button
          variant="outline"
          onClick={() => window.open(`/guild/${guild.slug}`, '_blank')}
          className="ml-2"
        >
          <ExternalLink className="h-4 w-4 mr-1" /> View Public Page
        </Button>
      )}
    </div>
  );
}

// ── Tab: Missions ─────────────────────────────────────────────────────────────
function MissionsTab({ guild }) {
  const { user } = useContext(AuthContext);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMissionOpen, setNewMissionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'E', type: 'bounty',
    track: 'tech', xp_reward: 100, coin_reward: 50,
    min_rank_required: 'E', max_claims: 1,
  });

  const load = useCallback(async () => {
    if (!guild) return;
    setLoading(true);
    const { data } = await supabase
      .from('guild_missions')
      .select('*')
      .eq('guild_id', guild.id)
      .order('created_at', { ascending: false });
    setMissions(data ?? []);
    setLoading(false);
  }, [guild]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handlePost = async () => {
    setSaving(true);
    try {
      await postMission(user.id, guild.id, form);
      toast.success('Mission posted as draft.');
      setNewMissionOpen(false);
      setForm({ title: '', description: '', difficulty: 'E', type: 'bounty', track: 'tech', xp_reward: 100, coin_reward: 50, min_rank_required: 'E', max_claims: 1 });
      load();
    } catch (e) {
      toast.error(e.message ?? 'Failed to post mission');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (missionId) => {
    try {
      await publishMission(user.id, missionId);
      toast.success('Mission published!');
      load();
    } catch (e) {
      toast.error(e.message ?? 'Failed to publish');
    }
  };

  const handleUnpublish = async (missionId) => {
    try {
      const { error } = await supabase
        .from('guild_missions')
        .update({ status: 'draft' })
        .eq('id', missionId);
      if (error) throw error;
      toast.success('Mission paused.');
      load();
    } catch (e) {
      toast.error(e.message ?? 'Failed to pause');
    }
  };

  if (!guild) return <p className="text-muted-foreground text-sm">Create your guild first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">All Missions ({missions.length})</h3>
        <Button onClick={() => setNewMissionOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Post Mission
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : missions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No missions yet.</p>
      ) : (
        <div className="space-y-2">
          {missions.map(m => (
            <Card key={m.id} className="bg-[var(--va-surface)] border-[var(--va-border)]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{m.title}</span>
                    <StatusBadge status={m.status} />
                    <Badge variant="outline" className="text-sm md:text-[10px]">{m.difficulty}</Badge>
                    <Badge variant="outline" className="text-sm md:text-[10px] capitalize">{m.track}</Badge>
                  </div>
                  <p className="text-sm md:text-xs text-muted-foreground mt-0.5 truncate">{m.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm md:text-xs text-muted-foreground">{m.xp_reward} XP · {m.coin_reward} coins</span>
                  {m.status === 'draft' ? (
                    <Button size="sm" variant="outline" onClick={() => handlePublish(m.id)}>Publish</Button>
                  ) : m.status === 'published' ? (
                    <Button size="sm" variant="outline" onClick={() => handleUnpublish(m.id)}>Pause</Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={newMissionOpen} onOpenChange={setNewMissionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Post New Mission</DialogTitle>
            <DialogDescription>Mission will be saved as a draft. You can publish it when ready.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Build a landing page..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Difficulty</label>
                <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize">
                  {MISSION_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Track</label>
                <select value={form.track} onChange={e => set('track', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {TRACK_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Min Rank</label>
                <select value={form.min_rank_required} onChange={e => set('min_rank_required', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">XP Reward</label>
                <Input type="number" min={0} value={form.xp_reward} onChange={e => set('xp_reward', parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Coin Reward</label>
                <Input type="number" min={0} value={form.coin_reward} onChange={e => set('coin_reward', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewMissionOpen(false)}>Cancel</Button>
            <Button onClick={handlePost} disabled={saving || !form.title}>
              {saving ? 'Posting…' : 'Post as Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab: Submissions ──────────────────────────────────────────────────────────
function SubmissionsTab({ guild }) {
  const { user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ starRating: 3, feedback: '', approved: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!guild) return;
    setLoading(true);
    const { data } = await supabase
      .from('mission_assignments')
      .select('*, guild_missions(title, difficulty, coin_reward), profiles(name, avatar)')
      .eq('guild_id', guild.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });
    setSubmissions(data ?? []);
    setLoading(false);
  }, [guild]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    setSaving(true);
    try {
      await reviewSubmission(user.id, reviewing.id, reviewForm);
      toast.success(reviewForm.approved ? 'Submission approved!' : 'Submission rejected.');
      setReviewing(null);
      load();
    } catch (e) {
      toast.error(e.message ?? 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  if (!guild) return <p className="text-muted-foreground text-sm">Create your guild first.</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Pending Reviews ({submissions.length})</h3>
      {loading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No submissions awaiting review.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map(s => (
            <Card key={s.id} className="bg-[var(--va-surface)] border-[var(--va-border)]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.guild_missions?.title ?? 'Unknown mission'}</p>
                  <p className="text-sm md:text-xs text-muted-foreground">
                    by {s.profiles?.name ?? s.user_id} · submitted {new Date(s.submitted_at).toLocaleDateString()}
                  </p>
                  {s.submission_url && (
                    <a
                      href={s.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm md:text-xs text-blue-400 flex items-center gap-1 mt-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View submission
                    </a>
                  )}
                  {s.submission_note && (
                    <p className="text-sm md:text-xs text-muted-foreground mt-1 line-clamp-1">{s.submission_note}</p>
                  )}
                </div>
                <Button size="sm" onClick={() => { setReviewing(s); setReviewForm({ starRating: 3, feedback: '', approved: true }); }}>
                  Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {reviewing?.guild_missions?.title} by {reviewing?.profiles?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Star Rating</label>
              <StarSelector
                value={reviewForm.starRating}
                onChange={v => setReviewForm(prev => ({ ...prev, starRating: v }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={reviewForm.feedback}
                onChange={e => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
                placeholder="Share what was great or what could be improved..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setReviewForm(prev => ({ ...prev, approved: true }))}
                variant={reviewForm.approved ? 'default' : 'outline'}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                onClick={() => setReviewForm(prev => ({ ...prev, approved: false }))}
                variant={!reviewForm.approved ? 'destructive' : 'outline'}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={handleReview} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab: Applications ─────────────────────────────────────────────────────────
function ApplicationsTab({ guild }) {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!guild) return;
    setLoading(true);
    const { data } = await supabase
      .from('guild_members')
      .select('user_id, joined_at, status, profiles(name, avatar, xp, rank, school)')
      .eq('guild_id', guild.id)
      .eq('status', 'pending')
      .order('joined_at', { ascending: true });
    setApplications(data ?? []);
    setLoading(false);
  }, [guild]);

  useEffect(() => { load(); }, [load]);

  const handle = async (userId, approve) => {
    try {
      if (approve) await approveApplication(user.id, guild.id, userId);
      else await rejectApplication(user.id, guild.id, userId);
      toast.success(approve ? 'Application approved!' : 'Application rejected.');
      load();
    } catch (e) {
      toast.error(e.message ?? 'Action failed');
    }
  };

  if (!guild) return <p className="text-muted-foreground text-sm">Create your guild first.</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Pending Applications ({applications.length})</h3>
      {loading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending applications.</p>
      ) : (
        <div className="space-y-2">
          {applications.map(a => {
            const name = a.profiles?.name ?? a.user_id;
            const initial = name.charAt(0).toUpperCase();
            const hue = (name.charCodeAt(0) * 19) % 360;
            return (
              <Card key={a.user_id} className="bg-[var(--va-surface)] border-[var(--va-border)]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-[var(--text-primary)] font-semibold shrink-0"
                    style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
                  >
                    {a.profiles?.avatar
                      ? <img src={a.profiles.avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
                      : initial
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm md:text-xs text-muted-foreground">
                      Rank {a.profiles?.rank ?? 'E'} · {a.profiles?.xp ?? 0} XP · {a.profiles?.school ?? ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handle(a.user_id, true)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handle(a.user_id, false)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DEPOSIT_OPTIONS = [500, 1000, 2500, 5000];

// ── Tab: Wallet ───────────────────────────────────────────────────────────────
function WalletTab({ guild }) {
  const { user } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(500);
  const [depositing, setDepositing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const { data: w } = await supabase
        .from('company_wallets')
        .select('*')
        .eq('company_id', user.id)
        .maybeSingle();
      setWallet(w);
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      setTransactions(txs ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const coinBalance = wallet?.coin_balance ?? 0;
  const isLowBalance = coinBalance < 100;
  const progressPct = Math.min((coinBalance / 500) * 100, 100);

  async function handleDeposit() {
    if (!guild) return;
    setDepositing(true);
    try {
      const url = await depositCoinBudget(user.id, guild.id, depositAmount);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed');
      setDepositing(false);
    }
  }

  async function handleUpgradeToElite() {
    setUpgrading(true);
    try {
      const url = await createGuildSubscription(user.id, 'elite');
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upgrade failed');
      setUpgrading(false);
    }
  }

  if (loading) return <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Low balance alert */}
      {isLowBalance && (
        <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Low balance — add coins to keep rewarding students for completed missions.
        </div>
      )}

      {/* Balance card */}
      <Card className="bg-[var(--va-surface)] border-[var(--va-border)]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm md:text-xs text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-brand-orange">
                {coinBalance} <span className="text-base text-muted-foreground">coins</span>
              </p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Progress toward suggested 500-coin minimum */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm md:text-xs text-muted-foreground">
              <span>Balance</span>
              <span>{coinBalance} / 500 recommended</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--va-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-orange transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm md:text-xs text-muted-foreground">
            <span>Total deposited: {wallet?.total_deposited ?? 0}</span>
            <span>Total spent: {wallet?.total_spent ?? 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button onClick={() => setDepositOpen(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Deposit Coins
        </Button>

        {guild?.tier === 'basic' && (
          <Button
            variant="outline"
            className="w-full border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10"
            onClick={handleUpgradeToElite}
            disabled={upgrading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {upgrading ? 'Redirecting…' : 'Upgrade to Elite ($149/mo)'}
          </Button>
        )}
      </div>

      {/* Deposit dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-background border-[var(--border)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Deposit Coins</DialogTitle>
            <DialogDescription>
              1 coin = $0.02. Minimum deposit is 500 coins ($10). Coins fund mission rewards for students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-2 sm:grid-cols-2">
            {DEPOSIT_OPTIONS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(amt)}
                className={`rounded-lg border py-3 text-sm font-medium transition-colors ${
                  depositAmount === amt
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-[var(--border)] text-muted-foreground hover:border-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)]'
                }`}
              >
                {amt.toLocaleString()} coins
                <span className="block text-sm md:text-xs opacity-60">${(amt * 0.02).toFixed(0)}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={handleDeposit} disabled={depositing}>
              {depositing ? 'Redirecting…' : `Pay $${(depositAmount * 0.02).toFixed(0)} via Stripe`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction history */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Transaction History</h4>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[color:color-mix(in_srgb,var(--text-primary)_5%,transparent)]">
                <div>
                  <span className="capitalize text-sm md:text-xs text-muted-foreground">{tx.type}</span>
                  {tx.note && <p className="text-sm md:text-xs text-muted-foreground truncate max-w-xs">{tx.note}</p>}
                </div>
                <div className="text-right">
                  <span className={tx.to_id === user?.id ? 'text-green-400' : 'text-red-400'}>
                    {tx.to_id === user?.id ? '+' : '-'}{tx.amount}
                  </span>
                  <p className="text-sm md:text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Analytics ────────────────────────────────────────────────────────────
function AnalyticsTab({ guild }) {
  const [stats, setStats] = useState(null);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guild) return;
    async function load() {
      setLoading(true);
      // Total submissions and avg star rating
      const { data: assignments } = await supabase
        .from('mission_assignments')
        .select('status, star_rating, user_id, profiles(name, xp, rank)')
        .eq('guild_id', guild.id);

      const all = assignments ?? [];
      const approved = all.filter(a => a.status === 'approved');
      const rated = approved.filter(a => a.star_rating);
      const avgStar = rated.length > 0
        ? (rated.reduce((s, a) => s + a.star_rating, 0) / rated.length).toFixed(1)
        : 'N/A';

      const { data: missions } = await supabase
        .from('guild_missions')
        .select('id, status')
        .eq('guild_id', guild.id);

      const published = (missions ?? []).filter(m => m.status === 'published').length;
      const completionRate = published > 0
        ? Math.round((approved.length / published) * 100)
        : 0;

      // Top students by star rating
      const byUser = {};
      approved.forEach(a => {
        if (!a.user_id) return;
        if (!byUser[a.user_id]) byUser[a.user_id] = { name: a.profiles?.name ?? a.user_id, count: 0, stars: 0 };
        byUser[a.user_id].count += 1;
        byUser[a.user_id].stars += a.star_rating ?? 0;
      });
      const sorted = Object.values(byUser)
        .map(u => ({ ...u, avg: u.count > 0 ? (u.stars / u.count).toFixed(1) : 0 }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

      setStats({
        totalSubmissions: all.length,
        approvedSubmissions: approved.length,
        avgStar,
        completionRate,
        publishedMissions: published,
      });
      setTopStudents(sorted);
      setLoading(false);
    }
    load();
  }, [guild]);

  if (!guild) return <p className="text-muted-foreground text-sm">Create your guild first.</p>;
  if (loading) return <div className="space-y-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  const statCards = [
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: ClipboardList },
    { label: 'Approved', value: stats.approvedSubmissions, icon: CheckCircle },
    { label: 'Avg Star Rating', value: stats.avgStar === 'N/A' ? '—' : `${stats.avgStar}★`, icon: Star },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-[var(--va-surface)] border-[var(--va-border)]">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm md:text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-orange" /> Top Performing Students
        </h4>
        {topStudents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {topStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                <span className="w-5 text-muted-foreground font-mono text-sm md:text-xs">#{i + 1}</span>
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-brand-orange">{s.avg}★</span>
                <span className="text-muted-foreground text-sm md:text-xs">{s.count} approved</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CompanyDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [guild, setGuild] = useState(null);
  const [loadingGuild, setLoadingGuild] = useState(true);
  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    if (!user) return;
    // Only company accounts may use this page
    if (user.role !== 'company' && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    async function loadGuild() {
      setLoadingGuild(true);
      const { data } = await supabase
        .from('guilds')
        .select('*')
        .eq('company_id', user.id)
        .eq('type', 'company')
        .maybeSingle();
      setGuild(data ?? null);
      setLoadingGuild(false);
    }
    loadGuild();
  }, [user, navigate]);

  if (!user || loadingGuild) {
    return <CompanyDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <h1 className="text-xl font-bold">Company Dashboard</h1>
        {guild && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Managing <span className="text-foreground font-medium">{guild.name}</span>
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="border-b border-[var(--border)] px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'setup' && (
              <GuildSetupTab guild={guild} onGuildCreated={g => { setGuild(g); setActiveTab('missions'); }} />
            )}
            {activeTab === 'missions' && <MissionsTab guild={guild} />}
            {activeTab === 'submissions' && <SubmissionsTab guild={guild} />}
            {activeTab === 'applications' && <ApplicationsTab guild={guild} />}
            {activeTab === 'wallet' && <WalletTab guild={guild} />}
            {activeTab === 'analytics' && <AnalyticsTab guild={guild} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
