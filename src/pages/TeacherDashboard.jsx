import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Plus, AlertTriangle, Clock, CheckSquare, TrendingUp, X, RotateCcw, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { mockStudents, mockAssignments, mockPendingSubmissions } from "../data/mockTeacherData";

const GRADE_MAP = { A: 92, B: 82, C: 72, D: 62, F: 45 };

function scoreToLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function averageGrade() {
  const graded = mockAssignments.filter((a) => a.avgGrade !== null);
  if (!graded.length) return "N/A";
  const avg = graded.reduce((s, a) => s + a.avgGrade, 0) / graded.length;
  return scoreToLetter(avg);
}

const STATUS_CONFIG = {
  on_track: { label: "On Track", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  struggling: { label: "Struggling", className: "bg-brand-orange/15 text-brand-deep border-brand-orange/20" },
  at_risk: { label: "At Risk", className: "bg-red-500/15 text-red-600 border-red-500/20" },
};

const MOCK_QUESTIONS = [
  {
    type: "Multiple Choice",
    question: "Which phase of mitosis is characterized by chromosomes aligning at the cell's equator?",
    options: ["A) Prophase", "B) Metaphase", "C) Anaphase", "D) Telophase"],
    answer: "B) Metaphase",
  },
  {
    type: "Short Answer",
    question: "Explain the role of spindle fibers during cell division.",
    options: null,
    answer: null,
  },
  {
    type: "Multiple Choice",
    question: "What is the result of a successful mitosis cycle?",
    options: [
      "A) 4 haploid cells",
      "B) 2 identical diploid cells",
      "C) 1 cell with double DNA",
      "D) 2 haploid cells",
    ],
    answer: "B) 2 identical diploid cells",
  },
];

function AIGeneratorModal({ open, onClose }) {
  const [topic, setTopic] = useState("");
  const [qType, setQType] = useState("Multiple Choice");
  const [numQ, setNumQ] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1500);
  };

  const handleSave = () => {
    toast.success("Assignment created! +10 XP");
    setGenerated(false);
    setTopic("");
    onClose();
  };

  const handleRegenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1200);
  };

  const qTypes = ["Multiple Choice", "Short Answer", "True/False", "Mixed"];
  const difficulties = ["Easy", "Medium", "Hard"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assignment Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic or Learning Objective</label>
            <Textarea
              placeholder="e.g. Cell division, focusing on mitosis phases and checkpoints"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Question Type</label>
            <div className="flex flex-wrap gap-2">
              {qTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQType(t)}
                  className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                    qType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={numQ}
                onChange={(e) => setNumQ(Math.min(20, Math.max(1, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-sm border transition-colors ${
                      difficulty === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
          >
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>

          {generated && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">Preview — {MOCK_QUESTIONS.length} Questions Generated</p>
              {MOCK_QUESTIONS.map((q, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-xs text-muted-foreground font-medium">Q{i + 1}</span>
                    <Badge variant="outline" className="text-sm md:text-[10px] px-1.5 py-0">{q.type}</Badge>
                  </div>
                  <p className="text-sm font-medium">{q.question}</p>
                  {q.options && (
                    <div className="space-y-0.5 pl-2">
                      {q.options.map((opt) => (
                        <p
                          key={opt}
                          className={`text-sm md:text-xs ${opt === q.answer ? "text-green-600 font-semibold" : "text-muted-foreground"}`}
                        >
                          {opt === q.answer ? "✓ " : ""}{opt}
                        </p>
                      ))}
                    </div>
                  )}
                  {!q.options && (
                    <p className="text-sm md:text-xs text-muted-foreground italic">Open-ended response expected</p>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handleSave}>
                  Save as Assignment
                </Button>
                <Button variant="outline" onClick={handleRegenerate} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionCard({ sub, onApprove }) {
  const [overriding, setOverriding] = useState(false);
  const [customGrade, setCustomGrade] = useState("");

  const handleApprove = () => {
    toast.success("Grade submitted!");
    onApprove(sub.id);
  };

  const handleOverride = () => {
    if (!customGrade.trim()) return;
    toast.success(`Grade of ${customGrade} submitted!`);
    setOverriding(false);
    setCustomGrade("");
    onApprove(sub.id);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{sub.studentName}</p>
            <p className="text-sm md:text-xs text-muted-foreground">{sub.assignmentTitle} · {sub.submittedAt}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`rounded-full px-2.5 py-0.5 text-sm md:text-xs font-bold ${
              sub.aiGradeSuggestion.score >= 85 ? "bg-green-500/15 text-green-600" :
              sub.aiGradeSuggestion.score >= 70 ? "bg-blue-500/15 text-blue-600" :
              sub.aiGradeSuggestion.score >= 60 ? "bg-brand-orange/15 text-brand-deep" :
              "bg-red-500/15 text-red-600"
            }`}>
              AI: {sub.aiGradeSuggestion.score}
            </div>
          </div>
        </div>

        <p className="text-sm md:text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed line-clamp-3">
          {sub.content}
        </p>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1">
          <p className="text-sm md:text-xs font-medium text-primary">AI Feedback</p>
          <p className="text-sm md:text-xs text-muted-foreground leading-relaxed">{sub.aiGradeSuggestion.feedback}</p>
        </div>

        {overriding ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter grade (e.g. 85)"
              value={customGrade}
              onChange={(e) => setCustomGrade(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleOverride} className="gap-1">
              <Check className="h-3.5 w-3.5" />
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOverriding(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApprove} className="gap-1.5 flex-1">
              <Check className="h-3.5 w-3.5" />
              Approve ({sub.aiGradeSuggestion.score})
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOverriding(true)}>
              Override
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [dismissedSubs, setDismissedSubs] = useState(new Set());

  const pendingReviewCount = mockAssignments.reduce((s, a) => s + a.pendingReview, 0);
  const atRiskCount = mockStudents.filter((s) => s.status === "at_risk").length;
  const activeAssignments = mockAssignments.filter((a) => a.status === "active").length;
  const classAvg = averageGrade();

  const alertStudents = mockStudents.filter((s) => s.status === "at_risk" || s.status === "struggling");
  const visibleSubs = mockPendingSubmissions.filter((s) => !dismissedSubs.has(s.id));

  const statCards = [
    {
      label: "Submissions to Review",
      value: pendingReviewCount,
      icon: Clock,
      badge: pendingReviewCount > 0 ? { text: `${pendingReviewCount} pending`, className: "bg-red-500/15 text-red-600" } : null,
    },
    {
      label: "Students At Risk",
      value: atRiskCount,
      icon: AlertTriangle,
      badge: atRiskCount > 0 ? { text: "Needs attention", className: "bg-brand-orange/15 text-brand-deep" } : null,
    },
    {
      label: "Active Assignments",
      value: activeAssignments,
      icon: CheckSquare,
      badge: null,
    },
    {
      label: "Class Avg Grade",
      value: classAvg,
      icon: TrendingUp,
      badge: null,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Good morning — here's what needs your attention today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {card.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-sm md:text-[10px] font-semibold ${card.badge.className}`}>
                      {card.badge.text}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Create */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="flex items-center justify-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-5 text-left transition-colors hover:bg-primary/15 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-primary">AI Generate Assignment</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Create questions instantly with AI</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate("/teacher/assignments/create")}
          className="flex items-center justify-center gap-3 rounded-xl border border-border p-5 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary border border-border shrink-0">
            <Plus className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="font-semibold">New Assignment</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Build manually from scratch</p>
          </div>
        </button>
      </div>

      {/* At-Risk Students */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-brand-orange" />
          Students Needing Attention
          <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-sm md:text-xs font-semibold text-brand-deep">
            {alertStudents.length}
          </span>
        </h2>
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {alertStudents.map((s) => {
                const cfg = STATUS_CONFIG[s.status];
                const initials = s.name.split(" ").map((n) => n[0]).join("");
                return (
                  <div key={s.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-sm md:text-[10px] font-semibold ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {s.flaggedReason && (
                        <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{s.flaggedReason}</p>
                      )}
                      <p className="text-sm md:text-xs text-muted-foreground">Last active: {s.lastActive}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{s.currentGrade}</p>
                      <p className="text-sm md:text-xs text-muted-foreground">{s.assignmentsCompleted}/{s.assignmentsTotal} done</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => toast.info("Student profile coming soon")}
                    >
                      View Profile
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Submissions */}
      {visibleSubs.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Submissions
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-sm md:text-xs font-semibold text-red-600">
              {visibleSubs.length}
            </span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleSubs.map((sub) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                onApprove={(id) => setDismissedSubs((prev) => new Set([...prev, id]))}
              />
            ))}
          </div>
        </div>
      )}

      <AIGeneratorModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}
