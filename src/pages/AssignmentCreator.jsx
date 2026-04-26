import { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ClipboardList,
  Palette,
  Brain,
  GripVertical,
  BookOpen,
  CheckSquare,
  ToggleLeft,
  PenLine,
  Underline,
  Sliders,
  HelpCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Type,
  Image,
  Link,
  Minus,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  FileText,
  FolderOpen,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { ScrollArea } from "../components/ui/scroll-area";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import { Progress } from "../components/ui/progress";
import { AuthContext } from "../App";
import { teacherProfile } from "../data/mockTeacherData";
import {
  QUICK_TEMPLATES,
  CANVAS_CARD_TYPES,
  SOCRATIC_EXAMPLES,
  SAVED_ASSIGNMENTS,
  MOCK_LIBRARY_ITEMS,
} from "../data/mockAssignments";

const SUBJECTS = [
  "Biology",
  "Math",
  "History",
  "English",
  "Chemistry",
  "Spanish",
  "Physics",
  "Other",
];

const ICON_MAP = {
  BookOpen,
  CheckSquare,
  ToggleLeft,
  PenLine,
  Underline,
  Sliders,
  HelpCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Type,
  Image,
  Link,
  Minus,
};

function getIcon(name) {
  return ICON_MAP[name] || FileText;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultQuestion(type) {
  const base = { id: uid(), type };
  switch (type) {
    case "multiple_choice":
      return {
        ...base,
        question: "",
        options: ["", "", "", ""],
        correct: 0,
        explanation: "",
        hint: "",
      };
    case "true_false":
      return { ...base, question: "", correct: true, explanation: "", hint: "" };
    case "short_answer":
      return {
        ...base,
        question: "",
        sampleAnswer: "",
        rubric: [],
        hint: "",
        explanation: "",
      };
    case "fill_blank":
      return { ...base, text: "", answer: "", hint: "" };
    case "vocab":
      return { ...base, term: "", definition: "", hint: "" };
    case "slider":
      return {
        ...base,
        question: "",
        min: 1,
        max: 10,
        correctZone: [7, 10],
        label: "",
        showCorrect: false,
      };
    default:
      return { ...base };
  }
}

// ——— Quick Build: Student Preview Modal ———
function QuickBuildPreview({ questions, open, onOpenChange, showHints, showExplanations }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");
  const [sliderValue, setSliderValue] = useState(null);
  const [score, setScore] = useState(0);

  if (!questions?.length) return null;
  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    let correct = false;
    if (q.type === "multiple_choice") correct = selectedOption === q.correct;
    if (q.type === "true_false") correct = selectedOption === q.correct;
    if (q.type === "short_answer") correct = true; // no auto-check
    if (q.type === "fill_blank")
      correct = (fillBlankAnswer?.trim().toLowerCase() || "") === (q.answer?.trim().toLowerCase() || "");
    if (q.type === "vocab") correct = true;
    if (q.type === "slider") {
      const [a, b] = q.correctZone || [q.min, q.max];
      const v = sliderValue ?? q.min;
      correct = v >= Math.min(a, b) && v <= Math.max(a, b);
    }
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
    setRevealed(false);
    setSelectedOption(null);
    setShortAnswer("");
    setFillBlankAnswer("");
    setSliderValue(null);
  };

  const canReveal =
    q.type === "multiple_choice"
      ? selectedOption !== null
      : q.type === "true_false"
        ? selectedOption !== undefined && selectedOption !== null
        : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview as Student</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4">
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length} — Score: {score}/{questions.length}
          </p>
          <p className="font-medium">{q.type === "fill_blank" ? q.text : q.question || "(No question text)"}</p>

          {q.type === "multiple_choice" && (
            <div className="space-y-2">
              {(q.options || []).map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => !revealed && setSelectedOption(i)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    revealed
                      ? i === q.correct
                        ? "border-green-500 bg-green-500/10"
                        : selectedOption === i
                          ? "border-red-500 bg-red-500/10"
                          : "border-border"
                      : selectedOption === i
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {opt || "(empty)"}
                </button>
              ))}
            </div>
          )}

          {q.type === "true_false" && (
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <Button
                  key={String(val)}
                  variant={selectedOption === val ? "default" : "outline"}
                  onClick={() => !revealed && setSelectedOption(val)}
                >
                  {val ? "True" : "False"}
                </Button>
              ))}
            </div>
          )}

          {q.type === "short_answer" && (
            <Textarea
              placeholder="Type your answer..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              rows={3}
              disabled={revealed}
            />
          )}

          {q.type === "fill_blank" && (
            <Input
              placeholder="Your answer"
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
              disabled={revealed}
            />
          )}

          {q.type === "vocab" && (
            <p className="text-sm text-muted-foreground">Term: {q.term} — Definition: {q.definition}</p>
          )}

          {q.type === "slider" && (
            <div className="space-y-2">
              <Label>{q.label || "Value"}</Label>
              <input
                type="range"
                min={q.min}
                max={q.max}
                value={sliderValue ?? q.min}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                disabled={revealed}
                className="w-full"
              />
              <span className="text-sm md:text-xs text-muted-foreground">
                {sliderValue ?? q.min} (min: {q.min}, max: {q.max})
              </span>
            </div>
          )}

          {!revealed && canReveal && (
            <Button onClick={handleReveal}>Check Answer</Button>
          )}

          {revealed && (
            <>
              <div
                className={`rounded-lg border p-3 text-sm ${
                  (q.type === "multiple_choice" && selectedOption === q.correct) ||
                  (q.type === "true_false" && selectedOption === q.correct) ||
                  (q.type === "fill_blank" &&
                    (fillBlankAnswer?.trim().toLowerCase() || "") === (q.answer?.trim().toLowerCase() || "")) ||
                  (q.type === "slider" && (() => {
                    const [a, b] = q.correctZone || [q.min, q.max];
                    const v = sliderValue ?? q.min;
                    return v >= Math.min(a, b) && v <= Math.max(a, b);
                  })())
                    ? "border-green-500 bg-green-500/10 text-green-800 dark:text-green-200"
                    : "border-red-500 bg-red-500/10 text-red-800 dark:text-red-200"
                }`}
              >
                {q.explanation && showExplanations ? q.explanation : "Answer submitted."}
              </div>
              {showHints && q.hint && (
                <p className="text-sm text-brand-deep dark:text-brand-tan">💡 Hint: {q.hint}</p>
              )}
            </>
          )}
        </div>
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          {revealed ? (
            <Button onClick={handleNext}>{isLast ? "Finish" : "Next"}</Button>
          ) : (
            <span />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ——— Socratic: Student Preview Modal ———
function SocraticPreview({ steps, open, onOpenChange }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [response, setResponse] = useState(null); // selected index or fill values etc
  const [showHint, setShowHint] = useState(false);
  const step = steps?.[stepIndex];
  const progress = steps?.length ? ((stepIndex + (answered ? 1 : 0)) / steps.length) * 100 : 0;

  const handleContinue = () => {
    setStepIndex((i) => Math.min((steps?.length || 1) - 1, i + 1));
    setAnswered(false);
    setResponse(null);
    setShowHint(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview Socratic Mode</DialogTitle>
        </DialogHeader>
        <Progress value={progress} className="h-2 mb-4" />
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {steps?.length || 0}
        </p>
        {step && (
          <>
            <p className="font-medium">{step.prompt}</p>
            {step.type === "concept_check" && (
              <div className="space-y-2">
                {(step.options || []).map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !answered && setResponse(i)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      response === i ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {step.type === "fill_equation" && (
              <Input
                placeholder="Fill in the blanks"
                value={response ?? ""}
                onChange={(e) => setResponse(e.target.value)}
                disabled={answered}
              />
            )}
            {step.type === "short_reflect" && (
              <Textarea
                placeholder="Your response..."
                value={response ?? ""}
                onChange={(e) => setResponse(e.target.value)}
                disabled={answered}
                rows={4}
              />
            )}
            {!answered && response !== undefined && response !== "" && (
              <Button
                onClick={() => {
                  setAnswered(true);
                }}
              >
                Submit
              </Button>
            )}
            {answered && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm">
                {step.ifCorrect}
              </div>
            )}
            {answered && (
              <Button onClick={handleContinue}>
                Continue →
              </Button>
            )}
            {step.hint && !showHint && !answered && (
              <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                💡 Show Hint
              </Button>
            )}
            {showHint && step.hint && (
              <p className="text-sm text-brand-deep dark:text-brand-tan">💡 {step.hint}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentCreator() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [mode, setMode] = useState("quick");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showHints, setShowHints] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [quickPreviewOpen, setQuickPreviewOpen] = useState(false);
  const [socraticPreviewOpen, setSocraticPreviewOpen] = useState(false);

  // Quick Build
  const [questions, setQuestions] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  // Canvas
  const [canvasCards, setCanvasCards] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null); // { id, type, fromPalette }

  // Socratic
  const [socraticPath, setSocraticPath] = useState(null);
  const [socraticConfig, setSocraticConfig] = useState({
    topic: "",
    subject: "",
    difficulty: "medium",
    depth: 3,
    multipleChoice: true,
    fillEquation: true,
    ordering: false,
    shortReflect: true,
    tone: "encouraging",
  });
  const [generating, setGenerating] = useState(false);

  if (user?.role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  const classes = teacherProfile?.classes || [];

  const handleLoadTemplate = (template) => {
    setActiveTemplateId(template.id);
    setQuestions(
      (template.defaultQuestions || []).map((q) => ({
        ...q,
        id: uid(),
      }))
    );
  };

  const handleAddQuestion = (type) => {
    const typeMap = {
      "Multiple Choice": "multiple_choice",
      "True/False": "true_false",
      "Short Answer": "short_answer",
      "Fill in Blank": "fill_blank",
      Vocabulary: "vocab",
      Slider: "slider",
    };
    setQuestions((prev) => [...prev, defaultQuestion(typeMap[type] || "multiple_choice")]);
  };

  const handleUpdateQuestion = (id, patch) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const handleRemoveQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleQuickDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === active.id);
      const overIdx = prev.findIndex((q) => q.id === over.id);
      if (idx === -1 || overIdx === -1) return prev;
      return arrayMove(prev, idx, overIdx);
    });
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved.");
  };

  const handlePublish = () => {
    toast.success("Assignment published.");
  };

  const handleGenerateSocratic = () => {
    setGenerating(true);
    setTimeout(() => {
      const match =
        SOCRATIC_EXAMPLES.find(
          (e) =>
            e.subject?.toLowerCase() === socraticConfig.subject?.toLowerCase() ||
            (e.topic?.toLowerCase().includes(socraticConfig.topic?.toLowerCase()) &&
              socraticConfig.topic)
        ) || SOCRATIC_EXAMPLES[0];
      setSocraticPath(JSON.parse(JSON.stringify(match)));
      setGenerating(false);
      toast.success("Socratic path generated.");
    }, 1500);
  };

  const handleLoadSocraticExample = (example) => {
    setSocraticPath(JSON.parse(JSON.stringify(example)));
  };

  const handleAddCanvasCard = (cardTypeId) => {
    setCanvasCards((prev) => [
      ...prev,
      { id: uid(), type: cardTypeId, content: "", label: "" },
    ]);
  };

  const handleCanvasDragStart = (event) => {
    const { active } = event;
    setActiveDragItem({
      id: active.id,
      type: active.data?.current?.type,
      fromPalette: active.data?.current?.fromPalette ?? false,
    });
  };

  const handleCanvasDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;
    const fromPalette = active.data?.current?.fromPalette;
    const cardType = active.data?.current?.type;
    // Palette drop: works whether over is the empty zone OR an existing card
    if (fromPalette && cardType) {
      handleAddCanvasCard(cardType);
      return;
    }
    // Reorder existing cards
    if (!fromPalette && active.id !== over.id) {
      setCanvasCards((prev) => {
        const idx = prev.findIndex((c) => c.id === active.id);
        const overIdx = prev.findIndex((c) => c.id === over.id);
        if (idx === -1 || overIdx === -1) return prev;
        return arrayMove(prev, idx, overIdx);
      });
    }
  };

  const handleCanvasCardUpdate = (id, patch) => {
    setCanvasCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const handleCanvasCardRemove = (id) => {
    setCanvasCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <header className="shrink-0 border-b border-border bg-card/50 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg">Assignment Creator</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSavedDrawerOpen(true)}>
              <FolderOpen className="h-4 w-4 mr-1" />
              My Assignments
            </Button>
            <Input
              className="max-w-[220px]"
              placeholder="Untitled Assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish}>
              Publish →
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm md:text-xs whitespace-nowrap">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm md:text-xs whitespace-nowrap">Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm md:text-xs whitespace-nowrap">Due date</Label>
            <Input
              type="date"
              className="w-[140px] h-8"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showHints ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setShowHints((v) => !v)}
            >
              Show Hints
            </Button>
            <Button
              variant={showExplanations ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setShowExplanations((v) => !v)}
            >
              Show Explanations
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={mode === "quick" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setMode("quick")}
          >
            <ClipboardList className="h-4 w-4" />
            Quick Build
          </Button>
          <Button
            variant={mode === "canvas" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setMode("canvas")}
          >
            <Palette className="h-4 w-4" />
            Canvas Builder
          </Button>
          <Button
            variant={mode === "socratic" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setMode("socratic")}
          >
            <Brain className="h-4 w-4" />
            AI Socratic
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex overflow-hidden">
        {/* Mode 1: Quick Build */}
        {mode === "quick" && (
          <>
            <aside className="w-[280px] shrink-0 border-r border-border flex flex-col bg-muted/20">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-sm">Start from a template</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {QUICK_TEMPLATES.map((t) => {
                    const Icon = getIcon(t.icon);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleLoadTemplate(t)}
                        className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                          activeTemplateId === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${t.color} text-[var(--text-primary)] mb-2`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                        <p className="text-sm md:text-xs text-muted-foreground mt-1">
                          {t.defaultQuestions?.length || 0} questions
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => handleAddQuestion("Multiple Choice")}
                >
                  <Plus className="h-4 w-4" />
                  Blank Question
                </Button>
              </div>
            </aside>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-medium text-sm">Questions ({questions.length})</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      Add Question <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {["Multiple Choice", "True/False", "Short Answer", "Fill in Blank", "Vocabulary", "Slider"].map(
                      (label) => (
                        <DropdownMenuItem key={label} onClick={() => handleAddQuestion(label)}>
                          {label}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) =>
                      setActiveDragItem({ id: e.active.id, fromPalette: false, type: "quick" })
                    }
                    onDragEnd={(e) => {
                      setActiveDragItem(null);
                      handleQuickDragEnd(e);
                    }}
                  >
                    <SortableContext
                      items={questions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {questions.map((q) => (
                        <QuickQuestionCard
                          key={q.id}
                          question={q}
                          onUpdate={(patch) => handleUpdateQuestion(q.id, patch)}
                          onRemove={() => handleRemoveQuestion(q.id)}
                          showHints={showHints}
                          showExplanations={showExplanations}
                        />
                      ))}
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                      {activeDragItem?.type === "quick" && (() => {
                        const q = questions.find((q) => q.id === activeDragItem.id);
                        if (!q) return null;
                        const typeColors = {
                          multiple_choice: "bg-blue-500/15 text-blue-700",
                          true_false: "bg-green-500/15 text-green-700",
                          short_answer: "bg-orange-500/15 text-orange-700",
                          fill_blank: "bg-pink-500/15 text-pink-700",
                          vocab: "bg-orange-600/15 text-orange-400",
                          slider: "bg-teal-500/15 text-teal-700",
                        };
                        const label = q.type?.replace("_", " ") || "question";
                        const text = q.question || q.text || q.term || "Untitled question";
                        return (
                          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg flex items-center gap-3 cursor-grabbing opacity-95">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className={`text-sm md:text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[q.type] || "bg-[var(--va-border)]/30"}`}>
                              {label}
                            </span>
                            <span className="text-sm truncate max-w-[300px]">{text}</span>
                          </div>
                        );
                      })()}
                    </DragOverlay>
                  </DndContext>
                  {questions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Select a template or add a blank question.
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-border flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setQuickPreviewOpen(true)}>
                  Preview as Student →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Mode 2: Canvas Builder */}
        {mode === "canvas" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleCanvasDragStart}
            onDragEnd={handleCanvasDragEnd}
          >
          <>
            <aside className="w-[260px] shrink-0 border-r border-border flex flex-col bg-muted/20">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-sm">Drag cards onto the canvas</h3>
                <p className="text-sm md:text-xs text-muted-foreground">Build your own question flow</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-4">
                  <div>
                    <p className="text-sm md:text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Question Types
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {["question_card", "true_false_card", "fill_blank_card", "slider_card"].map((id) => {
                        const card = CANVAS_CARD_TYPES.find((c) => c.id === id);
                        if (!card) return null;
                        const Icon = getIcon(card.icon);
                        return (
                          <CanvasPaletteItem
                            key={id}
                            id={id}
                            card={card}
                            Icon={Icon}
                            onAdd={() => handleAddCanvasCard(id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm md:text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Answer Cards
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {["correct_card", "incorrect_card"].map((id) => {
                        const card = CANVAS_CARD_TYPES.find((c) => c.id === id);
                        if (!card) return null;
                        const Icon = getIcon(card.icon);
                        return (
                          <CanvasPaletteItem
                            key={id}
                            id={id}
                            card={card}
                            Icon={Icon}
                            onAdd={() => handleAddCanvasCard(id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm md:text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Support & Layout
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {CANVAS_CARD_TYPES.filter((c) =>
                        ["hint_card", "explanation_card", "text_block", "link_block", "image_block", "divider"].includes(
                          c.id
                        )
                      ).map((c) => (
                        <CanvasPaletteItem
                          key={c.id}
                          id={c.id}
                          card={c}
                          Icon={getIcon(c.icon)}
                          onAdd={() => handleAddCanvasCard(c.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <Tabs defaultValue="library" className="border-t border-border">
                <TabsList className="w-full rounded-none h-9">
                  <TabsTrigger value="library" className="flex-1 text-sm md:text-xs">
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex-1 text-sm md:text-xs">
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 text-sm md:text-xs">
                    Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="library" className="p-2 max-h-[160px] overflow-y-auto">
                  {MOCK_LIBRARY_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="rounded border border-border p-2 text-sm md:text-xs mb-2 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="upload" className="p-2">
                  <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    Drop file or click to upload
                  </div>
                </TabsContent>
                <TabsContent value="link" className="p-2">
                  <div className="flex gap-2">
                    <Input placeholder="URL" className="h-8 text-sm" />
                    <Button size="sm" onClick={() => handleAddCanvasCard("link_block")}>
                      Add
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </aside>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
              <CanvasDropZone
                isEmpty={canvasCards.length === 0}
                cardIds={canvasCards.map((c) => c.id)}
                cards={canvasCards}
                onUpdate={handleCanvasCardUpdate}
                onRemove={handleCanvasCardRemove}
              />
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDragItem?.fromPalette && (() => {
                const def = CANVAS_CARD_TYPES.find((c) => c.id === activeDragItem.type);
                if (!def) return null;
                const Icon = getIcon(def.icon);
                return (
                  <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-sm shadow-lg cursor-grabbing ${def.color}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{def.label}</span>
                  </div>
                );
              })()}
              {activeDragItem && !activeDragItem.fromPalette && (() => {
                const card = canvasCards.find((c) => c.id === activeDragItem.id);
                if (!card) return null;
                const def = CANVAS_CARD_TYPES.find((c) => c.id === card.type);
                const Icon = def ? getIcon(def.icon) : Type;
                return (
                  <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-sm shadow-lg cursor-grabbing opacity-90 ${def?.color ?? "bg-muted"}`}>
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="capitalize">{def?.label ?? card.type}</span>
                  </div>
                );
              })()}
            </DragOverlay>
          </>
          </DndContext>
        )}

        {/* Mode 3: AI Socratic */}
        {mode === "socratic" && (
          <>
            <aside className="w-[300px] shrink-0 border-r border-border flex flex-col bg-muted/20">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-sm flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Socratic Builder
                </h3>
                <p className="text-sm md:text-xs text-muted-foreground mt-1">
                  Describe what you want to teach. AI builds a step-by-step guided experience.
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                  <div>
                    <Label className="text-sm md:text-xs">What topic is this assignment on?</Label>
                    <Input
                      placeholder="e.g. Mitosis and cell division"
                      value={socraticConfig.topic}
                      onChange={(e) =>
                        setSocraticConfig((c) => ({ ...c, topic: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm md:text-xs">Subject</Label>
                    <Select
                      value={socraticConfig.subject}
                      onValueChange={(v) =>
                        setSocraticConfig((c) => ({ ...c, subject: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm md:text-xs">Difficulty</Label>
                    <div className="flex gap-1 mt-2">
                      {["easy", "medium", "hard"].map((d) => (
                        <Button
                          key={d}
                          variant={socraticConfig.difficulty === d ? "default" : "outline"}
                          size="sm"
                          className="capitalize"
                          onClick={() =>
                            setSocraticConfig((c) => ({ ...c, difficulty: d }))
                          }
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm md:text-xs">Depth (1 = quick check, 5 = deep dive)</Label>
                    <Slider
                      value={[socraticConfig.depth]}
                      onValueChange={([v]) =>
                        setSocraticConfig((c) => ({ ...c, depth: v }))
                      }
                      min={1}
                      max={5}
                      className="mt-2"
                    />
                    <p className="text-sm md:text-[10px] text-muted-foreground mt-1">
                      Quick Check — Deep Dive
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm md:text-xs">Style</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { key: "multipleChoice", label: "Multiple choice steps" },
                        { key: "fillEquation", label: "Fill in the equation/blank" },
                        { key: "ordering", label: "Ordering/sequencing steps" },
                        { key: "shortReflect", label: "Short reflection prompts" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={key}
                            checked={socraticConfig[key]}
                            onCheckedChange={(checked) =>
                              setSocraticConfig((c) => ({ ...c, [key]: !!checked }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm md:text-xs font-normal">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm md:text-xs">Tone</Label>
                    <div className="flex gap-1 mt-2">
                      {["encouraging", "neutral", "challenging"].map((t) => (
                        <Button
                          key={t}
                          variant={socraticConfig.tone === t ? "default" : "outline"}
                          size="sm"
                          className="capitalize"
                          onClick={() =>
                            setSocraticConfig((c) => ({ ...c, tone: t }))
                          }
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleGenerateSocratic}
                    disabled={generating}
                  >
                    {generating ? (
                      <>Loading…</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Socratic Path
                      </>
                    )}
                  </Button>
                  <p className="text-sm md:text-xs text-muted-foreground">Uses ~3 AI credits</p>
                  {socraticPath && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSocratic}
                        disabled={generating}
                      >
                        Regenerate
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Load Example <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {SOCRATIC_EXAMPLES.map((ex) => (
                            <DropdownMenuItem
                              key={ex.id}
                              onClick={() => handleLoadSocraticExample(ex)}
                            >
                              {ex.topic}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {!socraticPath ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                  <p className="font-medium">Your Socratic path will appear here</p>
                  <p className="text-sm mt-1">Configure and generate on the left →</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    {socraticPath.steps?.map((step, idx) => (
                      <SocraticStepCard
                        key={idx}
                        step={step}
                        onUpdate={(patch) => {
                          setSocraticPath((prev) => ({
                            ...prev,
                            steps: prev.steps.map((s, i) =>
                              i === idx ? { ...s, ...patch } : s
                            ),
                          }));
                        }}
                        onAddAfter={() => {
                          setSocraticPath((prev) => ({
                            ...prev,
                            steps: [
                              ...prev.steps.slice(0, idx + 1),
                              {
                                stepNumber: prev.steps.length + 1,
                                type: "concept_check",
                                prompt: "",
                                options: ["", "", "", ""],
                                correct: 0,
                                ifCorrect: "",
                                ifWrong: "",
                                hint: "",
                              },
                              ...prev.steps.slice(idx + 1),
                            ],
                          }));
                        }}
                        onRemove={() => {
                          setSocraticPath((prev) => ({
                            ...prev,
                            steps: prev.steps.filter((_, i) => i !== idx),
                          }));
                        }}
                      />
                    ))}
                    <Button
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => {
                        setSocraticPath((prev) => ({
                          ...prev,
                          steps: [
                            ...(prev?.steps || []),
                            {
                              stepNumber: (prev?.steps?.length || 0) + 1,
                              type: "concept_check",
                              prompt: "",
                              options: ["", "", "", ""],
                              correct: 0,
                              ifCorrect: "",
                              ifWrong: "",
                              hint: "",
                            },
                          ],
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Custom Step
                    </Button>
                  </div>
                </ScrollArea>
              )}
              {socraticPath && (
                <div className="p-3 border-t border-border flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSocraticPreviewOpen(true)}
                  >
                    Preview Socratic Mode →
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Saved Assignments Sheet */}
      <Sheet open={savedDrawerOpen} onOpenChange={setSavedDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>My Assignments</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full gap-1 mb-4"
              onClick={() => {
                setSavedDrawerOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
            <div className="space-y-2">
              {SAVED_ASSIGNMENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    toast.info("Loading assignment...");
                  }}
                  className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{a.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-sm md:text-[10px]">
                      {a.mode === "quick" ? "Quick" : a.mode === "canvas" ? "Canvas" : "Socratic"}
                    </Badge>
                    <Badge
                      variant={a.status === "published" ? "default" : "outline"}
                      className="text-sm md:text-[10px]"
                    >
                      {a.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm md:text-xs text-muted-foreground mt-1">
                    {a.class || "—"} · Due {a.dueDate || "—"}
                    {a.completions != null && ` · ${a.completions} completions`}
                    {a.avgScore != null && ` · ${a.avgScore}% avg`}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <QuickBuildPreview
        questions={questions}
        open={quickPreviewOpen}
        onOpenChange={setQuickPreviewOpen}
        showHints={showHints}
        showExplanations={showExplanations}
      />
      <SocraticPreview
        steps={socraticPath?.steps}
        open={socraticPreviewOpen}
        onOpenChange={setSocraticPreviewOpen}
      />
    </div>
  );
}

// ——— Sortable Quick Build question card ———
function QuickQuestionCard({ question, onUpdate, onRemove, showHints, showExplanations }) {
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeColors = {
    multiple_choice: "bg-blue-500/15 text-blue-700",
    true_false: "bg-green-500/15 text-green-700",
    short_answer: "bg-orange-500/15 text-orange-700",
    fill_blank: "bg-pink-500/15 text-pink-700",
    vocab: "bg-orange-600/15 text-orange-400",
    slider: "bg-teal-500/15 text-teal-700",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-card p-4 ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColors[question.type] || "bg-[var(--va-border)]/30"}>
              {question.type?.replace("_", " ") || "question"}
            </Badge>
          </div>
          {question.type !== "fill_blank" && question.type !== "vocab" && (
            <Input
              placeholder="Question text"
              value={question.question ?? ""}
              onChange={(e) => onUpdate({ question: e.target.value })}
              className="font-medium"
            />
          )}
          {question.type === "fill_blank" && (
            <>
              <Input
                placeholder="Sentence with ___ for blank"
                value={question.text ?? ""}
                onChange={(e) => onUpdate({ text: e.target.value })}
              />
              <Input
                placeholder="Correct answer"
                value={question.answer ?? ""}
                onChange={(e) => onUpdate({ answer: e.target.value })}
              />
            </>
          )}
          {question.type === "vocab" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Term"
                value={question.term ?? ""}
                onChange={(e) => onUpdate({ term: e.target.value })}
              />
              <Input
                placeholder="Definition"
                value={question.definition ?? ""}
                onChange={(e) => onUpdate({ definition: e.target.value })}
              />
            </div>
          )}
          {question.type === "multiple_choice" && (
            <div className="space-y-2 pl-2">
              {(question.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correct === i}
                    onChange={() => onUpdate({ correct: i })}
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...(question.options || [])];
                      next[i] = e.target.value;
                      onUpdate({ options: next });
                    }}
                    className="flex-1"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm md:text-xs text-primary hover:underline"
                onClick={() =>
                  onUpdate({ options: [...(question.options || []), ""] })
                }
              >
                + Add option
              </button>
            </div>
          )}
          {question.type === "true_false" && (
            <div className="flex gap-2">
              <Button
                variant={question.correct === true ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdate({ correct: true })}
              >
                True
              </Button>
              <Button
                variant={question.correct === false ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdate({ correct: false })}
              >
                False
              </Button>
            </div>
          )}
          {question.type === "short_answer" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Sample answer"
                value={question.sampleAnswer ?? ""}
                onChange={(e) => onUpdate({ sampleAnswer: e.target.value })}
                rows={2}
              />
              <div className="flex flex-wrap gap-1">
                {(question.rubric || []).map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-sm md:text-xs">
                    {r}
                  </Badge>
                ))}
                <Input
                  className="w-24 inline-block h-6 text-sm md:text-xs"
                  placeholder="+ rubric"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.target.value?.trim();
                      if (v)
                        onUpdate({
                          rubric: [...(question.rubric || []), v],
                        });
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          )}
          {question.type === "slider" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <Label className="text-sm md:text-xs">Min</Label>
                <Input
                  type="number"
                  value={question.min ?? 1}
                  onChange={(e) => onUpdate({ min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-sm md:text-xs">Max</Label>
                <Input
                  type="number"
                  value={question.max ?? 10}
                  onChange={(e) => onUpdate({ max: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-sm md:text-xs">Correct zone [min, max]</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={question.correctZone?.[0] ?? question.min}
                    onChange={(e) =>
                      onUpdate({
                        correctZone: [
                          Number(e.target.value),
                          question.correctZone?.[1] ?? question.max,
                        ],
                      })
                    }
                  />
                  <Input
                    type="number"
                    value={question.correctZone?.[1] ?? question.max}
                    onChange={(e) =>
                      onUpdate({
                        correctZone: [
                          question.correctZone?.[0] ?? question.min,
                          Number(e.target.value),
                        ],
                      })
                    }
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-sm md:text-xs">Label</Label>
                <Input
                  value={question.label ?? ""}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="e.g. Confidence Level"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
            {showHints && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-sm md:text-xs gap-1"
                onClick={() => setShowHint((v) => !v)}
              >
                💡 Add Hint
              </Button>
            )}
            {showExplanations && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-sm md:text-xs gap-1"
                onClick={() => setShowExplanation((v) => !v)}
              >
                📖 Add Explanation
              </Button>
            )}
            {showHint && (
              <Textarea
                placeholder="Hint text"
                value={question.hint ?? ""}
                onChange={(e) => onUpdate({ hint: e.target.value })}
                rows={1}
                className="flex-1 min-w-[200px]"
              />
            )}
            {showExplanation && (
              <Textarea
                placeholder="Explanation (shown after answer)"
                value={question.explanation ?? ""}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                rows={1}
                className="flex-1 min-w-[200px]"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——— Canvas palette item (draggable + click to add) ———
function CanvasPaletteItem({ id, card, Icon, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${id}`,
    data: { type: id, fromPalette: true },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onAdd()}
      className={`w-full rounded-lg border p-2 text-left flex items-center gap-2 text-sm ${card.color} ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{card.label}</span>
    </button>
  );
}

// ——— Canvas drop zone (droppable + sortable list) ———
function CanvasDropZone({ isEmpty, cardIds, cards, onUpdate, onRemove }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-xl border-2 border-dashed min-h-[200px] overflow-y-auto ${
        isEmpty
          ? "flex items-center justify-center text-muted-foreground"
          : "border-border"
      } ${isOver ? "bg-primary/5 border-primary/50" : ""}`}
    >
      {isEmpty ? (
        <p>Drag cards here to build your assignment</p>
      ) : (
        <SortableContext
          items={cardIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2">
            {cards.map((card) => (
              <CanvasCard
                key={card.id}
                card={card}
                onUpdate={(patch) => onUpdate(card.id, patch)}
                onRemove={() => onRemove(card.id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// ——— Sortable canvas card ———
function CanvasCard({ card, onUpdate, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const def = CANVAS_CARD_TYPES.find((c) => c.id === card.type);
  const Icon = def ? getIcon(def.icon) : Type;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const headerClass = {
    question_card: "bg-blue-500/10 border-blue-500/30 text-blue-700",
    correct_card: "bg-green-500/10 border-green-500/30 text-green-700",
    incorrect_card: "bg-red-500/10 border-red-500/30 text-red-700",
    hint_card: "bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)]",
    explanation_card: "bg-orange-600/10 border-orange-500/30 text-orange-400",
    true_false_card: "bg-teal-500/10 border-teal-500/30 text-teal-700",
    text_block: "bg-[var(--va-border)]/20 border-[var(--va-border)]",
    image_block: "bg-orange-600/10 border-orange-500/30 text-orange-400",
    fill_blank_card: "bg-pink-500/10 border-pink-500/30 text-pink-700",
    slider_card: "bg-cyan-500/10 border-cyan-500/30 text-cyan-700",
    divider: "bg-[var(--va-border)]/15 border-[var(--va-border)]",
    link_block: "bg-orange-500/10 border-orange-500/30 text-orange-700",
  }[card.type] || "bg-[var(--va-border)]/20";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border ${isDragging ? "opacity-50" : ""} overflow-hidden`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${headerClass}`}
      >
        <button
          type="button"
          className="touch-none cursor-grab"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-medium capitalize">
          {card.type === "question_card"
            ? "Question"
            : card.type === "correct_card"
              ? "✓ Correct Answer"
              : card.type === "incorrect_card"
                ? "✗ Wrong Answer"
                : card.type === "hint_card"
                  ? "💡 Hint"
                  : card.type === "explanation_card"
                    ? "📖 Explanation"
                    : card.type === "true_false_card"
                      ? "True / False"
                      : card.type === "text_block"
                        ? "Context"
                        : card.type === "image_block"
                          ? "Image"
                          : card.type === "fill_blank_card"
                            ? "Fill in Blank"
                            : card.type === "slider_card"
                              ? "Slider"
                              : card.type === "divider"
                                ? "Section Break"
                                : card.type === "link_block"
                                  ? "Resource Link"
                                  : card.type}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {!collapsed && (
        <div className="p-3 bg-card space-y-2">
          {["question_card", "correct_card", "incorrect_card", "hint_card", "explanation_card"].includes(
            card.type
          ) && (
            <Input
              placeholder={card.type === "question_card" ? "Question text..." : "Content..."}
              value={card.content ?? ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
            />
          )}
          {card.type === "true_false_card" && (
            <Textarea
              placeholder="Question"
              value={card.content ?? ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
            />
          )}
          {card.type === "text_block" && (
            <Textarea
              placeholder="Context / reading passage..."
              value={card.content ?? ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={4}
            />
          )}
          {card.type === "fill_blank_card" && (
            <>
              <Input
                placeholder="Sentence with [BLANK]"
                value={card.content ?? ""}
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
              <Input
                placeholder="Answer"
                value={card.answer ?? ""}
                onChange={(e) => onUpdate({ answer: e.target.value })}
              />
            </>
          )}
          {card.type === "slider_card" && (
            <div className="space-y-2">
              <Input
                placeholder="Question"
                value={card.content ?? ""}
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={card.min ?? 1}
                  onChange={(e) => onUpdate({ min: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={card.max ?? 10}
                  onChange={(e) => onUpdate({ max: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          {card.type === "divider" && (
            <Input
              placeholder="Section label (optional)"
              value={card.label ?? ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          )}
          {card.type === "image_block" && (
            <div className="rounded border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Upload or paste image URL
            </div>
          )}
          {card.type === "link_block" && (
            <div className="space-y-2">
              <Input
                placeholder="URL"
                value={card.content ?? ""}
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
              <Input
                placeholder="Display label"
                value={card.label ?? ""}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ——— Socratic step card ———
function SocraticStepCard({ step, onUpdate, onAddAfter, onRemove }) {
  const [openCorrect, setOpenCorrect] = useState(false);
  const [openWrong, setOpenWrong] = useState(false);
  const [openHint, setOpenHint] = useState(false);
  const typeLabels = {
    concept_check: "Concept Check",
    fill_equation: "Fill Equation",
    ordering: "Ordering",
    short_reflect: "Reflection",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">Step {step.stepNumber}</Badge>
        <Badge variant="outline">{typeLabels[step.type] || step.type}</Badge>
      </div>
      <Textarea
        placeholder="Prompt"
        value={step.prompt ?? ""}
        onChange={(e) => onUpdate({ prompt: e.target.value })}
        rows={2}
      />
      {step.type === "concept_check" && (
        <div className="space-y-2">
          {(step.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`socratic-${step.stepNumber}`}
                checked={step.correct === i}
                onChange={() => onUpdate({ correct: i })}
              />
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...(step.options || [])];
                  next[i] = e.target.value;
                  onUpdate({ options: next });
                }}
                placeholder={`Option ${i + 1}`}
              />
            </div>
          ))}
        </div>
      )}
      {step.type === "fill_equation" && (
        <Input
          placeholder="Blanks (comma-separated)"
          value={(step.blanks || []).join(", ")}
          onChange={(e) =>
            onUpdate({
              blanks: e.target.value.split(",").map((s) => s.trim()),
            })
          }
        />
      )}
      {step.type === "short_reflect" && (
        <div className="space-y-2">
          <Textarea
            placeholder="Sample answer"
            value={step.sampleAnswer ?? ""}
            onChange={(e) => onUpdate({ sampleAnswer: e.target.value })}
            rows={2}
          />
          <div className="text-sm md:text-xs text-muted-foreground">Rubric: {(step.rubric || []).join(", ")}</div>
        </div>
      )}
      {step.type === "ordering" && (
        <div className="space-y-2">
          <Label className="text-sm md:text-xs">Items (one per line, correct order)</Label>
          <Textarea
            placeholder="Item 1\nItem 2\n..."
            value={(step.correctOrder || step.items || []).join("\n")}
            onChange={(e) =>
              onUpdate({
                items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                correctOrder: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
            rows={4}
          />
        </div>
      )}
      <Collapsible open={openCorrect} onOpenChange={setOpenCorrect}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-green-700 gap-1">
            <ChevronRight className="h-4 w-4" />
            If Correct
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea
            value={step.ifCorrect ?? ""}
            onChange={(e) => onUpdate({ ifCorrect: e.target.value })}
            placeholder="Response when correct"
            rows={2}
            className="mt-1 border-green-500/30"
          />
        </CollapsibleContent>
      </Collapsible>
      <Collapsible open={openWrong} onOpenChange={setOpenWrong}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-700 gap-1">
            <ChevronRight className="h-4 w-4" />
            If Wrong
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea
            value={step.ifWrong ?? ""}
            onChange={(e) => onUpdate({ ifWrong: e.target.value })}
            placeholder="Response when wrong"
            rows={2}
            className="mt-1 border-red-500/30"
          />
        </CollapsibleContent>
      </Collapsible>
      <Collapsible open={openHint} onOpenChange={setOpenHint}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-amber-700 gap-1">
            <ChevronRight className="h-4 w-4" />
            Hint
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Input
            value={step.hint ?? ""}
            onChange={(e) => onUpdate({ hint: e.target.value })}
            placeholder="Hint text"
            className="mt-1 border-brand-orange/30"
          />
        </CollapsibleContent>
      </Collapsible>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onAddAfter}>
          + Add Step After
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          Delete Step
        </Button>
      </div>
    </div>
  );
}
