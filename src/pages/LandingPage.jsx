import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronRight,
  Crown,
  FolderKanban,
  Heart,
  Mic2,
  Palette,
  SearchCheck,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  Cpu,
} from "lucide-react";
import { AuthContext } from "../App";
import { TRACKS } from "../data/tracksData";

const FLOW_STEPS = [
  {
    title: "Study",
    eyebrow: "Daily loop",
    body: "Use focused study tools to build momentum, streaks, and consistency.",
  },
  {
    title: "Earn XP",
    eyebrow: "Proof of effort",
    body: "Every session turns into XP, tier progression, and visible career signal.",
  },
  {
    title: "Get Briefs",
    eyebrow: "Unlock work",
    body: "Your level opens track-specific briefs that feel closer to real client work.",
  },
  {
    title: "Build Projects",
    eyebrow: "Ship things",
    body: "Create in the tools you already use, then submit the final link back to Visionary Arc.",
  },
  {
    title: "Portfolio",
    eyebrow: "Auto-generated",
    body: "Each finished project becomes a polished artifact on your public portfolio.",
  },
  {
    title: "Get Discovered",
    eyebrow: "Career acceleration",
    body: "Top student builders rise faster, stand out earlier, and get noticed by companies.",
  },
];

const SOCIAL_STATS = [
  { label: "Students joined", value: "12,480+" },
  { label: "Projects built", value: "38,200+" },
  { label: "Companies watching", value: "140+" },
];

const SOCIAL_PROOF = [
  {
    title: "Real signal, not empty streaks",
    body: "XP is tied to studying, briefs, shipped work, and portfolio proof students can actually show.",
  },
  {
    title: "Built for discovery",
    body: "Students do the work, portfolios update automatically, and company-side visibility grows with execution.",
  },
  {
    title: "Momentum compounds",
    body: "Daily effort unlocks better briefs, stronger artifacts, better portfolios, and more attention over time.",
  },
];

const FOUNDER_TIERS = [
  { name: "Seed", price: "$19", perk: "Early access + first XP boost" },
  { name: "Bronze", price: "$39", perk: "Priority brief drops + profile flair" },
  { name: "Silver", price: "$79", perk: "Discovery boosts + portfolio upgrades" },
  { name: "Gold", price: "$149", perk: "Top-tier visibility + founder perks" },
];

const ICON_MAP = {
  Cpu,
  Palette,
  TrendingUp,
  Mic2,
  Heart,
};

function RevealSection({ id, className = "", children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const primaryCta = () => navigate(user ? "/dashboard" : "/auth");
  const secondaryCta = () =>
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0F] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,114,42,0.22)_0%,rgba(232,114,42,0.08)_35%,transparent_72%)]" />
        <div className="absolute -left-28 top-[28rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,transparent_72%)] blur-2xl" />
        <div className="absolute -right-24 top-[50rem] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14)_0%,transparent_72%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.12]" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_0_30px_rgba(232,114,42,0.15)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-[Clash_Display] text-lg tracking-wide">Visionary Arc</p>
              <p className="font-[Satoshi] text-xs uppercase tracking-[0.24em] text-white/40">Student career accelerator</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/pricing"
              className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 font-[Satoshi] text-sm text-white/70 transition-colors hover:text-white sm:inline-flex"
            >
              Founder Pass
            </Link>
            <button
              type="button"
              onClick={primaryCta}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 font-[Satoshi] text-sm font-semibold text-black shadow-[0_0_28px_rgba(232,114,42,0.35)] transition-transform hover:-translate-y-0.5"
            >
              {user ? "Open dashboard" : "Start free"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2 font-[Satoshi] text-sm text-[var(--accent)]">
              <Zap className="h-4 w-4" />
              Where students build projects and get discovered
            </div>

            <h1 className="mt-6 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl font-[Clash_Display]">
              Turn student effort into
              <span className="block bg-[linear-gradient(90deg,#FFFFFF_0%,#FDBA74_45%,#E8722A_100%)] bg-clip-text text-transparent">
                career proof.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl font-[Satoshi] text-lg leading-8 text-white/72 sm:text-xl">
              Earn XP by studying, unlock real project briefs, build portfolio-ready work, and rise high enough to get discovered by companies before graduation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={primaryCta}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 font-[Satoshi] text-sm font-semibold text-black shadow-[0_0_30px_rgba(232,114,42,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Start building now
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={secondaryCta}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-[Satoshi] text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                See how it works
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: <Zap className="h-4 w-4 text-yellow-300" />, label: "XP-backed momentum" },
                { icon: <FolderKanban className="h-4 w-4 text-blue-300" />, label: "Auto-built portfolio" },
                { icon: <SearchCheck className="h-4 w-4 text-emerald-300" />, label: "Company visibility" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl"
                >
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    {item.icon}
                  </div>
                  <p className="font-[Satoshi] text-sm text-white/78">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(145deg,rgba(232,114,42,0.18),rgba(59,130,246,0.08),rgba(255,255,255,0.02))] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.24em] text-white/40">Career signal</p>
                  <p className="mt-1 font-[Clash_Display] text-2xl">Builder profile</p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-[Satoshi] text-xs text-emerald-300">
                  Companies watching
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.22em] text-white/40">This week</p>
                  <p className="mt-2 flex items-center gap-2 font-[Clash_Display] text-3xl text-[var(--accent)]">
                    <Trophy className="h-6 w-6" />
                    420 XP
                  </p>
                  <p className="mt-2 font-[Satoshi] text-sm text-white/60">Enough to unlock another brief and move your profile higher.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.22em] text-white/40">Portfolio</p>
                  <p className="mt-2 flex items-center gap-2 font-[Clash_Display] text-3xl">
                    <Briefcase className="h-6 w-6 text-blue-300" />
                    6 projects
                  </p>
                  <p className="mt-2 font-[Satoshi] text-sm text-white/60">Real work across Tech, Design, Business, Content, and Impact tracks.</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-[Satoshi] text-xs uppercase tracking-[0.22em] text-white/40">Discovery feed</p>
                    <p className="mt-1 font-[Clash_Display] text-xl">Why students rise</p>
                  </div>
                  <Users className="h-5 w-5 text-white/45" />
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "Study streak converted into XP momentum",
                      value: "+85 XP today",
                      tone: "text-yellow-300",
                    },
                    {
                      label: "Brief unlocked in Tech track",
                      value: "AI product teardown",
                      tone: "text-blue-300",
                    },
                    {
                      label: "Portfolio artifact submitted",
                      value: "Landing page redesign",
                      tone: "text-emerald-300",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <p className="max-w-[70%] font-[Satoshi] text-sm text-white/70">{item.label}</p>
                      <span className={`font-[Satoshi] text-sm font-semibold ${item.tone}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <RevealSection id="how-it-works" className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl sm:p-8">
          <div className="max-w-2xl">
            <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/40">How it works</p>
            <h2 className="mt-3 font-[Clash_Display] text-3xl sm:text-4xl">
              A six-step loop from school effort to career visibility.
            </h2>
            <p className="mt-3 font-[Satoshi] text-base text-white/64">
              Visionary Arc is not a study app with points on top. It is a system that turns discipline into artifacts, artifacts into portfolios, and portfolios into discovery.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-6">
            {FLOW_STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="absolute right-4 top-4 font-[Clash_Display] text-4xl leading-none text-white/8">
                  0{index + 1}
                </div>
                <p className="font-[Satoshi] text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 font-[Clash_Display] text-xl">{step.title}</h3>
                <p className="mt-3 font-[Satoshi] text-sm leading-6 text-white/65">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/40">Career tracks</p>
              <h2 className="mt-3 font-[Clash_Display] text-3xl sm:text-4xl">Choose a lane. Build proof fast.</h2>
            </div>
            <Link
              to={user ? "/tracks" : "/auth"}
              className="inline-flex items-center gap-2 font-[Satoshi] text-sm text-white/70 transition-colors hover:text-white"
            >
              Explore all tracks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {TRACKS.map((track, index) => {
              const Icon = ICON_MAP[track.icon] ?? Cpu;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 ${track.colors.bg} p-5 backdrop-blur-xl`}
                >
                  <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 ${track.colors.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-[Satoshi] text-xs uppercase tracking-[0.22em] text-white/45">Track</p>
                  <h3 className="mt-2 font-[Clash_Display] text-2xl">{track.name}</h3>
                  <p className={`mt-2 font-[Satoshi] text-sm ${track.colors.text}`}>{track.tagline}</p>
                  <p className="mt-4 font-[Satoshi] text-sm leading-6 text-white/68">{track.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {track.skills.slice(0, 2).map((skill) => (
                      <span key={skill} className={`rounded-full px-2.5 py-1 font-[Satoshi] text-[11px] ${track.colors.badge}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/40">Social proof</p>
              <h2 className="mt-3 font-[Clash_Display] text-3xl sm:text-4xl">Students need more than motivation. They need signal.</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 font-[Satoshi] text-sm text-white/65">
              <Building2 className="h-4 w-4 text-[var(--accent)]" />
              Placeholder launch metrics
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SOCIAL_STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="font-[Clash_Display] text-4xl text-[var(--accent)]">{stat.value}</p>
                <p className="mt-2 font-[Satoshi] text-sm text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {SOCIAL_PROOF.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-[Clash_Display] text-xl">{item.title}</h3>
                <p className="mt-3 font-[Satoshi] text-sm leading-6 text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--accent)]/20 bg-[linear-gradient(135deg,rgba(232,114,42,0.16),rgba(255,255,255,0.04),rgba(10,10,15,0.85))] p-6 backdrop-blur-2xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-black/20 px-4 py-2 font-[Satoshi] text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                <Crown className="h-4 w-4" />
                Founder Pass
              </div>
              <h2 className="mt-4 font-[Clash_Display] text-3xl sm:text-4xl">
                Pick a tier. Accelerate your momentum and discovery.
              </h2>
              <p className="mt-4 max-w-xl font-[Satoshi] text-base leading-7 text-white/70">
                Founder tiers preview the paid layer: stronger boosts, profile advantages, and earlier access for students who want to move faster.
              </p>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 font-[Satoshi] text-sm font-semibold text-black shadow-[0_0_26px_rgba(232,114,42,0.32)] transition-transform hover:-translate-y-0.5"
              >
                View Founder Pass
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FOUNDER_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl"
                >
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.22em] text-white/40">{tier.name}</p>
                  <p className="mt-2 font-[Clash_Display] text-3xl">{tier.price}</p>
                  <p className="mt-3 font-[Satoshi] text-sm leading-6 text-white/62">{tier.perk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[Clash_Display] text-lg">Visionary Arc</p>
            <p className="mt-1 font-[Satoshi] text-sm text-white/50">
              © {new Date().getFullYear()} Build real projects. Get discovered.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 font-[Satoshi] text-sm text-white/62">
            <Link to="/pricing" className="transition-colors hover:text-white">Founder Pass</Link>
            <Link to={user ? "/dashboard" : "/auth"} className="transition-colors hover:text-white">Get started</Link>
            <Link to="/tracks" className="transition-colors hover:text-white">Career tracks</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
