import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit2, Eye, Sparkles, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { RotateCcw, Check } from "lucide-react";
import { mockAssignments, teacherProfile } from "../../data/mockTeacherData";

const STATUS_CONFIG = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-blue-500/15 text-blue-600" },
  graded: { label: "Graded", className: "bg-green-500/15 text-green-600" },
};

const TYPE_CONFIG = {
  assignment: "bg-brand-deep/15 text-brand-deep",
  quiz: "bg-brand-orange/15 text-brand-deep",
  test: "bg-red-500/15 text-red-600",
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
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1500);
  };

  const handleSave = () => {
    toast.success("Assignment created! +10 XP");
    setGenerated(false);
    setTopic("");
    onClose();
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
                <button key={t} type="button" onClick={() => setQType(t)}
                  className={`rounded-full px-3 py-1 text-sm border transition-colors ${qType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Input type="number" min={1} max={20} value={numQ}
                onChange={(e) => setNumQ(Math.min(20, Math.max(1, Number(e.target.value))))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map((d) => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-sm border transition-colors ${difficulty === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button className="w-full gap-2" onClick={handleGenerate} disabled={generating || !topic.trim()}>
            {generating ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate with AI</>
            )}
          </Button>
          {generated && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">Preview — {MOCK_QUESTIONS.length} Questions Generated</p>
              {MOCK_QUESTIONS.map((q, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-xs text-muted-foreground font-medium">Q{i + 1}</span>
                    <span className="rounded border px-1.5 py-0 text-sm md:text-[10px]">{q.type}</span>
                  </div>
                  <p className="text-sm font-medium">{q.question}</p>
                  {q.options && (
                    <div className="space-y-0.5 pl-2">
                      {q.options.map((opt) => (
                        <p key={opt} className={`text-sm md:text-xs ${opt === q.answer ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                          {opt === q.answer ? "✓ " : ""}{opt}
                        </p>
                      ))}
                    </div>
                  )}
                  {!q.options && <p className="text-sm md:text-xs text-muted-foreground italic">Open-ended response expected</p>}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handleSave}>Save as Assignment</Button>
                <Button variant="outline" onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 1200); }} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FILTERS = ["All", "Active", "Draft", "Graded"];

function getClassName(classId) {
  const cls = teacherProfile.classes.find((c) => c.id === classId);
  return cls ? cls.name.replace(/^Period \d+ — /, "") : classId;
}

export default function Assignments({ autoOpenAI = false }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [aiOpen, setAiOpen] = useState(autoOpenAI);

  const filtered = mockAssignments.filter((a) =>
    filter === "All" ? true : a.status === filter.toLowerCase()
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Assignments</h1>
          <p className="text-muted-foreground mt-1">{mockAssignments.length} total assignments across all classes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4" />
            AI Generate
          </Button>
          <Button className="gap-2" onClick={() => navigate("/teacher/assignments/create")}>
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-sm md:text-[10px]">
              {f === "All" ? mockAssignments.length : mockAssignments.filter((a) => a.status === f.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="hidden gap-x-4 border-b border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] lg:text-xs">
          <span>Title</span>
          <span>Class</span>
          <span>Type</span>
          <span>Due Date</span>
          <span>Submissions</span>
          <span>Avg Grade</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((a) => {
            const statusCfg = STATUS_CONFIG[a.status];
            return (
              <div
                key={a.id}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-muted/30 lg:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] lg:gap-x-4 lg:gap-y-0"
              >
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.pendingReview > 0 && (
                    <p className="text-sm md:text-[10px] text-red-500 font-medium">{a.pendingReview} pending review</p>
                  )}
                </div>
                <span className="text-sm md:text-xs text-muted-foreground whitespace-nowrap">{getClassName(a.classId)}</span>
                <span className={`rounded-full px-2 py-0.5 text-sm md:text-[10px] font-semibold capitalize ${TYPE_CONFIG[a.type]}`}>
                  {a.type}
                </span>
                <span className="text-sm md:text-xs text-muted-foreground whitespace-nowrap">{a.dueDate}</span>
                <span className="text-sm md:text-xs text-center">
                  {a.submissionsReceived}/{a.totalStudents}
                </span>
                <span className="text-sm md:text-xs text-center font-medium">
                  {a.avgGrade !== null ? `${a.avgGrade}%` : "—"}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-sm md:text-[10px] font-semibold ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.info("Editor coming soon")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info("Submissions view coming soon")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AIGeneratorModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
