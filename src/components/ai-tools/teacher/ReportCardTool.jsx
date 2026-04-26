import { useState } from "react";
import { BookCheck } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { DifficultyCards, GenerateButton } from "../FormComponents";
import { toast } from "sonner";

const mockStudents = [
  { id: 1, name: "Alex Rivera", classId: 1, grade: "B+" },
  { id: 2, name: "Jordan Kim", classId: 1, grade: "A-" },
  { id: 3, name: "Priya Patel", classId: 2, grade: "A" },
];

const STRENGTHS_OPTIONS = [
  "Participates actively",
  "Strong critical thinker",
  "Creative",
  "Collaborative",
  "Shows great growth",
  "Detail-oriented",
  "Self-motivated",
];

const GROWTH_OPTIONS = [
  "Completing work on time",
  "Showing work",
  "Written expression",
  "Staying focused",
  "Asking for help",
  "Organization",
];

const TONE_LEVELS = [
  { value: "Encouraging", icon: "🌟", desc: "Warm and celebratory" },
  { value: "Neutral", icon: "📋", desc: "Balanced and factual" },
  { value: "Direct", icon: "🎯", desc: "Clear and action-focused" },
];

const PROMPT = `Write a professional report card comment for [studentName] in [subject]. Grade: [grade]. Strengths: [strengths]. Growth areas: [growthAreas]. Tone: [tone]. 3-4 sentences. Be specific. Use student's name once maximum. No generic filler phrases.`;

function ChipSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`rounded-full border px-2.5 py-1 text-sm md:text-xs transition-colors ${
            selected.includes(opt)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ReportCardTool({ prefilled = {} }) {
  const [studentId, setStudentId] = useState(prefilled.studentId ?? "");
  const [studentName, setStudentName] = useState(prefilled.studentName ?? "");
  const [subject, setSubject] = useState(prefilled.subject ?? "");
  const [grade, setGrade] = useState(prefilled.grade ?? "");
  const [strengths, setStrengths] = useState([]);
  const [growthAreas, setGrowthAreas] = useState([]);
  const [tone, setTone] = useState("Encouraging");

  const { result, isLoading, error, generate, reset } = useAITool();

  const handleStudentChange = (val) => {
    setStudentId(val);
    const s = mockStudents.find((st) => String(st.id) === val);
    if (s) {
      setStudentName(s.name);
      setGrade(s.grade);
    }
  };

  const toggleStrength = (s) =>
    setStrengths((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const toggleGrowth = (s) =>
    setGrowthAreas((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = studentName.trim() || "Student";
    generate({
      promptTemplate: PROMPT,
      formData: {
        studentName: name,
        subject: subject || "this class",
        grade: grade || "N/A",
        strengths: strengths.length ? strengths.join(", ") : "engaged in class",
        growthAreas: growthAreas.length ? growthAreas.join(", ") : "continued practice",
        tone,
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Save to Gradebook",
          icon: BookCheck,
          onClick: () => toast.success("Comment saved to gradebook."),
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
            <Label>Student</Label>
            <Select value={String(studentId)} onValueChange={handleStudentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student…" />
              </SelectTrigger>
              <SelectContent>
                {mockStudents.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Student Name</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Or type a name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. B+"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. 7th Grade Math"
            />
          </div>

          <div className="space-y-2">
            <Label>Strengths</Label>
            <ChipSelect options={STRENGTHS_OPTIONS} selected={strengths} onToggle={toggleStrength} />
          </div>

          <div className="space-y-2">
            <Label>Growth Areas</Label>
            <ChipSelect options={GROWTH_OPTIONS} selected={growthAreas} onToggle={toggleGrowth} />
          </div>

          <DifficultyCards
            value={tone}
            onChange={setTone}
            label="Comment Tone"
            levels={TONE_LEVELS}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton>
            Generate Comment
          </GenerateButton>
        </>
      )}
    </form>
  );
}
