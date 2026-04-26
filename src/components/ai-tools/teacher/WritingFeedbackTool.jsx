import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, DifficultyCards, GenerateButton } from "../FormComponents";
import { toast } from "sonner";

const FEEDBACK_STYLES = [
  { value: "Detailed", icon: "📋", desc: "Full analysis with specific quotes" },
  { value: "Brief", icon: "⚡", desc: "Key points and priorities only" },
  { value: "Socratic questions only", icon: "❓", desc: "Guide with questions, not answers" },
];

const PROMPT = `You are an experienced teacher. Read this student writing and give [feedbackStyle] feedback based on these criteria: [criteria]. Format: (1) Overall impression (1-2 sentences), (2) Strengths — 2-3 specific quotes or references from the text, (3) Areas for growth — 2-3 actionable suggestions, (4) Priority next step — one clear revision focus. Student writing: [writing]`;

export default function WritingFeedbackTool({ prefilled = {} }) {
  const [assignmentName, setAssignmentName] = useState(prefilled.assignmentName ?? "");
  const [studentName, setStudentName] = useState("");
  const [writing, setWriting] = useState(prefilled.writing ?? "");
  const [criteria, setCriteria] = useState("");
  const [feedbackStyle, setFeedbackStyle] = useState("Detailed");

  const { result, isLoading, error, generate, reset } = useAITool();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!writing.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        feedbackStyle,
        criteria: criteria.trim() || "clarity, argumentation, evidence, and organization",
        writing,
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Send to Student",
          icon: Send,
          onClick: () => toast.success("Feedback sent via class messaging."),
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isLoading && <ResultSkeleton />}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignment Name</Label>
              <Input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g. Argumentative Essay"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Student Name (optional)</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>
          </div>

          <PromptBar
            value={writing}
            onChange={(e) => setWriting(e.target.value)}
            label="Student Writing"
            placeholder="Paste the student's writing here — draft, paragraph, or full submission..."
            required
            rows={7}
          />

          <div className="space-y-1.5">
            <Label>Evaluation Criteria (optional)</Label>
            <Textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Paste your rubric or describe what you're grading on…"
              rows={2}
            />
          </div>

          <DifficultyCards
            value={feedbackStyle}
            onChange={setFeedbackStyle}
            label="Feedback Style"
            levels={FEEDBACK_STYLES}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!writing.trim()}>
            Get AI Feedback
          </GenerateButton>
        </>
      )}
    </form>
  );
}
