import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  STUDENT_PROFILES, CLASS_ANALYTICS, SUBJECT_STANDARDS, INTERVENTION_SUGGESTIONS,
} from "../../data/mockStudentIntelligence";
import { SUBJECTS as PRACTICE_SUBJECTS } from "../../data/mockPracticeData";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Textarea } from "../../components/ui/textarea";
import {
  TrendingUp, TrendingDown, Minus, Brain, Target, Users, CheckCircle,
  AlertTriangle, Zap, MessageCircle, User, RefreshCw, ChevronDown, ChevronUp,
  Search, BookOpen, Clock, BarChart2, ArrowRight, Flame,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  thriving:      { color: "#22c55e", label: "Thriving",      badgeCls: "bg-green-500/15 text-green-600 border-green-500/30" },
  on_track:      { color: "#3b82f6", label: "On Track",      badgeCls: "bg-blue-500/15  text-blue-600  border-blue-500/30"  },
  needs_support: { color: "#e8722a", label: "Needs Support", badgeCls: "bg-brand-orange/15 text-brand-deep border-brand-orange/30" },
  at_risk:       { color: "#ef4444", label: "At Risk",       badgeCls: "bg-red-500/15   text-red-600   border-red-500/30"   },
};

const ENGAGEMENT_TREND = [
  { week: "Feb 10", hours: 5.8 },
  { week: "Feb 17", hours: 6.1 },
  { week: "Feb 24", hours: 5.9 },
  { week: "Mar 3",  hours: 6.4 },
];

const INTERVENTION_ICONS = { Target, Users, MessageCircle, User, RefreshCw, Zap };

const STYLE_LABELS = {
  visual:         "Visual",
  auditory:       "Auditory",
  kinesthetic:    "Kinesthetic",
  reading_writing:"Reading/Writing",
};

const STYLE_COLORS = ["#e8722a", "#0ea5e9", "#e8722a", "#22c55e"];

const BIO_STANDARDS = SUBJECT_STANDARDS.Biology;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function scoreColor(s) {
  if (s > 85) return "#16a34a";
  if (s >= 70) return "#22c55e";
  if (s >= 55) return "#e8722a";
  if (s >= 40) return "#f97316";
  return "#ef4444";
}

function scoreBgClass(s) {
  if (s > 85) return "bg-green-700";
  if (s >= 70) return "bg-green-500";
  if (s >= 55) return "bg-brand-orange";
  if (s >= 40) return "bg-orange-500";
  return "bg-red-600";
}

function scoreCellBg(s) {
  if (s > 85) return "#14532d";
  if (s >= 70) return "#166534";
  if (s >= 55) return "#92400e";
  if (s >= 40) return "#9a3412";
  return "#7f1d1d";
}

function scoreCellText(s) {
  return "#fff";
}

function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getTopAndGap(student) {
  const entries = BIO_STANDARDS.map(std => ({
    id: std.id, label: std.label,
    score: student.standardsMastery[std.id]?.score ?? 0,
  }));
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return { top: sorted[0], gap: sorted[sorted.length - 1] };
}

function getLearningStyleInsight(style) {
  const map = {
    visual:         "Works best with diagrams, charts, and color-coded notes.",
    auditory:       "Benefits from verbal explanations and group discussion.",
    kinesthetic:    "Learns through doing — hands-on activities work best.",
    reading_writing:"Excels with written notes, outlines, and text-based explanations.",
  };
  return map[style] ?? "";
}

// ─── CIRCULAR PROGRESS ───────────────────────────────────────────────────────

function CircularProgress({ value, color, size = 72 }) {
  const sw = 5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={sw} className="text-muted/20" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em"
        fontSize={size < 60 ? 10 : 13} fontWeight="700" fill={color}>
        {value}%
      </text>
    </svg>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────

function Sparkline({ scores, width = 80, height = 28 }) {
  if (!scores || scores.length < 2) return null;
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;
  const pts = scores.map((s, i) => [
    (i / (scores.length - 1)) * width,
    height - ((s - min) / range) * height,
  ]);
  const polyline = pts.map(p => p.join(",")).join(" ");
  const stroke = scores[scores.length - 1] >= scores[0] ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={polyline} fill="none" stroke={stroke}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} />
      ))}
    </svg>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, title, value, sub, color = "text-foreground", iconBg = "bg-secondary" }) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`rounded-lg p-2 shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm md:text-xs text-muted-foreground truncate">{title}</p>
          <p className={`text-2xl font-bold leading-tight ${color}`}>{value}</p>
          {sub && <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── INTERVENTION CARD ───────────────────────────────────────────────────────

function InterventionCard({ type, studentName, onAssign, onMessage, onLog }) {
  const suggestion = INTERVENTION_SUGGESTIONS[type] ?? INTERVENTION_SUGGESTIONS.declining_trend;
  const IconComp = INTERVENTION_ICONS[suggestion.icon] ?? Target;
  const [logging, setLogging] = useState(false);
  const [logNote, setLogNote] = useState("");

  return (
    <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-brand-orange/20 p-2 shrink-0">
          <IconComp className="h-4 w-4 text-brand-orange" />
        </div>
        <div>
          <p className="font-semibold text-sm">{suggestion.label}</p>
          <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm md:text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {suggestion.estimatedTime}
            </span>
            <span className={`text-sm md:text-xs px-1.5 py-0.5 rounded-full border font-medium ${
              suggestion.difficulty === "easy"
                ? "bg-green-500/10 text-green-600 border-green-500/30"
                : "bg-brand-orange/10 text-brand-deep border-brand-orange/30"
            }`}>{suggestion.difficulty}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="default" className="text-sm md:text-xs h-7" onClick={onAssign}>
          Assign Practice
        </Button>
        <Button size="sm" variant="outline" className="text-sm md:text-xs h-7" onClick={onMessage}>
          Send Message
        </Button>
        <Button size="sm" variant="ghost" className="text-sm md:text-xs h-7" onClick={() => setLogging(l => !l)}>
          Log Intervention
        </Button>
      </div>
      {logging && (
        <div className="space-y-2 pt-1 border-t border-border">
          <Textarea
            placeholder="What did you do?"
            value={logNote}
            onChange={e => setLogNote(e.target.value)}
            className="text-sm md:text-xs resize-none h-16"
          />
          <div className="flex gap-2">
            <Input type="date" className="text-sm md:text-xs h-7 w-auto" defaultValue={new Date().toISOString().slice(0, 10)} />
            <select className="text-sm md:text-xs h-7 rounded-md border border-input bg-background px-2">
              <option value="extra_practice">Extra Practice</option>
              <option value="peer_tutoring">Peer Tutoring</option>
              <option value="one_on_one">One-on-One</option>
              <option value="parent_contact">Parent Contact</option>
            </select>
          </div>
          <Button size="sm" className="text-sm md:text-xs h-7" onClick={onLog}>
            Save Log
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── STUDENT DRAWER ───────────────────────────────────────────────────────────

function StudentDrawer({ student, open, onClose }) {
  const navigate = useNavigate();
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(student?.teacherNotes ?? "");

  if (!student) return null;

  const cfg = STATUS_CONFIG[student.status];
  const recentScoreValues = student.recentScores.map(s => s.score);
  const interventionKey = (() => {
    if (student.status === "at_risk") return "failing_consecutive_assessments";
    if (student.trend === "declining") return "declining_trend";
    if (student.flags.some(f => f.toLowerCase().includes("activity"))) return "no_recent_activity";
    if (student.strugglingWith.length > 1) return "low_mastery_multiple_standards";
    if (student.strugglingWith.length === 1) return "low_mastery_single_standard";
    return "strong_student_plateau";
  })();
  const effectiveInterventionKey = student.interventionSuggested
    ? (student.interventionType ?? interventionKey)
    : (student.status === "thriving" ? "strong_student_plateau" : null);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0"
                style={{ backgroundColor: cfg.color }}
              >
                {getInitials(student.name)}
              </div>
              <div className="text-left">
                <p className="font-semibold text-base leading-tight">{student.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-sm md:text-xs px-1.5 py-0.5 rounded-full border font-medium ${cfg.badgeCls}`}>
                    {cfg.label}
                  </span>
                  <span className="text-sm md:text-xs text-muted-foreground">Grade {student.grade}</span>
                  <span className="text-sm md:text-xs text-muted-foreground">· {student.lastActive}</span>
                  {student.trend === "improving" && (
                    <span className="text-sm md:text-xs text-green-500 font-medium flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +{student.trendDelta}%
                    </span>
                  )}
                  {student.trend === "declining" && (
                    <span className="text-sm md:text-xs text-red-500 font-medium flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" /> {student.trendDelta}%
                    </span>
                  )}
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 py-4 space-y-6">

          {/* Section 1 — Mastery by Standard */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-muted-foreground" /> Mastery by Standard
            </h3>
            <div className="space-y-2.5">
              {BIO_STANDARDS.map(std => {
                const entry = student.standardsMastery[std.id];
                const score = entry?.score ?? 0;
                const col = scoreColor(score);
                return (
                  <div key={std.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm md:text-xs font-mono text-muted-foreground shrink-0">{std.code}</span>
                        <span className="text-sm md:text-xs truncate">{std.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-sm md:text-xs font-semibold" style={{ color: col }}>{score}%</span>
                        {score > 85 && (
                          <span className="text-sm md:text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 border border-green-500/30 font-medium">
                            Mastered
                          </span>
                        )}
                        {score < 65 && (
                          <span className="text-sm md:text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 border border-red-500/30 font-medium">
                            Needs work
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, backgroundColor: col }}
                      />
                    </div>
                    <p className="text-sm md:text-[10px] text-muted-foreground mt-0.5">
                      {entry?.attempts ?? 0} attempts · Last: {entry?.lastAttempt ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2 — Learning Profile */}
          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-muted-foreground" /> Learning Profile
            </h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm md:text-xs px-2 py-1 rounded-full bg-brand-deep/15 text-brand-deep border border-brand-deep/30 font-medium">
                  {STYLE_LABELS[student.learningStyle] ?? student.learningStyle}
                </span>
                <span className="text-sm md:text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30 font-medium capitalize">
                  {student.workStyle.replace("_", " ")} worker
                </span>
              </div>
              <p className="text-sm md:text-xs text-muted-foreground italic">
                {getLearningStyleInsight(student.learningStyle)}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {student.cognitiveStrengths.map(str => (
                  <span key={str} className="text-sm md:text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                    {str}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 — Recent Performance */}
          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Recent Performance
              </span>
              <Sparkline scores={recentScoreValues} />
            </h3>
            <div className="space-y-2">
              {student.recentScores.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm md:text-xs">
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-primary)] font-bold text-sm md:text-[10px] shrink-0"
                    style={{ backgroundColor: scoreColor(entry.score) }}
                  >
                    {entry.score}
                  </div>
                  <span className="flex-1 min-w-0 truncate">{entry.assignmentTitle}</span>
                  <span className="text-muted-foreground shrink-0">{entry.date}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-secondary border border-border text-sm md:text-[10px]">
                    {entry.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Intervention Panel */}
          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-muted-foreground" /> Intervention &amp; Support
            </h3>
            {effectiveInterventionKey ? (
              <InterventionCard
                type={effectiveInterventionKey}
                studentName={student.name}
                onAssign={() => navigate("/teacher/assignments/create")}
                onMessage={() => toast.success(`Message sent to ${student.name}`)}
                onLog={() => toast.success("Intervention logged")}
              />
            ) : (
              <p className="text-sm md:text-xs text-muted-foreground">No active intervention needed.</p>
            )}
          </section>

          {/* Section 5 — Teacher Notes */}
          <section className="border-t border-border pt-5 pb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" /> Teacher Notes
              </span>
              {!editingNote && (
                <button
                  onClick={() => setEditingNote(true)}
                  className="text-sm md:text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Edit Note
                </button>
              )}
            </h3>
            {editingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="text-sm md:text-xs resize-none"
                  rows={3}
                />
                <Button size="sm" className="text-sm md:text-xs h-7" onClick={() => {
                  setEditingNote(false);
                  toast.success("Note saved");
                }}>
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-sm md:text-xs text-muted-foreground leading-relaxed">{noteText}</p>
            )}
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── STUDENT CARD ─────────────────────────────────────────────────────────────

function StudentCard({ student, onViewProfile }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[student.status];
  const { top, gap } = getTopAndGap(student);
  const interventionSugg = student.interventionType
    ? INTERVENTION_SUGGESTIONS[student.interventionType]
    : null;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col gap-3">

        {/* Top row: left + middle + right */}
        <div className="flex items-start gap-3">

          {/* LEFT — Avatar + name + status */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center">
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold text-sm"
              style={{ backgroundColor: cfg.color }}
            >
              {getInitials(student.name)}
            </div>
            <span className={`text-sm md:text-[10px] px-1.5 py-0.5 rounded-full border font-medium leading-tight ${cfg.badgeCls}`}>
              {cfg.label}
            </span>
            {student.trend === "improving" && (
              <span className="text-sm md:text-[10px] text-green-500 font-medium">↑ +{student.trendDelta}%</span>
            )}
            {student.trend === "declining" && (
              <span className="text-sm md:text-[10px] text-red-500 font-medium">↓ {student.trendDelta}%</span>
            )}
            {student.trend === "stable" && (
              <span className="text-sm md:text-[10px] text-muted-foreground">→ stable</span>
            )}
          </div>

          {/* MIDDLE — Name, ring, strengths */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{student.name}</p>
            <p className="text-sm md:text-xs text-muted-foreground mb-2">Grade {student.grade}</p>
            <div className="flex items-center gap-3">
              <CircularProgress value={student.overallMastery} color={cfg.color} size={60} />
              <div className="min-w-0">
                <p className="text-sm md:text-[10px] text-muted-foreground uppercase tracking-wide">Top Standard</p>
                <p className="text-sm md:text-xs font-medium truncate text-green-600">{top.label}</p>
                <p className="text-sm md:text-xs text-green-600 font-bold">{top.score}%</p>
                <p className="text-sm md:text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Biggest Gap</p>
                <p className="text-sm md:text-xs font-medium truncate text-red-500">{gap.label}</p>
                <p className="text-sm md:text-xs text-red-500 font-bold">{gap.score}%</p>
              </div>
            </div>
          </div>

          {/* RIGHT — Engagement stats */}
          <div className="shrink-0 text-right space-y-1.5 min-w-[80px]">
            <div>
              <p className="text-sm md:text-[10px] text-muted-foreground">Study hrs</p>
              <p className="text-sm md:text-xs font-semibold">{student.studyHoursThisWeek}h</p>
              <div className="flex justify-end items-center gap-0.5 mt-0.5">
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden w-12">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min((student.studyHoursThisWeek / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm md:text-[10px] text-muted-foreground">Assignments</p>
              <p className="text-sm md:text-xs font-semibold">{student.assignmentsCompleted}/{student.assignmentsTotal}</p>
            </div>
            <div>
              <p className="text-sm md:text-[10px] text-muted-foreground">Last active</p>
              <p className="text-sm md:text-xs truncate">{student.lastActive}</p>
            </div>
            {student.streakDays > 0 && (
              <div className="flex items-center justify-end gap-0.5">
                <Flame className="h-3 w-3 text-orange-500" />
                <span className="text-sm md:text-xs text-orange-500 font-medium">{student.streakDays}d</span>
              </div>
            )}
          </div>
        </div>

        {/* Flags */}
        {student.flags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {student.flags.map((flag, i) => (
              <span key={i} className="text-sm md:text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-red-500/10 text-red-600 border-red-500/30">
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Intervention banner */}
        {student.interventionSuggested && interventionSugg && (
          <div className="rounded-md border border-brand-orange/30 bg-brand-orange/8 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-brand-orange mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm md:text-[10px] font-semibold text-brand-deep">Intervention Suggested</p>
              <p className="text-sm md:text-[10px] text-muted-foreground truncate">{interventionSugg.description}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border">
          <Button size="sm" variant="default" className="flex-1 text-sm md:text-xs h-7" onClick={onViewProfile}>
            View Full Profile →
          </Button>
          <Button size="sm" variant="outline" className="text-sm md:text-xs h-7"
            onClick={() => toast.success(`Message sent to ${student.name}`)}>
            Message
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

// ─── TAB 1 — CLASS OVERVIEW ───────────────────────────────────────────────────

function ClassOverviewTab({ onStudentBarClick }) {
  const ca = CLASS_ANALYTICS;
  const needingSupportCount = ca.statusBreakdown.needs_support + ca.statusBreakdown.at_risk;

  const barData = useMemo(() =>
    [...STUDENT_PROFILES]
      .sort((a, b) => b.overallMastery - a.overallMastery)
      .map(s => ({
        name: s.name.split(" ")[0],
        mastery: s.overallMastery,
        status: s.status,
        fullName: s.name,
        trend: s.trend,
        id: s.id,
      })),
    []
  );

  const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const cfg = STATUS_CONFIG[d.status];
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-sm md:text-xs">
        <p className="font-semibold">{d.fullName}</p>
        <p>Mastery: <strong>{d.mastery}%</strong></p>
        <p className={`font-medium`} style={{ color: cfg.color }}>{cfg.label}</p>
        <p className="text-muted-foreground capitalize">Trend: {d.trend}</p>
        <p className="text-muted-foreground mt-0.5 italic">Click to view profile</p>
      </div>
    );
  };

  // Heatmap sorted same as bar
  const heatStudents = barData.map(b => STUDENT_PROFILES.find(s => s.id === b.id));

  const biggestGapStd = BIO_STANDARDS.find(s => s.id === ca.biggestClassGap);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="flex gap-3 flex-wrap">
        <StatCard
          icon={BarChart2} title="Class Avg Mastery"
          value={`${ca.classAvgMastery}%`}
          sub={ca.monthlyTrendDelta >= 0 ? `↑ +${ca.monthlyTrendDelta}% this month` : `↓ ${ca.monthlyTrendDelta}% this month`}
          color={ca.monthlyTrendDelta >= 0 ? "text-green-500" : "text-red-500"}
          iconBg="bg-blue-500/15"
        />
        <StatCard
          icon={CheckCircle} title="Students Thriving"
          value={ca.statusBreakdown.thriving}
          sub={`${Math.round((ca.statusBreakdown.thriving / 20) * 100)}% of class`}
          color="text-green-500"
          iconBg="bg-green-500/15"
        />
        <StatCard
          icon={AlertTriangle} title="Needing Support"
          value={needingSupportCount}
          sub={`${ca.statusBreakdown.needs_support} needs support · ${ca.statusBreakdown.at_risk} at risk`}
          color="text-brand-orange"
          iconBg="bg-brand-orange/15"
        />
        <StatCard
          icon={CheckCircle} title="Assignment Completion"
          value={`${ca.avgAssignmentCompletion}%`}
          sub="class average"
          color="text-blue-500"
          iconBg="bg-blue-500/15"
        />
        <StatCard
          icon={Users} title="Active Today"
          value={ca.activeStudentsToday}
          sub={`out of 20 students`}
          color="text-brand-deep"
          iconBg="bg-brand-deep/15"
        />
      </div>

      {/* Class health bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Student Mastery Distribution</CardTitle>
          <p className="text-sm md:text-xs text-muted-foreground">Click any bar to open that student's profile</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-sm md:text-xs">
                <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: v.color }} />
                {v.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={560}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
              barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false}
                axisLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--secondary)", opacity: 0.5 }} />
              <Bar dataKey="mastery" radius={[0, 4, 4, 0]}
                onClick={(data) => onStudentBarClick(data.id)}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_CONFIG[entry.status].color}
                    style={{ cursor: "pointer" }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Standards heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Standards Mastery Heatmap</CardTitle>
          <p className="text-sm md:text-xs text-muted-foreground">Red cells = intervention needed · Hover for score</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="text-sm md:text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <th className="text-left pr-3 pb-2 font-medium text-muted-foreground w-28 text-sm md:text-xs">Student</th>
                {BIO_STANDARDS.map(std => (
                  <th key={std.id} className="pb-2 px-1 text-center">
                    <div title={std.label} className="font-mono text-sm md:text-[10px] text-muted-foreground cursor-help">
                      {std.code}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatStudents.map(student => (
                <tr key={student.id}>
                  <td className="pr-3 py-0.5 text-sm md:text-xs text-muted-foreground whitespace-nowrap">
                    {student.name.split(" ")[0]} {student.name.split(" ")[1]?.[0]}.
                  </td>
                  {BIO_STANDARDS.map(std => {
                    const score = student.standardsMastery[std.id]?.score ?? 0;
                    return (
                      <td key={std.id} className="px-1 py-0.5">
                        <div
                          title={`${student.name} · ${std.label}: ${score}%`}
                          className="h-7 w-10 rounded flex items-center justify-center text-sm md:text-[10px] font-semibold cursor-help transition-transform hover:scale-110"
                          style={{ backgroundColor: scoreCellBg(score), color: scoreCellText(score) }}
                        >
                          {score}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Callout */}
          <div className="mt-5 rounded-lg border border-brand-orange/30 bg-brand-orange/8 p-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                ⚠️ Biggest class gap: {biggestGapStd?.label ?? ca.biggestClassGap} — {ca.standardsClassAvg[ca.biggestClassGap]?.below65Count} students below 65%
              </p>
              <p className="text-sm md:text-xs text-muted-foreground mt-0.5">
                Consider reteaching this standard before moving on.
              </p>
            </div>
            <Button size="sm" variant="outline" className="text-sm md:text-xs h-7 shrink-0 whitespace-nowrap"
              onClick={() => {}}>
              Create Practice Assignment →
            </Button>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 text-sm md:text-[10px] text-muted-foreground">
            {[
              { label: "> 85 Mastered",    bg: "#14532d" },
              { label: "70–85 Proficient", bg: "#166534" },
              { label: "55–70 Developing", bg: "#92400e" },
              { label: "40–55 Struggling", bg: "#9a3412" },
              { label: "< 40 At Risk",     bg: "#7f1d1d" },
            ].map(({ label, bg }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: bg }} />
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Engagement</CardTitle>
          <p className="text-sm md:text-xs text-muted-foreground">Avg study hours / week</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ENGAGEMENT_TREND} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[4, 8]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v}h`} />
              <RechartsTooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }}
                formatter={(v) => [`${v}h`, "Avg study hours"]}
              />
              <Line type="monotone" dataKey="hours" stroke="#e8722a" strokeWidth={2.5}
                dot={{ fill: "#e8722a", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}

// ─── TAB 2 — STUDENT PROFILES ─────────────────────────────────────────────────

function StudentProfilesTab({ initialStudentId }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [sort, setSort] = useState("mastery");
  const [openStudentId, setOpenStudentId] = useState(initialStudentId ?? null);

  const filtered = useMemo(() => {
    let list = [...STUDENT_PROFILES];
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
    if (trendFilter !== "all") list = list.filter(s => s.trend === trendFilter);
    list.sort((a, b) => {
      if (sort === "mastery") return b.overallMastery - a.overallMastery;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "flags") return b.flags.length - a.flags.length;
      return 0; // last_active: skip for demo
    });
    return list;
  }, [search, statusFilter, trendFilter, sort]);

  const openStudent = openStudentId ? STUDENT_PROFILES.find(s => s.id === openStudentId) : null;

  const STATUS_FILTERS = [
    { value: "all",           label: "All" },
    { value: "thriving",      label: "Thriving" },
    { value: "on_track",      label: "On Track" },
    { value: "needs_support", label: "Needs Support" },
    { value: "at_risk",       label: "At Risk" },
  ];

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm md:text-xs"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`text-sm md:text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "improving", "stable", "declining"].map(t => (
            <button key={t}
              onClick={() => setTrendFilter(t)}
              className={`text-sm md:text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                trendFilter === t
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/50"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-sm md:text-xs h-8 rounded-md border border-input bg-background px-2 text-muted-foreground"
        >
          <option value="mastery">Mastery ↓</option>
          <option value="name">Name A–Z</option>
          <option value="last_active">Last Active</option>
          <option value="flags">Most Flags</option>
        </select>
      </div>

      <p className="text-sm md:text-xs text-muted-foreground mb-4">{filtered.length} students</p>

      {/* Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onViewProfile={() => setOpenStudentId(student.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 py-8 text-center">
            No students match your filters.
          </p>
        )}
      </div>

      {/* Drawer */}
      <StudentDrawer
        student={openStudent}
        open={!!openStudentId}
        onClose={() => setOpenStudentId(null)}
      />
    </div>
  );
}

// ─── TAB 3 — STANDARDS & GAPS ─────────────────────────────────────────────────

function StandardsGapsTab() {
  const navigate = useNavigate();
  const [expandedStd, setExpandedStd] = useState(null);
  const ca = CLASS_ANALYTICS;

  // Learning style distribution
  const styleCountMap = useMemo(() => {
    const counts = {};
    STUDENT_PROFILES.forEach(s => {
      counts[s.learningStyle] = (counts[s.learningStyle] ?? 0) + 1;
    });
    return counts;
  }, []);

  const styleData = useMemo(() =>
    Object.entries(styleCountMap).map(([name, value]) => ({
      name: STYLE_LABELS[name] ?? name, value,
    })),
    [styleCountMap]
  );

  const topStyle = useMemo(() => {
    const top = Object.entries(styleCountMap).sort((a, b) => b[1] - a[1])[0];
    return { key: top?.[0], count: top?.[1] };
  }, [styleCountMap]);

  // Cognitive strengths counts
  const strengthCounts = useMemo(() => {
    const counts = {};
    STUDENT_PROFILES.forEach(s =>
      s.cognitiveStrengths.forEach(str => {
        counts[str] = (counts[str] ?? 0) + 1;
      })
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  const topStrength = strengthCounts[0]?.[0] ?? "analytical";

  const STD_TRENDS = {
    "BIO-1": "stable", "BIO-2": "declining", "BIO-3": "stable",
    "BIO-4": "improving", "BIO-5": "declining", "BIO-6": "improving",
  };

  return (
    <div className="space-y-6">

      {/* Standards overview */}
      <div className="space-y-3">
        {BIO_STANDARDS.map(std => {
          const stdStats = ca.standardsClassAvg[std.id];
          if (!stdStats) return null;
          const masteredCount = stdStats.above85Count;
          const belowCount = stdStats.below65Count;
          const approachingCount = 20 - masteredCount - belowCount;
          const isExpanded = expandedStd === std.id;
          const trend = STD_TRENDS[std.id];
          const pctBelow = Math.round((belowCount / 20) * 100);
          const stdColor = scoreColor(stdStats.avg);

          // Students for this standard, sorted
          const studentsForStd = [...STUDENT_PROFILES]
            .map(s => ({ ...s, stdScore: s.standardsMastery[std.id]?.score ?? 0 }))
            .sort((a, b) => b.stdScore - a.stdScore);

          return (
            <Card key={std.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedStd(isExpanded ? null : std.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Code badge + avg */}
                    <div className="shrink-0 text-center min-w-[72px]">
                      <span className="text-sm md:text-xs font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">
                        {std.code}
                      </span>
                      <p className="text-2xl font-bold mt-1.5" style={{ color: stdColor }}>
                        {Math.round(stdStats.avg)}%
                      </p>
                      <p className="text-sm md:text-[10px] text-muted-foreground">class avg</p>
                    </div>

                    {/* Label + distribution */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{std.label}</p>
                        {trend === "declining" && <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        {trend === "improving" && <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        {trend === "stable" && <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </div>

                      {/* Distribution bar */}
                      <div className="flex h-4 rounded-full overflow-hidden w-full">
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${(masteredCount / 20) * 100}%` }}
                          title={`${masteredCount} mastered (>85%)`}
                        />
                        <div
                          className="bg-blue-400 transition-all"
                          style={{ width: `${(approachingCount / 20) * 100}%` }}
                          title={`${approachingCount} approaching (65–85%)`}
                        />
                        <div
                          className="bg-red-500 transition-all"
                          style={{ width: `${(belowCount / 20) * 100}%` }}
                          title={`${belowCount} needs help (<65%)`}
                        />
                      </div>
                      <div className="flex gap-3 mt-1.5 text-sm md:text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                          {masteredCount} mastered
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                          {approachingCount} approaching
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                          {belowCount} need help
                        </span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="shrink-0">
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </CardContent>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                  {/* Per-student list */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {studentsForStd.map(s => {
                      const sc = STATUS_CONFIG[s.status];
                      const isLow = s.stdScore < 65;
                      return (
                        <div key={s.id}
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md ${
                            isLow ? "bg-red-500/8 border border-red-500/20" : ""
                          }`}>
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold text-[9px] shrink-0"
                            style={{ backgroundColor: sc.color }}
                          >
                            {getInitials(s.name)}
                          </div>
                          <span className="text-sm md:text-xs flex-1 min-w-0 truncate">{s.name}</span>
                          <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${s.stdScore}%`,
                                backgroundColor: scoreColor(s.stdScore),
                              }}
                            />
                          </div>
                          <span className="text-sm md:text-xs font-semibold w-8 text-right shrink-0"
                            style={{ color: scoreColor(s.stdScore) }}>
                            {s.stdScore}%
                          </span>
                          {isLow && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-600 border border-red-500/30 shrink-0">
                              low
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Suggested action */}
                  <div className="rounded-lg border border-border bg-secondary/50 p-3">
                    {pctBelow >= 30 ? (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-brand-orange mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm md:text-xs font-semibold text-brand-deep">
                            Consider reteaching — {pctBelow}% of class struggling
                          </p>
                          <p className="text-sm md:text-xs text-muted-foreground mt-0.5">
                            More than 30% of students are below 65% on this standard.
                          </p>
                          <Button size="sm" variant="outline" className="text-sm md:text-xs h-6 mt-2"
                            onClick={() => navigate("/teacher/assignments/create")}>
                            Create Review Assignment
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm md:text-xs font-semibold text-green-600">
                            Class has strong mastery — ready to advance
                          </p>
                          <p className="text-sm md:text-xs text-muted-foreground mt-0.5">
                            Less than 10% of students need support on this standard.
                          </p>
                          <Button size="sm" variant="outline" className="text-sm md:text-xs h-6 mt-2"
                            onClick={() => navigate("/teacher/assignments/create")}>
                            Create Extension Activity
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Learning styles donut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Learning Styles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={styleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {styleData.map((entry, i) => (
                    <Cell key={i} fill={STYLE_COLORS[i % STYLE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => <span style={{ fontSize: 11 }}>{v}</span>}
                />
                <RechartsTooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }}
                  formatter={(v, name) => [`${v} students`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 min-w-48">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your class is{" "}
                <strong>{Math.round(((styleCountMap[topStyle.key] ?? 0) / 20) * 100)}% {STYLE_LABELS[topStyle.key] ?? topStyle.key}</strong>{" "}
                learners. Consider using more{" "}
                {topStyle.key === "visual" && "diagrams, color-coded notes, and visual organizers"}
                {topStyle.key === "auditory" && "verbal explanations, discussions, and audio walkthroughs"}
                {topStyle.key === "kinesthetic" && "hands-on labs, simulations, and movement-based activities"}
                {topStyle.key === "reading_writing" && "written explanations, outlines, and annotated readings"}
                {" "}in your materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cognitive strengths cloud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Cognitive Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {strengthCounts.map(([str, count]) => {
              const pct = count / 20;
              return (
                <span
                  key={str}
                  title={`${count} students`}
                  className="px-2.5 py-1 rounded-full border border-border bg-secondary transition-transform hover:scale-105 cursor-default"
                  style={{
                    fontSize: 10 + pct * 12,
                    opacity: 0.5 + pct * 0.5,
                    fontWeight: count >= 3 ? 600 : 400,
                  }}
                >
                  {str}
                </span>
              );
            })}
          </div>
          <p className="text-sm md:text-xs text-muted-foreground">
            Most students in this class show <strong>{topStrength}</strong> as a key strength.{" "}
            Leverage structured problem-solving and pattern-based explanations for best results.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

// ─── TAB 4 — MASTERY HEATMAP ──────────────────────────────────────────────────

// Flatten all practice topics with their parent subject color
const PRACTICE_TOPICS = PRACTICE_SUBJECTS.flatMap(subject =>
  subject.topics.filter(t => !t.locked).map(t => ({
    id: `${subject.id}:${t.id}`,
    label: t.name,
    subjectColor: subject.color,
    skills: t.skills.map(sk => sk.name),
  }))
);

const MASTERY_TIERS = {
  Struggling:  { bg: "rgba(239,68,68,0.7)",   text: "#fff", label: "Struggling"  },
  Practicing:  { bg: "rgba(234,179,8,0.7)",   text: "#fff", label: "Practicing"  },
  Proficient:  { bg: "rgba(34,197,94,0.6)",   text: "#fff", label: "Proficient"  },
  Mastered:    { bg: "rgba(139,92,246,0.75)", text: "#fff", label: "Mastered"    },
  None:        { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.2)", label: "—" },
};

// Deterministic seeded random: produces 0..1 from a string seed
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return ((h >>> 0) / 0xffffffff);
}

// Generate mock last-10 answers for a student × skill combo
function mockAnswerHistory(studentId, skillName) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = seededRand(`${studentId}-${skillName}-${i}`);
    return r > 0.4 ? 1 : 0;
  });
}

// Compute mastery level from answer history
function computeMastery(history) {
  if (!history || history.length === 0) return "None";
  const pct = (history.reduce((a, b) => a + b, 0) / history.length) * 100;
  if (pct < 50) return "Struggling";
  if (pct < 70) return "Practicing";
  if (pct < 90) return "Proficient";
  return "Mastered";
}

// For each student, pull real mastery from localStorage if available; else use seeded mock
function getStudentTopicMastery(studentId, topicSkills) {
  const store = (() => {
    try { return JSON.parse(localStorage.getItem("mock_mastery_answers") || "{}"); } catch { return {}; }
  })();
  const userData = store[studentId] || {};
  // Average across all skills in the topic
  const allHistory = topicSkills.flatMap(sk => userData[sk] || mockAnswerHistory(studentId, sk));
  return computeMastery(allHistory);
}

function getStudentSkillHistory(studentId, skillName) {
  const store = (() => {
    try { return JSON.parse(localStorage.getItem("mock_mastery_answers") || "{}"); } catch { return {}; }
  })();
  return (store[studentId] || {})[skillName] || mockAnswerHistory(studentId, skillName);
}

function MasteryHeatmapTab() {
  const [selectedCell, setSelectedCell] = useState(null); // { student, topic }

  const handleCellClick = useCallback((student, topic) => {
    setSelectedCell(prev =>
      prev?.student.id === student.id && prev?.topic.id === topic.id ? null : { student, topic }
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Mastery tier per student × practice topic. Click any cell to see last 10 answers.
        </p>
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {Object.entries(MASTERY_TIERS).filter(([k]) => k !== "None").map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-sm md:text-xs">
              <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: cfg.bg }} />
              {cfg.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-sm md:text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded inline-block bg-secondary border border-border" />
            No data
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <table className="text-sm md:text-xs border-collapse" style={{ minWidth: PRACTICE_TOPICS.length * 80 + 160 }}>
            <thead>
              <tr>
                <th className="text-left pr-3 pb-2 font-medium text-muted-foreground w-32 text-sm md:text-xs sticky left-0 bg-background z-10">
                  Student
                </th>
                {PRACTICE_TOPICS.map(topic => (
                  <th key={topic.id} className="pb-2 px-1 text-center min-w-[72px]">
                    <div
                      className="text-sm md:text-[10px] font-medium leading-tight"
                      title={topic.label}
                      style={{ color: topic.subjectColor, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {topic.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STUDENT_PROFILES.map(student => (
                <tr key={student.id}>
                  <td className="pr-3 py-1 text-sm md:text-xs text-muted-foreground whitespace-nowrap sticky left-0 bg-background z-10">
                    {student.name.split(" ")[0]} {student.name.split(" ")[1]?.[0]}.
                  </td>
                  {PRACTICE_TOPICS.map(topic => {
                    const level = getStudentTopicMastery(student.id, topic.skills);
                    const cfg = MASTERY_TIERS[level] || MASTERY_TIERS.None;
                    const isSelected = selectedCell?.student.id === student.id && selectedCell?.topic.id === topic.id;
                    return (
                      <td key={topic.id} className="px-1 py-1">
                        <button
                          onClick={() => handleCellClick(student, topic)}
                          title={`${student.name} · ${topic.label}: ${cfg.label}`}
                          className="h-7 w-16 rounded text-sm md:text-[10px] font-semibold transition-all hover:scale-105 focus:outline-none w-full"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.text,
                            outline: isSelected ? "2px solid white" : "none",
                            outlineOffset: 1,
                          }}
                        >
                          {cfg.label === "—" ? "—" : cfg.label.slice(0, 4)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Drill-down panel: last 10 answers for selected cell */}
      {selectedCell && (
        <Card className="border-2" style={{ borderColor: "rgba(139,92,246,0.4)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span
                className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold text-sm md:text-xs shrink-0"
                style={{ backgroundColor: STATUS_CONFIG[selectedCell.student.status]?.color ?? "#e8722a" }}
              >
                {getInitials(selectedCell.student.name)}
              </span>
              {selectedCell.student.name} — {selectedCell.topic.label}
            </CardTitle>
            <p className="text-sm md:text-xs text-muted-foreground">Last 10 answers (oldest → newest)</p>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {selectedCell.topic.skills.map(skillName => {
                const history = getStudentSkillHistory(selectedCell.student.id, skillName);
                const level = computeMastery(history);
                const cfg = MASTERY_TIERS[level] || MASTERY_TIERS.None;
                const pct = Math.round((history.reduce((a, b) => a + b, 0) / history.length) * 100);
                return (
                  <div key={skillName}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm md:text-xs font-medium">{skillName}</span>
                      <span
                        className="text-sm md:text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label} · {pct}%
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {history.map((correct, i) => (
                        <div
                          key={i}
                          title={`Answer ${i + 1}: ${correct ? "Correct" : "Wrong"}`}
                          className="h-6 w-6 rounded flex items-center justify-center text-sm md:text-[11px] font-bold text-[var(--text-primary)]"
                          style={{ backgroundColor: correct ? "#16a34a" : "#dc2626" }}
                        >
                          {correct ? "✓" : "✗"}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "📊 Class Overview" },
  { id: "profiles",  label: "👥 Student Profiles" },
  { id: "standards", label: "🎯 Standards & Gaps" },
  { id: "heatmap",   label: "🔥 Mastery Heatmap" },
];

export default function StudentIntelligence() {
  const [activeTab, setActiveTab] = useState("overview");
  const [jumpStudentId, setJumpStudentId] = useState(null);

  const handleBarClick = (studentId) => {
    setJumpStudentId(studentId);
    setActiveTab("profiles");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-6 w-6 text-brand-deep" />
          <h1 className="text-2xl font-bold">Student Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Period 2 · Biology · 20 students · Last updated just now
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors relative -mb-px ${
              activeTab === tab.id
                ? "text-foreground border border-b-background border-border bg-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && (
          <ClassOverviewTab onStudentBarClick={handleBarClick} />
        )}
        {activeTab === "profiles" && (
          <StudentProfilesTab initialStudentId={jumpStudentId} />
        )}
        {activeTab === "standards" && (
          <StandardsGapsTab />
        )}
        {activeTab === "heatmap" && (
          <MasteryHeatmapTab />
        )}
      </div>

    </div>
  );
}
