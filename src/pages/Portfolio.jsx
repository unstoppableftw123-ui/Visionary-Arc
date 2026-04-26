import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Star, Pin, Download, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../App';
import { TRACK_ICONS, RANK_COLORS } from '../styles/ranks';
import { getTrack } from '../data/tracksData';

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DIFF_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

function DiffBadge({ diff }) {
  const cfg = RANK_COLORS[diff];
  if (!cfg) return null;
  return (
    <span
      className="text-sm md:text-[11px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: cfg.color, borderColor: cfg.color, background: cfg.glow }}
    >
      {diff} · {cfg.label}
    </span>
  );
}

// ── Star rating display ───────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          fill={i < (rating ?? 0) ? 'var(--accent)' : 'none'}
          color={i < (rating ?? 0) ? 'var(--accent)' : '#6B7280'}
        />
      ))}
    </div>
  );
}

// ── Portfolio card ────────────────────────────────────────────────────────────
function PortfolioCard({ entry, isOwn, onToggleFeatured }) {
  const track  = getTrack(entry.track ?? '');
  const colors = track?.colors ?? {
    bg: 'bg-primary/10', text: 'text-primary',
    badge: 'bg-primary/20 text-primary', border: 'border-primary',
  };
  const trackIcon = TRACK_ICONS[entry.track] ?? '📁';

  const completedDate = entry.completed_at
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
        new Date(entry.completed_at)
      )
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative rounded-2xl border border-border bg-card overflow-hidden border-l-4 ${colors.border}`}
    >
      {/* Featured pin */}
      {entry.is_featured && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <Pin className="w-4 h-4 text-brand-orange fill-brand-orange" />
        </div>
      )}

      {/* Header */}
      <div className={`px-4 py-3 ${colors.bg}`}>
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">{trackIcon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm md:text-[11px] font-semibold uppercase tracking-wide ${colors.text}`}>
              {track?.name ?? entry.track}
            </p>
            <h3 className="font-bold text-foreground leading-snug line-clamp-1">{entry.title}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        {entry.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {entry.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 items-center">
          {entry.difficulty && <DiffBadge diff={entry.difficulty} />}
          {entry.guild_name && (
            <span className="text-sm md:text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {entry.guild_name}
            </span>
          )}
        </div>

        {entry.star_rating > 0 && <Stars rating={entry.star_rating} />}

        <div className="flex items-center justify-between pt-0.5">
          {completedDate && (
            <span className="text-sm md:text-[11px] text-muted-foreground">{completedDate}</span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {isOwn && (
              <button
                type="button"
                onClick={() => onToggleFeatured(entry)}
                title={entry.is_featured ? 'Unpin' : 'Pin to top (max 3)'}
                className={`text-sm md:text-[11px] flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
                  entry.is_featured
                    ? 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pin className="w-3 h-3" />
                {entry.is_featured ? 'Pinned' : 'Pin'}
              </button>
            )}
            {entry.submission_url && (
              <a
                href={entry.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm md:text-[11px] font-medium flex items-center gap-1 ${colors.text} hover:opacity-80`}
              >
                View Work <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm md:text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
      }`}
    >
      {label}
    </button>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { username } = useParams();
  const { user: currentUser } = useContext(AuthContext);

  const [profile,  setProfile]  = useState(null);
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [exporting, setExporting] = useState(false);

  const [trackFilter, setTrackFilter] = useState(null);
  const [diffFilter,  setDiffFilter]  = useState(null);
  const [guildFilter, setGuildFilter] = useState(null);
  const [sort,        setSort]        = useState('newest');

  const isOwn = currentUser && profile && currentUser.id === profile.id;

  // ── Fetch profile by username ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      // username field in profiles
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', username)
        .single();

      if (profErr || !prof) {
        setLoading(false);
        return;
      }
      setProfile(prof);

      const { data: rows } = await supabase
        .from('portfolio_entries')
        .select('*')
        .eq('user_id', prof.id)
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      setEntries(rows ?? []);
      setLoading(false);
    }
    if (username) load();
  }, [username]);

  // ── Derived filter options ──
  const allTracks = [...new Set(entries.map((e) => e.track).filter(Boolean))];
  const allDiffs  = DIFF_ORDER.filter((d) => entries.some((e) => e.difficulty === d));
  const allGuilds = [...new Set(entries.map((e) => e.guild_name).filter(Boolean))];

  // ── Filtered + sorted entries ──
  const displayed = entries
    .filter((e) => !trackFilter || e.track === trackFilter)
    .filter((e) => !diffFilter  || e.difficulty === diffFilter)
    .filter((e) => !guildFilter || e.guild_name === guildFilter)
    .sort((a, b) => {
      if (sort === 'newest')  return new Date(b.completed_at ?? b.created_at) - new Date(a.completed_at ?? a.created_at);
      if (sort === 'stars')   return (b.star_rating ?? 0) - (a.star_rating ?? 0);
      if (sort === 'hardest') return DIFF_ORDER.indexOf(b.difficulty ?? 'E') - DIFF_ORDER.indexOf(a.difficulty ?? 'E');
      return 0;
    });

  // ── Featured toggle (max 3) ──
  const handleToggleFeatured = async (entry) => {
    if (!isOwn) return;
    const currentlyFeatured = entries.filter((e) => e.is_featured).length;

    if (!entry.is_featured && currentlyFeatured >= 3) {
      toast.error('You can only pin up to 3 entries. Unpin one first.');
      return;
    }

    const newVal = !entry.is_featured;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_featured: newVal } : e))
    );

    const { error } = await supabase
      .from('portfolio_entries')
      .update({ is_featured: newVal })
      .eq('id', entry.id)
      .eq('user_id', currentUser.id);

    if (error) {
      toast.error('Could not update pin.');
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_featured: entry.is_featured } : e))
      );
    }
  };

  // ── PDF export ──
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      let y = 18;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(profile?.name ?? 'Portfolio', pageW / 2, y, { align: 'center' });
      y += 7;

      if (profile?.school || profile?.grade) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        const meta = [profile.school, profile.grade ? `Grade ${profile.grade}` : null]
          .filter(Boolean)
          .join(' · ');
        doc.text(meta, pageW / 2, y, { align: 'center' });
        y += 5;
      }

      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(`${profile?.xp ?? 0} XP · ${displayed.length} project${displayed.length !== 1 ? 's' : ''}`, pageW / 2, y, { align: 'center' });
      y += 8;

      // Divider
      doc.setDrawColor(200);
      doc.line(14, y, pageW - 14, y);
      y += 6;

      // Entries
      for (const entry of displayed) {
        if (y > 260) {
          doc.addPage();
          y = 18;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(entry.title ?? 'Untitled', 14, y);
        y += 5;

        const meta = [
          entry.track ? `Track: ${entry.track}` : null,
          entry.difficulty ? `Difficulty: ${entry.difficulty}` : null,
          entry.guild_name ? `Guild: ${entry.guild_name}` : null,
          entry.star_rating ? `Stars: ${'★'.repeat(entry.star_rating)}` : null,
        ].filter(Boolean).join('  ·  ');

        if (meta) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100);
          doc.text(meta, 14, y);
          y += 5;
        }

        if (entry.description) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60);
          const lines = doc.splitTextToSize(entry.description, pageW - 28);
          doc.text(lines, 14, y);
          y += lines.length * 4 + 2;
        }

        if (entry.submission_url) {
          doc.setFontSize(8);
          doc.setTextColor(59, 130, 246);
          doc.text(entry.submission_url, 14, y);
          y += 5;
        }

        if (entry.completed_at) {
          doc.setFontSize(8);
          doc.setTextColor(130);
          doc.text(
            new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(entry.completed_at)),
            14, y
          );
          y += 5;
        }

        y += 4;
        doc.setDrawColor(230);
        doc.line(14, y, pageW - 14, y);
        y += 5;
      }

      doc.save(`${profile?.name ?? 'portfolio'}-portfolio.pdf`);
    } catch (err) {
      toast.error('PDF export failed.');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <Skeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        User not found.
      </div>
    );
  }

  const initials = profile.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="min-h-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row gap-4 items-start"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0 overflow-hidden">
          {profile.avatar
            ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">{profile.name}</h1>
          {(profile.school || profile.grade) && (
            <p className="text-sm text-muted-foreground">
              {[profile.school, profile.grade ? `Grade ${profile.grade}` : null].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="text-sm md:text-xs text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{profile.xp?.toLocaleString() ?? 0}</span> XP
            {' · '}
            <span className="font-semibold text-foreground">{entries.length}</span> project{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={exporting || entries.length === 0}
          className="shrink-0 flex items-center gap-1.5 text-sm md:text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Export PDF
        </button>
      </motion.div>

      {/* Filters + sort */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {allTracks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Pill label="All Tracks" active={!trackFilter} onClick={() => setTrackFilter(null)} />
              {allTracks.map((t) => (
                <Pill key={t} label={`${TRACK_ICONS[t] ?? ''} ${t}`} active={trackFilter === t} onClick={() => setTrackFilter(t)} />
              ))}
            </div>
          )}
          {allDiffs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Pill label="All Difficulty" active={!diffFilter} onClick={() => setDiffFilter(null)} />
              {allDiffs.map((d) => (
                <Pill key={d} label={`${d} · ${RANK_COLORS[d]?.label}`} active={diffFilter === d} onClick={() => setDiffFilter(d)} />
              ))}
            </div>
          )}
          {allGuilds.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Pill label="All Guilds" active={!guildFilter} onClick={() => setGuildFilter(null)} />
              {allGuilds.map((g) => (
                <Pill key={g} label={g} active={guildFilter === g} onClick={() => setGuildFilter(g)} />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {[
              { key: 'newest', label: 'Newest' },
              { key: 'stars',  label: 'Highest Rated' },
              { key: 'hardest', label: 'Hardest First' },
            ].map(({ key, label }) => (
              <Pill key={key} label={label} active={sort === key} onClick={() => setSort(key)} />
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {displayed.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((entry) => (
              <PortfolioCard
                key={entry.id}
                entry={entry}
                isOwn={isOwn}
                onToggleFeatured={handleToggleFeatured}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : entries.length > 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No entries match the current filters.
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
            <FolderOpen className="h-10 w-10" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              {isOwn ? 'Your portfolio is empty' : 'No public projects yet'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isOwn
                ? 'Complete and submit a mission to auto-populate your portfolio.'
                : 'This student has not published any portfolio entries yet.'}
            </p>
          </div>
          {isOwn && (
            <Link
              to="/missions"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Browse Missions →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
