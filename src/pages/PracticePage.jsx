import { useState, useCallback, useMemo, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
  Flame,
  Star,
  Trophy,
  Target,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ChevronUp,
} from "lucide-react";
import { SUBJECTS, LEADERBOARD, USER_STATS } from "../data/mockPracticeData";
import { AuthContext } from "../App";
import apiService from "../services/apiService";
import { checkAndAwardBadges, showBadgeUnlockToast } from "../lib/badges";
import { awardActivityXP } from "../services/xpService";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0f0f13";
const CARD_BG = "#1a1a24";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#fbbf24";

const MASTERY_CONFIG = {
  Struggling:  { bg: "rgba(239,68,68,0.18)",   text: "#f87171",  label: "Struggling"  },
  Practicing:  { bg: "rgba(234,179,8,0.18)",   text: "#fbbf24",  label: "Practicing"  },
  Proficient:  { bg: "rgba(34,197,94,0.18)",   text: "#4ade80",  label: "Proficient"  },
  Mastered:    { bg: "rgba(220,95,20,0.18)",  text: "#a78bfa",  label: "Mastered"    },
};

const GRADE_LEVELS = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function CircularProgressRing({ pct, color, size = 52, strokeWidth = 4 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={BORDER} strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function Sparkline({ data, color }) {
  const w = 80, h = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#sg-${color.replace("#","")})`}
        stroke="none"
      />
    </svg>
  );
}

function MasteryBadge({ level, small = false }) {
  const cfg = MASTERY_CONFIG[level] || MASTERY_CONFIG.Practicing;
  return (
    <span
      style={{ background: cfg.bg, color: cfg.text }}
      className={`rounded-full font-semibold ${small ? "text-sm md:text-[10px] px-2 py-0.5" : "text-sm md:text-xs px-2.5 py-1"}`}
    >
      {cfg.label}
    </span>
  );
}

function StarRating({ rating, max = 5, color }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={{ color: i < rating ? GOLD : "rgba(255,255,255,0.15)", fill: i < rating ? GOLD : "rgba(255,255,255,0.1)" }}
        />
      ))}
    </div>
  );
}

// Confetti burst on correct answer
const CONFETTI_COLORS = ["#e8722a", "#e8722a", "#10b981", "#f43f5e", "#3b82f6", "#f97316"];
function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: (Math.random() - 0.5) * 320,
        y: -(80 + Math.random() * 160),
        rot: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        isCircle: Math.random() > 0.5,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-20">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 8,
            height: 8,
            borderRadius: p.isCircle ? "50%" : "2px",
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: p.scale, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale * 0.3, rotate: p.rot }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ── Left Subject Sidebar ───────────────────────────────────────────────────────
function SubjectSidebar({
  subjects,
  selectedSubjectId,
  selectedTopicId,
  expandedSubjects,
  onToggleSubject,
  onSelectTopic,
  userStats,
  focusTopicIds = [],
}) {
  const totalXP = subjects.reduce((acc, s) =>
    acc + s.topics.reduce((ta, t) =>
      ta + t.skills.reduce((sa, sk) => sa + sk.xpEarned, 0), 0), 0);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: 220, minWidth: 220, borderRight: `1px solid ${BORDER}`, background: BG }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-base font-bold text-[var(--text-primary)]">Practice</span>
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm md:text-xs font-bold"
          style={{ background: "rgba(251,191,36,0.15)", color: GOLD }}
        >
          <Zap className="w-3 h-3" />
          {totalXP.toLocaleString()} XP
        </span>
      </div>

      {/* Subject tree */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
        {subjects.map((subject) => {
          const isExpanded = expandedSubjects[subject.id];
          const isSelectedSubject = selectedSubjectId === subject.id;
          return (
            <div key={subject.id}>
              {/* Subject row */}
              <button
                onClick={() => onToggleSubject(subject.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-[var(--va-surface)] rounded-lg mx-1"
                style={{ width: "calc(100% - 8px)" }}
              >
                {/* Icon + ring */}
                <div className="relative shrink-0">
                  <CircularProgressRing pct={subject.mastery} color={subject.color} size={36} strokeWidth={3} />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-sm"
                    style={{ transform: "rotate(0deg)" }}
                  >
                    {subject.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-xs font-semibold text-[color:color-mix(in_srgb,var(--text-primary)_90%,transparent)] truncate pr-1">
                      {subject.name}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] shrink-0" />
                    )}
                  </div>
                  <div className="text-sm md:text-[10px] text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] mt-0.5">{subject.mastery}% mastery</div>
                </div>
              </button>

              {/* Topics list */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1">
                      {subject.topics.map((topic) => {
                        const isActive = selectedTopicId === topic.id && isSelectedSubject;
                        const isLocked = topic.locked;
                        return (
                          <button
                            key={topic.id}
                            disabled={isLocked}
                            onClick={() => !isLocked && onSelectTopic(subject.id, topic.id)}
                            className={`w-full flex items-center gap-2 pl-12 pr-3 py-1.5 text-left text-sm md:text-xs transition-all relative ${
                              isLocked
                                ? "opacity-40 cursor-not-allowed"
                                : isActive
                                ? "text-[var(--text-primary)]"
                                : "text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] hover:text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)]"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeTopic"
                                className="absolute inset-0 rounded-r-lg"
                                style={{ background: `${subject.color}20`, boxShadow: `inset 3px 0 0 ${subject.color}` }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                            {isLocked ? (
                              <Lock className="w-3 h-3 shrink-0 relative z-10" />
                            ) : (
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0 relative z-10"
                                style={{ background: isActive ? subject.color : "rgba(255,255,255,0.2)" }}
                              />
                            )}
                            <span className="flex-1 truncate relative z-10">{topic.name}</span>
                            {!isLocked && focusTopicIds.includes(`${subject.id}:${topic.id}`) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold relative z-10" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                                Focus
                              </span>
                            )}
                            {!isLocked && (
                              <span className="text-sm md:text-[10px] relative z-10" style={{ color: isActive ? subject.color : "inherit" }}>
                                {topic.progress}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer: daily goal + streak */}
      <div className="px-4 py-3 space-y-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
        {/* Daily goal */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-[10px] text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] flex items-center gap-1">
              <Target className="w-3 h-3" /> Daily Goal
            </span>
            <span className="text-sm md:text-[10px] font-semibold text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">
              {userStats.todayQuestions}/{userStats.dailyGoal}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #8b5cf6, #6d28d9)" }}
              initial={{ width: 0 }}
              animate={{ width: `${(userStats.todayQuestions / userStats.dailyGoal) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Flame className="w-4 h-4 text-orange-400" fill="#fb923c" />
          </motion.div>
          <span className="text-sm md:text-xs font-semibold text-orange-300">{userStats.streak} day streak</span>
        </div>
      </div>
    </div>
  );
}

// ── Skill Card ─────────────────────────────────────────────────────────────────
function SkillCard({ skill, subjectColor, onPractice, liveMastery }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((skill.xpEarned / skill.xpMax) * 100);
  const masteryLevel = liveMastery?.level || skill.masteryLevel;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-xl p-4 flex flex-col gap-3 cursor-pointer overflow-hidden"
      style={{
        background: CARD_BG,
        border: `1px solid ${hovered ? `${subjectColor}40` : BORDER}`,
        boxShadow: hovered ? `0 0 20px ${subjectColor}18, inset 0 0 20px ${subjectColor}08` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Subtle top gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: hovered ? `linear-gradient(90deg, transparent, ${subjectColor}60, transparent)` : "transparent", transition: "background 0.3s" }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{skill.name}</h3>
        <MasteryBadge level={masteryLevel} small />
      </div>

      {/* XP + sparkline */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm md:text-[10px] text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] mb-0.5">XP Progress</div>
          <div className="text-sm md:text-xs font-bold" style={{ color: subjectColor }}>
            {skill.xpEarned} <span className="text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)] font-normal">/ {skill.xpMax}</span>
          </div>
          {/* XP bar */}
          <div className="mt-1.5 w-20 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: subjectColor, transition: "width 0.6s ease" }}
            />
          </div>
        </div>
        <Sparkline data={skill.progressHistory} color={subjectColor} />
      </div>

      {/* Practice button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onPractice}
        className="w-full py-1.5 rounded-lg text-sm md:text-xs font-semibold text-[var(--text-primary)] transition-all"
        style={{
          background: hovered
            ? `linear-gradient(135deg, ${subjectColor}, ${subjectColor}cc)`
            : "rgba(255,255,255,0.06)",
          border: `1px solid ${hovered ? subjectColor : "rgba(255,255,255,0.1)"}`,
        }}
      >
        Practice →
      </motion.button>
    </motion.div>
  );
}

// ── Topic Grid ─────────────────────────────────────────────────────────────────
function TopicGrid({ topic, subject, onSelectSkill, masteryData, isFocusTopic }) {
  return (
    <motion.div
      key={`grid-${topic.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 rounded-sm" style={{ background: `linear-gradient(180deg, ${subject.color}, ${subject.gradientTo})` }} />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{topic.name}</h2>
          {isFocusTopic && (
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm md:text-[11px] font-bold"
              style={{ background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <AlertCircle className="w-3 h-3" /> Focus here
            </span>
          )}
        </div>
        <p className="text-sm text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] ml-4">
          {topic.skills.length} skills · {topic.progress}% complete
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topic.skills.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <SkillCard
              skill={skill}
              subjectColor={subject.color}
              onPractice={() => onSelectSkill(skill)}
              liveMastery={masteryData?.[skill.name]}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Question View ──────────────────────────────────────────────────────────────
function QuestionView({ skill, subject, onBack, masteryLevel, onAnswerRecorded }) {
  const questions = skill.questions;
  const [qIdx, setQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [xpAmount, setXPAmount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const coinsAwardedRef = useRef(false);
  const { user, setUser } = useContext(AuthContext);

  // Difficulty adjustment: trim MC options based on mastery
  const getVisibleOptions = useCallback((q) => {
    if (q.type !== "multiple_choice") return q.options;
    if (masteryLevel === "Struggling") {
      // Show only 2 options: correct answer + one distractor
      const correct = q.options.find(o => o === q.correctAnswer);
      const distractor = q.options.find(o => o !== q.correctAnswer);
      return [correct, distractor].filter(Boolean);
    }
    return q.options;
  }, [masteryLevel]);

  // Award coins once when the session (all questions) is complete
  useEffect(() => {
    if (submitted && qIdx >= questions.length - 1 && !coinsAwardedRef.current) {
      coinsAwardedRef.current = true;
      if (user?.id) {
        awardActivityXP(user.id, 'practice', null)
          .then((reward) => {
            if (!reward?.awarded) return;
            setUser((prev) => prev ? ({
              ...prev,
              xp: (prev.xp ?? 0) + reward.xpGained,
              coins: (prev.coins ?? 0) + reward.coinsGained,
            }) : prev);
          })
          .catch(() => {});
      }
      apiService.streaks.increment().catch(() => {});
    }
  }, [submitted, qIdx, questions.length, setUser, user?.id]);

  const q = questions[qIdx];
  const isCorrect = submitted &&
    (q.type === "multiple_choice"
      ? selectedAnswer === q.correctAnswer
      : fillAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase());

  const handleSubmit = useCallback(() => {
    if (!submitted && (selectedAnswer !== null || fillAnswer.trim())) {
      setSubmitted(true);
      const correct = q.type === "multiple_choice"
        ? selectedAnswer === q.correctAnswer
        : fillAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase();

      // Record answer for mastery tracking
      if (user?.user_id) {
        apiService.practice.recordAnswer(user.user_id, skill.name, correct).then(() => {
          if (onAnswerRecorded) onAnswerRecorded();
        }).catch(() => {});
        checkAndAwardBadges({
          user,
          stats: { level: user?.level, created_at: user?.created_at },
          onUserUpdate: setUser,
        }).then(({ unlocked }) => {
          unlocked.forEach(({ badge }) => showBadgeUnlockToast(badge));
        }).catch(() => {});
      }

      if (correct) {
        setSessionXP((p) => p + q.xpReward);
        setSessionCorrect((p) => p + 1);
        setXPAmount(q.xpReward);
        setShowXPPopup(true);
        setShowConfetti(true);
        setTimeout(() => setShowXPPopup(false), 2200);
        setTimeout(() => setShowConfetti(false), 1400);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }
  }, [submitted, selectedAnswer, fillAnswer, q, user, skill, onAnswerRecorded]);

  const handleNext = useCallback(() => {
    if (qIdx < questions.length - 1) {
      setQIdx((i) => i + 1);
      setSelectedAnswer(null);
      setFillAnswer("");
      setSubmitted(false);
      setShake(false);
    }
  }, [qIdx, questions.length]);

  const handleAnswer = (opt) => {
    if (!submitted) setSelectedAnswer(opt);
  };

  const getOptionStyle = (opt) => {
    if (!submitted) {
      return selectedAnswer === opt
        ? { border: `2px solid ${subject.color}`, background: `${subject.color}18`, color: "white" }
        : { border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)" };
    }
    if (opt === q.correctAnswer) {
      return { border: "2px solid #22c55e", background: "rgba(34,197,94,0.18)", color: "#4ade80" };
    }
    if (opt === selectedAnswer && opt !== q.correctAnswer) {
      return { border: "2px solid #ef4444", background: "rgba(239,68,68,0.18)", color: "#f87171" };
    }
    return { border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)" };
  };

  const LABELS = ["A", "B", "C", "D"];

  // TODO: Adaptive difficulty algorithm
  // After 3 correct in a row → auto increase difficulty
  // After 2 wrong in a row → auto decrease difficulty

  return (
    <motion.div
      key={`qview-${skill.id}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 max-w-2xl mx-auto w-full"
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Skills
        </button>
        <div className="flex-1 flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{skill.name}</span>
          <StarRating rating={q.difficulty} color={subject.color} />
        </div>
        <span className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">
          Question {qIdx + 1} of {questions.length}
        </span>
        {/* Session XP */}
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm md:text-xs font-bold"
          style={{ background: "rgba(251,191,36,0.12)", color: GOLD }}
        >
          <Zap className="w-3 h-3" /> +{sessionXP} XP this session
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background:
                i < qIdx
                  ? "#22c55e"
                  : i === qIdx
                  ? subject.color
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>

      {/* Question card */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        {/* Confetti */}
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

        {/* XP popup */}
        <AnimatePresence>
          {showXPPopup && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -40, scale: 1 }}
              exit={{ opacity: 0, y: -80, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-4 right-6 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold pointer-events-none"
              style={{ background: "rgba(251,191,36,0.2)", color: GOLD, boxShadow: `0 0 16px ${GOLD}40` }}
            >
              <Zap className="w-4 h-4" />
              +{xpAmount} XP
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-sm md:text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${subject.color}18`, color: subject.color }}
          >
            Level {q.difficulty} · {["", "Beginner", "Intermediate", "Advanced", "Expert", "Master"][q.difficulty]}
          </span>
          <span className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)]">{q.type === "fill_in" ? "Fill in the blank" : "Multiple choice"}</span>
        </div>

        {/* Question text */}
        <p className="text-lg font-semibold text-[var(--text-primary)] leading-relaxed">{q.questionText}</p>

        {/* Answer area */}
        {q.type === "multiple_choice" ? (
          <div className="grid grid-cols-1 gap-2.5">
            {getVisibleOptions(q).map((opt, i) => (
              <motion.button
                key={opt}
                whileTap={!submitted ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(opt)}
                disabled={submitted}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all"
                style={{ ...getOptionStyle(opt), cursor: submitted ? "default" : "pointer" }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm md:text-[11px] font-bold"
                  style={{
                    background:
                      submitted && opt === q.correctAnswer
                        ? "rgba(34,197,94,0.3)"
                        : submitted && opt === selectedAnswer && opt !== q.correctAnswer
                        ? "rgba(239,68,68,0.3)"
                        : `${subject.color}20`,
                    color:
                      submitted && opt === q.correctAnswer
                        ? "#4ade80"
                        : submitted && opt === selectedAnswer && opt !== q.correctAnswer
                        ? "#f87171"
                        : subject.color,
                  }}
                >
                  {LABELS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {submitted && opt === q.correctAnswer && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                )}
                {submitted && opt === selectedAnswer && opt !== q.correctAnswer && (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={fillAnswer}
              onChange={(e) => !submitted && setFillAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
              disabled={submitted}
              placeholder="Type your answer..."
              className="flex-1 rounded-xl px-4 py-3 text-sm font-medium bg-[var(--va-surface)] outline-none transition-all placeholder:text-[color:color-mix(in_srgb,var(--text-primary)_25%,transparent)]"
              style={{
                border: submitted
                  ? isCorrect
                    ? "2px solid #22c55e"
                    : "2px solid #ef4444"
                  : `1px solid ${BORDER}`,
                color: "white",
              }}
            />
          </div>
        )}

        {/* Submit button */}
        {!submitted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={q.type === "multiple_choice" ? !selectedAnswer : !fillAnswer.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-[var(--text-primary)] transition-all"
            style={{
              background:
                (q.type === "multiple_choice" ? selectedAnswer : fillAnswer.trim())
                  ? `linear-gradient(135deg, ${subject.color}, ${subject.gradientTo})`
                  : "rgba(255,255,255,0.06)",
              cursor:
                (q.type === "multiple_choice" ? !selectedAnswer : !fillAnswer.trim())
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Submit Answer
          </motion.button>
        )}

        {/* Result + explanation */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Result banner */}
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
                style={{
                  background: isCorrect ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${isCorrect ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                    {isCorrect ? "Correct! Well done! 🎉" : `Incorrect. The answer is: ${q.correctAnswer}`}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-1.5 text-sm md:text-xs font-semibold text-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] mb-1">
                  <Sparkles className="w-3 h-3" /> Explanation
                </div>
                <p className="text-sm text-[color:color-mix(in_srgb,var(--text-primary)_75%,transparent)] leading-relaxed">{q.explanation}</p>
              </div>

              {/* Next button */}
              <div className="flex items-center justify-between mt-3 gap-3">
                {/* Difficulty adjustment */}
                <div className="flex gap-2">
                  <button
                    disabled
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm md:text-[11px] text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)] transition-colors cursor-not-allowed"
                    style={{ border: `1px solid ${BORDER}` }}
                    title="Adaptive difficulty coming soon"
                  >
                    {/* TODO: Adaptive difficulty — level down after 2 wrong */}
                    <ChevronDown className="w-3 h-3" /> Too hard
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm md:text-[11px] text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)] transition-colors cursor-not-allowed"
                    style={{ border: `1px solid ${BORDER}` }}
                    title="Adaptive difficulty coming soon"
                  >
                    {/* TODO: Adaptive difficulty — level up after 3 correct */}
                    <ChevronUp className="w-3 h-3" /> Too easy
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  disabled={qIdx >= questions.length - 1}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                  style={{
                    background:
                      qIdx < questions.length - 1
                        ? `linear-gradient(135deg, ${subject.color}, ${subject.gradientTo})`
                        : "rgba(255,255,255,0.08)",
                    cursor: qIdx >= questions.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  {qIdx < questions.length - 1 ? "Next Question →" : "All done! ✓"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Session summary card (shown after all questions) */}
      {submitted && qIdx >= questions.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-brand-orange" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Session Complete!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Questions", value: questions.length },
              { label: "Correct", value: `${sessionCorrect}/${questions.length}` },
              { label: "XP Earned", value: `+${sessionXP}`, color: GOLD },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-xl py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-lg font-bold" style={{ color: s.color || subject.color }}>{s.value}</div>
                <div className="text-sm md:text-[11px] text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Stats / Right Sidebar ──────────────────────────────────────────────────────
function StatsPanel({ userStats }) {
  const xpPct = Math.round((userStats.xp / userStats.xpForNextLevel) * 100);
  const correctPct = userStats.todayQuestions > 0
    ? Math.round((userStats.todayCorrect / userStats.todayQuestions) * 100)
    : 0;

  return (
    <div
      className="hidden xl:flex flex-col gap-4 overflow-y-auto py-4 px-3 custom-scrollbar"
      style={{ width: 260, minWidth: 260, borderLeft: `1px solid ${BORDER}` }}
    >
      {/* Level card */}
      <div className="rounded-xl p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-sm md:text-xs font-bold text-orange-400">Level {userStats.level} {userStats.levelTitle}</span>
        </div>
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">{userStats.xp} / {userStats.xpForNextLevel} XP</span>
          <span className="text-sm md:text-xs font-semibold" style={{ color: GOLD }}>{xpPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8b5cf6, #6d28d9)" }}
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Today's stats */}
      <div className="rounded-xl p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-sm md:text-xs font-bold text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">Today's Stats</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Questions", value: userStats.todayQuestions, color: "#e8722a" },
            { label: "Accuracy", value: `${correctPct}%`, color: "#10b981" },
            { label: "XP", value: `+${userStats.todayXP}`, color: GOLD },
          ].map((s) => (
            <div key={s.label} className="text-center rounded-lg py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm md:text-[10px] text-[color:color-mix(in_srgb,var(--text-primary)_35%,transparent)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)" }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <Flame className="w-8 h-8 text-orange-400" fill="#fb923c" />
        </motion.div>
        <div>
          <div className="text-xl font-bold text-orange-300">{userStats.streak} Days</div>
          <div className="text-sm md:text-[11px] text-orange-400/70">Current Streak</div>
        </div>
      </div>

      {/* Weak spots */}
      <div className="rounded-xl p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-sm md:text-xs font-bold text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">Weak Spots</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {userStats.weakSpots.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-sm md:text-[11px] font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Strong subjects */}
      <div className="rounded-xl p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Star className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-sm md:text-xs font-bold text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">Strong Subjects</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {userStats.strongSubjects.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-sm md:text-[11px] font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-sm md:text-xs font-bold text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)]">This Week</span>
        </div>
        <div className="space-y-2">
          {LEADERBOARD.map((entry) => (
            <div key={entry.rank} className="flex items-center gap-2">
              <span
                className="w-5 text-center text-sm md:text-[11px] font-bold shrink-0"
                style={{
                  color:
                    entry.rank === 1 ? GOLD
                    : entry.rank === 2 ? "#94a3b8"
                    : entry.rank === 3 ? "#cd7c3e"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {entry.rank}
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: "#8b5cf620", color: "#a78bfa" }}
              >
                {entry.avatar}
              </div>
              <span className="flex-1 text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] truncate">{entry.name}</span>
              <span className="text-sm md:text-[11px] font-semibold shrink-0" style={{ color: GOLD }}>
                {entry.xp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily challenge */}
      <div
        className="rounded-xl p-4"
        style={{ background: "linear-gradient(135deg, rgba(220,95,20,0.15), rgba(109,40,217,0.1))", border: "1px solid rgba(220,95,20,0.25)" }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-sm md:text-xs font-bold text-orange-400">Daily Challenge</span>
        </div>
        <p className="text-sm md:text-[11px] text-[color:color-mix(in_srgb,var(--text-primary)_60%,transparent)] mb-3 leading-relaxed">
          Complete {userStats.dailyChallengeGoal} more {userStats.dailyChallengeSubject} questions for a bonus{" "}
          <span style={{ color: GOLD }}>+{userStats.dailyChallengeXPBonus} XP!</span>
        </p>
        <div className="mb-1.5 flex justify-between text-sm md:text-[10px]">
          <span className="text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)]">{userStats.dailyChallengeProgress}/{userStats.dailyChallengeGoal} done</span>
          <span className="text-orange-400">{Math.round((userStats.dailyChallengeProgress / userStats.dailyChallengeGoal) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8b5cf6, #6d28d9)" }}
            initial={{ width: 0 }}
            animate={{ width: `${(userStats.dailyChallengeProgress / userStats.dailyChallengeGoal) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main PracticePage ──────────────────────────────────────────────────────────
export default function PracticePage() {
  const [expandedSubjects, setExpandedSubjects] = useState({ mathematics: true });
  const [selectedSubjectId, setSelectedSubjectId] = useState("mathematics");
  const [selectedTopicId, setSelectedTopicId] = useState("algebra1");
  const [activeSkill, setActiveSkill] = useState(null);
  const [gradeLevel, setGradeLevel] = useState("9th");
  const [masteryData, setMasteryData] = useState({}); // { skillName: { level, score, history } }
  const { user } = useContext(AuthContext);

  const fetchMastery = useCallback(() => {
    if (!user?.user_id) return;
    apiService.practice.getMastery(user.user_id).then(({ topics }) => {
      setMasteryData(topics || {});
    }).catch(() => {});
  }, [user]);

  useEffect(() => { fetchMastery(); }, [fetchMastery]);

  // Compute 2 focus topics (lowest avg mastery score across their skills with data)
  const focusTopicIds = useMemo(() => {
    const topicScores = [];
    for (const subject of SUBJECTS) {
      for (const topic of subject.topics) {
        if (topic.locked) continue;
        const skillsWithData = topic.skills.filter(sk => masteryData[sk.name]);
        if (skillsWithData.length === 0) continue;
        const avg = skillsWithData.reduce((sum, sk) => sum + (masteryData[sk.name]?.score ?? 100), 0) / skillsWithData.length;
        topicScores.push({ subjectId: subject.id, topicId: topic.id, avg });
      }
    }
    return topicScores
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map(t => `${t.subjectId}:${t.topicId}`);
  }, [masteryData]);

  const selectedSubject = useMemo(
    () => SUBJECTS.find((s) => s.id === selectedSubjectId),
    [selectedSubjectId]
  );

  const selectedTopic = useMemo(
    () => selectedSubject?.topics.find((t) => t.id === selectedTopicId),
    [selectedSubject, selectedTopicId]
  );

  const handleToggleSubject = useCallback((id) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelectTopic = useCallback((subjectId, topicId) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId(topicId);
    setActiveSkill(null);
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: true }));
  }, []);

  const handleSelectSkill = useCallback((skill) => {
    setActiveSkill(skill);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setActiveSkill(null);
  }, []);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: BG, color: "white" }}>
      {/* Left sidebar */}
      <SubjectSidebar
        subjects={SUBJECTS}
        selectedSubjectId={selectedSubjectId}
        selectedTopicId={selectedTopicId}
        expandedSubjects={expandedSubjects}
        onToggleSubject={handleToggleSubject}
        onSelectTopic={handleSelectTopic}
        userStats={USER_STATS}
        focusTopicIds={focusTopicIds}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-6 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_40%,transparent)] flex-1 min-w-0">
            <span className="hover:text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] cursor-pointer transition-colors" onClick={() => setActiveSkill(null)}>
              {selectedSubject?.name}
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span
              className="hover:text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] cursor-pointer transition-colors text-[color:color-mix(in_srgb,var(--text-primary)_60%,transparent)]"
              onClick={() => setActiveSkill(null)}
            >
              {selectedTopic?.name}
            </span>
            {activeSkill && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[var(--text-primary)] truncate" style={{ color: selectedSubject?.color }}>
                  {activeSkill.name}
                </span>
              </>
            )}
          </div>

          {/* Grade selector */}
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm md:text-xs font-medium outline-none transition-colors cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g} style={{ background: "#1a1a24" }}>
                {g} Grade
              </option>
            ))}
          </select>

          {/* Generate questions button — placeholder for AI API */}
          {/* TODO: Replace with AI generation */}
          {/* POST /api/practice/generate-questions */}
          {/* Body: { subject, topic, difficulty, count, grade_level } */}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm md:text-xs font-semibold cursor-not-allowed opacity-40 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}
            title="AI question generation coming soon"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate More
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeSkill && selectedSubject ? (
              <QuestionView
                key={`qv-${activeSkill.id}`}
                skill={activeSkill}
                subject={selectedSubject}
                onBack={handleBackToGrid}
                masteryLevel={masteryData[activeSkill.name]?.level}
                onAnswerRecorded={fetchMastery}
              />
            ) : selectedTopic && selectedSubject ? (
              <TopicGrid
                key={`tg-${selectedTopicId}`}
                topic={selectedTopic}
                subject={selectedSubject}
                onSelectSkill={handleSelectSkill}
                masteryData={masteryData}
                isFocusTopic={focusTopicIds.includes(`${selectedSubjectId}:${selectedTopicId}`)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64 text-[color:color-mix(in_srgb,var(--text-primary)_30%,transparent)] text-sm"
              >
                Select a topic to begin
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right stats panel */}
      <StatsPanel userStats={USER_STATS} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
