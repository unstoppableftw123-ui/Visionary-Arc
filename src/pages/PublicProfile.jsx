import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { supabase } from "../services/supabaseClient";
import { getPortfolio } from "../services/db";
import { getTrack } from "../data/tracksData";
import ProfileCard from "../components/ProfileCard";

// ── Portfolio card (read-only, no edit controls) ────────────────────────────
function PublicPortfolioCard({ entry }) {
  const track = getTrack(entry.track ?? "");
  const colors = track?.colors ?? {
    bg: "bg-primary/10",
    text: "text-primary",
    badge: "bg-primary/20 text-primary",
    border: "border-primary",
  };

  const completedDate = entry.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
        new Date(entry.created_at)
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border bg-card overflow-hidden border-l-4 ${colors.border}`}
    >
      <div className={`px-5 py-4 ${colors.bg}`}>
        <p className={`text-sm md:text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text}`}>
          {track?.name ?? entry.track}
        </p>
        <h3 className="font-bold text-foreground leading-snug">{entry.title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{entry.role}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}
        {entry.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.skills.map((s) => (
              <span
                key={s}
                className={`text-sm md:text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          {completedDate && (
            <span className="text-sm md:text-xs text-muted-foreground">{completedDate}</span>
          )}
          {entry.submission_url && (
            <a
              href={entry.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm md:text-xs font-medium text-primary hover:underline"
            >
              View Project <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profileHidden, setProfileHidden] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      try {
        let profileData = null;
        let error = null;

        const byId = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();
        profileData = byId.data;
        error = byId.error;

        if (error || !profileData) {
          const byUsername = await supabase
            .from("profiles")
            .select("*")
            .eq("username", id)
            .single();
          profileData = byUsername.data;
          error = byUsername.error;
        }

        if (error || !profileData) {
          setNotFound(true);
          return;
        }

        if ((profileData?.xp ?? 0) < 500) {
          setProfileHidden(true);
          return;
        }

        setProfile(profileData);
        const { data: port } = await getPortfolio(profileData.id);
        setPortfolio((port ?? []).filter((e) => e.is_public === true));

        const { data: guildData } = await supabase
          .from("guild_members")
          .select("guilds(name, emoji, color)")
          .eq("user_id", profileData.id);
        setGuilds(
          (guildData ?? []).map((r) => r.guilds).filter(Boolean)
        );
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Inject OG meta tags
  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.name} — Visionary Arc`;
    const setMeta = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("og:title", `${profile.name} on Visionary Arc`);
    setMeta(
      "og:description",
      `${profile.name} has ${profile.xp ?? 0} XP and ${portfolio.length} portfolio projects. Join Visionary Arc!`
    );
    setMeta("og:url", window.location.href);
  }, [profile, portfolio.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-10">
          <div className="flex justify-center">
            <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-white/5" />
              <div className="h-6 w-48 rounded bg-white/5" />
              <div className="h-4 w-36 rounded bg-white/5" />
              <div className="grid w-full gap-3 sm:grid-cols-3">
                <div className="h-20 rounded-xl bg-white/5" />
                <div className="h-20 rounded-xl bg-white/5" />
                <div className="h-20 rounded-xl bg-white/5" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
                <div className="h-20 rounded-xl bg-white/5" />
                <div className="mt-4 h-5 w-40 rounded bg-white/5" />
                <div className="mt-2 h-4 w-28 rounded bg-white/5" />
                <div className="mt-4 h-4 w-full rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 text-center px-4">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="text-muted-foreground">This Visionary Arc profile doesn't exist or is private.</p>
        <Link to="/">
          <Button>Go to Visionary Arc</Button>
        </Link>
      </div>
    );
  }

  if (profileHidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 text-center px-4">
        <h1 className="text-2xl font-bold">Profile locked</h1>
        <p className="text-muted-foreground">This student unlocks public profiles at Builder tier (500 XP).</p>
        <Link to="/auth">
          <Button>Join Visionary Arc</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header branding */}
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Visionary Arc
          </Link>
        </div>

        {/* Profile card — view-only mode */}
        <div className="flex justify-center">
          <ProfileCard profile={profile} guilds={guilds} viewOnly />
        </div>

        {/* Portfolio gallery */}
        {portfolio.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Portfolio</h2>
            <div className="grid grid-cols-1 gap-4">
              {portfolio.map((entry) => (
                <PublicPortfolioCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* CTA for non-logged-in viewers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-8 text-center space-y-4"
        >
          <h3 className="text-xl font-bold">Build your own career portfolio</h3>
          <p className="text-muted-foreground text-sm">
            Earn XP by studying, complete real-world projects, and get discovered by companies — all on Visionary Arc.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Join for free <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
