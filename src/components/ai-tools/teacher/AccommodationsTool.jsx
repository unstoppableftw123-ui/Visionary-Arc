import { useState } from "react";
import { UserCheck } from "lucide-react";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { toast } from "sonner";

const mockStudents = [
  { id: 1, name: "Alex Rivera" },
  { id: 2, name: "Jordan Kim" },
  { id: 3, name: "Priya Patel" },
];

const NEEDS_OPTIONS = [
  "Reading",
  "Writing",
  "Math",
  "Focus & Attention",
  "ELL",
  "Processing Speed",
  "Executive Function",
  "Social-Emotional",
];

const PROMPT = `Generate practical classroom accommodations for a student who needs support in: [areasOfNeed]. [context] List 8-10 specific, actionable strategies grouped by: Instructional, Assessment, Environmental, Technology. Focus on what a single classroom teacher can do without extra resources.`;

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

export default function AccommodationsTool({ prefilled = {} }) {
  const [studentId, setStudentId] = useState(prefilled.studentId ?? "");
  const [areasOfNeed, setAreasOfNeed] = useState([]);
  const [context, setContext] = useState("");

  const { result, isLoading, error, generate, reset } = useAITool();

  const toggleNeed = (n) =>
    setAreasOfNeed((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (areasOfNeed.length === 0) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        areasOfNeed: areasOfNeed.join(", "),
        context: context.trim() ? `Context: ${context}` : "",
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Save to Student Profile",
          icon: UserCheck,
          onClick: () => toast.success("Accommodations saved to student record."),
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
            <Label>Student (optional)</Label>
            <Select value={String(studentId)} onValueChange={setStudentId}>
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

          <div className="space-y-2">
            <Label>
              Areas of Need <span className="text-destructive">*</span>
            </Label>
            <ChipSelect options={NEEDS_OPTIONS} selected={areasOfNeed} onToggle={toggleNeed} />
            {areasOfNeed.length === 0 && (
              <p className="text-sm md:text-xs text-muted-foreground">Select at least one area to continue</p>
            )}
          </div>

          <PromptBar
            value={context}
            onChange={(e) => setContext(e.target.value)}
            label="Additional Context (optional)"
            placeholder="Describe the specific challenge, classroom setup, or situation — the more detail, the more targeted the suggestions..."
            rows={3}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={areasOfNeed.length === 0}>
            Generate Accommodations
          </GenerateButton>
        </>
      )}
    </form>
  );
}
