import { useState } from "react";
import { FilePlus, Plus, Trash2, GripVertical, Clock } from "lucide-react";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, DifficultyCards, QuantitySlider, ToggleOption, GenerateButton, LivePreviewHint } from "../FormComponents";
import { toast } from "sonner";

// ─── Shared mock data ────────────────────────────────────────────────────────

const mockClasses = [
  { id: 1, name: "7th Grade Math", subject: "Math", gradeLevel: "7th" },
  { id: 2, name: "AP English Literature", subject: "ELA", gradeLevel: "11th" },
  { id: 3, name: "Biology Honors", subject: "Science", gradeLevel: "10th" },
];

const DIFFICULTY_LEVELS = [
  { value: "Easy", icon: "🌱", desc: "Foundational recall" },
  { value: "Medium", icon: "⚡", desc: "Apply & analyze" },
  { value: "Hard", icon: "🔥", desc: "Critical thinking" },
  { value: "Mixed", icon: "🎲", desc: "All levels combined" },
];

const PROMPT = `Generate a [difficulty] multiple choice quiz for [gradeLevel] [subject] students on: [topic]. Create [numQuestions] questions, each with 4 choices (A, B, C, D). [answerKey] Number each question. Put each choice on its own line.`;

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "matching", label: "Matching" },
];

const MAX_ATTEMPTS_OPTIONS = [
  { value: "1", label: "1 attempt" },
  { value: "2", label: "2 attempts" },
  { value: "3", label: "3 attempts" },
  { value: "unlimited", label: "Unlimited" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeQuestion(type = "multiple_choice") {
  const base = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`, type, text: "" };
  if (type === "multiple_choice") return { ...base, options: ["", "", "", ""], correctOption: 0 };
  if (type === "true_false") return { ...base, correctBool: true };
  if (type === "short_answer") return { ...base, correctAnswer: "" };
  if (type === "matching") return { ...base, pairs: [{ left: "", right: "" }] };
  return base;
}

function quizToText(title, questions, settings) {
  const lines = [];
  lines.push(`Quiz: ${title || "Untitled Quiz"}`);
  if (settings.timeLimit) lines.push(`Time Limit: ${settings.timeLimit} minutes`);
  lines.push(`Max Attempts: ${settings.maxAttempts === "unlimited" ? "Unlimited" : settings.maxAttempts}`);
  lines.push("");

  questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.text || "(no question text)"}`);
    if (q.type === "multiple_choice") {
      ["A", "B", "C", "D"].forEach((letter, oi) => {
        const marker = oi === q.correctOption ? "✓" : " ";
        lines.push(`   ${marker} ${letter}. ${q.options[oi] || "(empty)"}`);
      });
    } else if (q.type === "true_false") {
      lines.push(`   ${q.correctBool ? "✓" : " "} True`);
      lines.push(`   ${!q.correctBool ? "✓" : " "} False`);
    } else if (q.type === "short_answer") {
      lines.push(`   Correct answer: ${q.correctAnswer || "(not set)"}`);
    } else if (q.type === "matching") {
      lines.push("   Match each term:");
      q.pairs.forEach((p, pi) => {
        lines.push(`   ${pi + 1}. ${p.left || "(term)"} → ${p.right || "(definition)"}`);
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

// ─── Quiz Settings Panel (shared by both tabs) ───────────────────────────────

function QuizSettingsPanel({ timeLimit, setTimeLimit, maxAttempts, setMaxAttempts }) {
  return (
    <div className="rounded-xl border-2 border-border bg-secondary/20 p-4 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Quiz Settings
      </p>

      {/* Time limit */}
      <div className="space-y-1.5">
        <Label className="text-sm md:text-xs text-muted-foreground uppercase tracking-wide">
          Time Limit
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="180"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="No limit"
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
          {timeLimit && (
            <button
              type="button"
              onClick={() => setTimeLimit("")}
              className="text-sm md:text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-sm md:text-[11px] text-muted-foreground">Leave blank for no time limit.</p>
      </div>

      {/* Max attempts */}
      <div className="space-y-1.5">
        <Label className="text-sm md:text-xs text-muted-foreground uppercase tracking-wide">
          Max Attempts
        </Label>
        <div className="flex gap-2 flex-wrap">
          {MAX_ATTEMPTS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMaxAttempts(opt.value)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm md:text-xs font-medium transition-all ${
                maxAttempts === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Question editors ─────────────────────────────────────────────────────────

function MultipleChoiceEditor({ question, onChange }) {
  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name={`correct_${question.id}`}
            checked={question.correctOption === i}
            onChange={() => onChange({ ...question, correctOption: i })}
            className="h-4 w-4 accent-primary shrink-0"
            title="Mark as correct answer"
          />
          <input
            type="text"
            value={opt}
            onChange={(e) => {
              const opts = [...question.options];
              opts[i] = e.target.value;
              onChange({ ...question, options: opts });
            }}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
          />
        </div>
      ))}
      <p className="text-sm md:text-[10px] text-muted-foreground pl-6">Select the radio button next to the correct answer.</p>
    </div>
  );
}

function TrueFalseEditor({ question, onChange }) {
  return (
    <div className="space-y-2">
      {[true, false].map((val) => (
        <div key={String(val)} className="flex items-center gap-2">
          <input
            type="radio"
            name={`tf_${question.id}`}
            checked={question.correctBool === val}
            onChange={() => onChange({ ...question, correctBool: val })}
            className="h-4 w-4 accent-primary shrink-0"
          />
          <span className="text-sm text-foreground">{val ? "True" : "False"}</span>
        </div>
      ))}
    </div>
  );
}

function ShortAnswerEditor({ question, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm md:text-xs text-muted-foreground">Correct Answer (exact match)</Label>
      <input
        type="text"
        value={question.correctAnswer}
        onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
        placeholder="Type the exact correct answer..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
      />
    </div>
  );
}

function MatchingEditor({ question, onChange }) {
  const updatePair = (i, side, value) => {
    const pairs = question.pairs.map((p, pi) =>
      pi === i ? { ...p, [side]: value } : p
    );
    onChange({ ...question, pairs });
  };

  const addPair = () =>
    onChange({ ...question, pairs: [...question.pairs, { left: "", right: "" }] });

  const removePair = (i) =>
    onChange({ ...question, pairs: question.pairs.filter((_, pi) => pi !== i) });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
        <span className="text-sm md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Term</span>
        <span className="text-sm md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Definition</span>
      </div>
      {question.pairs.map((pair, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
          <input
            type="text"
            value={pair.left}
            onChange={(e) => updatePair(i, "left", e.target.value)}
            placeholder={`Term ${i + 1}`}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={pair.right}
              onChange={(e) => updatePair(i, "right", e.target.value)}
              placeholder={`Definition ${i + 1}`}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
            />
            {question.pairs.length > 1 && (
              <button
                type="button"
                onClick={() => removePair(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="flex items-center gap-1.5 text-sm md:text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add pair
      </button>
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ question, index, onChange, onRemove }) {
  return (
    <div className="rounded-xl border-2 border-border bg-background p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <span className="text-sm md:text-xs font-bold text-muted-foreground">Q{index + 1}</span>
        <Select
          value={question.type}
          onValueChange={(val) => onChange(makeQuestion(val))}
        >
          <SelectTrigger className="h-7 text-sm md:text-xs w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-sm md:text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Question text */}
      <textarea
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Enter your question..."
        rows={2}
        className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/60"
      />

      {/* Type-specific answer inputs */}
      {question.type === "multiple_choice" && (
        <MultipleChoiceEditor question={question} onChange={onChange} />
      )}
      {question.type === "true_false" && (
        <TrueFalseEditor question={question} onChange={onChange} />
      )}
      {question.type === "short_answer" && (
        <ShortAnswerEditor question={question} onChange={onChange} />
      )}
      {question.type === "matching" && (
        <MatchingEditor question={question} onChange={onChange} />
      )}
    </div>
  );
}

// ─── Manual Builder Tab ───────────────────────────────────────────────────────

function ManualBuilderTab({ timeLimit, setTimeLimit, maxAttempts, setMaxAttempts }) {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([makeQuestion("multiple_choice")]);
  const [saved, setSaved] = useState(false);
  const [savedText, setSavedText] = useState("");

  const updateQuestion = (i, updated) =>
    setQuestions((qs) => qs.map((q, qi) => (qi === i ? updated : q)));

  const removeQuestion = (i) =>
    setQuestions((qs) => qs.filter((_, qi) => qi !== i));

  const addQuestion = () =>
    setQuestions((qs) => [...qs, makeQuestion("multiple_choice")]);

  const handleSave = () => {
    if (!quizTitle.trim()) {
      toast.error("Add a quiz title before saving.");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      toast.error("All questions must have text.");
      return;
    }
    const text = quizToText(quizTitle, questions, { timeLimit, maxAttempts });
    setSavedText(text);
    setSaved(true);
  };

  if (saved) {
    return (
      <ToolResult
        result={savedText}
        onReset={() => setSaved(false)}
        contextualAction={{
          label: "Create Assignment",
          icon: FilePlus,
          onClick: () => toast.info("Opens Assignment Creator with quiz pre-filled."),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Quiz title */}
      <div className="space-y-1.5">
        <Label>Quiz Title <span className="text-destructive">*</span></Label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="e.g. Cell Division Check-In"
          className="w-full rounded-xl border-2 border-border bg-secondary/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-primary/60 focus:outline-none transition-colors"
        />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
          />
        ))}
      </div>

      {/* Add question */}
      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>

      {/* Settings */}
      <QuizSettingsPanel
        timeLimit={timeLimit}
        setTimeLimit={setTimeLimit}
        maxAttempts={maxAttempts}
        setMaxAttempts={setMaxAttempts}
      />

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-primary-foreground bg-primary transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-[0.99]"
      >
        Save Quiz
      </button>
    </div>
  );
}

// ─── AI Generator Tab ─────────────────────────────────────────────────────────

function AIGeneratorTab({ timeLimit, setTimeLimit, maxAttempts, setMaxAttempts }) {
  const [classId, setClassId] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");
  const [includeKey, setIncludeKey] = useState(true);

  const { result, isLoading, error, generate, reset } = useAITool();
  const selectedClass = mockClasses.find((c) => String(c.id) === String(classId));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        difficulty,
        gradeLevel: selectedClass?.gradeLevel || "K-12",
        subject: selectedClass?.subject || "General",
        topic,
        numQuestions,
        answerKey: includeKey ? "Include a clearly labeled answer key at the end." : "",
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Create Assignment",
          icon: FilePlus,
          onClick: () => toast.info("Opens Assignment Creator with quiz content pre-filled."),
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isLoading && <ResultSkeleton />}

      {!isLoading && (
        <>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={String(classId)} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class…" />
              </SelectTrigger>
              <SelectContent>
                {mockClasses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PromptBar
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            label="Topic or Standard"
            placeholder="Describe what you want your students to be tested on — a concept, standard, or unit theme..."
            required
            rows={2}
          />

          <DifficultyCards
            value={difficulty}
            onChange={setDifficulty}
            label="Difficulty"
            levels={DIFFICULTY_LEVELS}
          />

          <QuantitySlider
            value={numQuestions}
            onChange={setNumQuestions}
            min={5}
            max={20}
            step={5}
            label="Number of Questions"
            suffix=" questions"
          />

          <ToggleOption
            checked={includeKey}
            onCheckedChange={setIncludeKey}
            label="Include Answer Key"
            description="Appends a clearly labeled answer section at the end of the quiz."
          />

          <QuizSettingsPanel
            timeLimit={timeLimit}
            setTimeLimit={setTimeLimit}
            maxAttempts={maxAttempts}
            setMaxAttempts={setMaxAttempts}
          />

          <LivePreviewHint
            lines={
              topic.trim()
                ? [
                    `📝 ${numQuestions} ${difficulty.toLowerCase()} questions on: "${topic.trim()}"`,
                    includeKey ? "✓ Answer key will be included" : "✗ No answer key",
                    timeLimit ? `⏱ Time limit: ${timeLimit} min` : "⏱ No time limit",
                    `🔄 Max attempts: ${maxAttempts === "unlimited" ? "Unlimited" : maxAttempts}`,
                  ]
                : []
            }
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!topic.trim()}>Generate Quiz</GenerateButton>
        </>
      )}
    </form>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function QuizGeneratorTool({ prefilled = {} }) {
  const [activeTab, setActiveTab] = useState("ai");

  // Shared quiz settings lifted to root so they persist when switching tabs
  const [timeLimit, setTimeLimit] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("unlimited");

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-xl border-2 border-border overflow-hidden">
        {[
          { id: "ai", label: "Generate with AI" },
          { id: "manual", label: "Build Manually" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "ai" ? (
        <AIGeneratorTab
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          maxAttempts={maxAttempts}
          setMaxAttempts={setMaxAttempts}
        />
      ) : (
        <ManualBuilderTab
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          maxAttempts={maxAttempts}
          setMaxAttempts={setMaxAttempts}
        />
      )}
    </div>
  );
}
