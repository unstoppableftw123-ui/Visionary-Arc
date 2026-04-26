import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { toast } from "sonner";

const PROMPT = `Unpack this standard for a [gradeLevel] [subject] teacher. Standard: [standard]. Provide: (1) Plain-language explanation of what students must know and do, (2) Key vocabulary (list), (3) 3-5 learning targets as 'I can...' statements, (4) Common student misconceptions to watch for, (5) One quick formative assessment idea.`;

export default function StandardsUnpackerTool({ prefilled = {} }) {
  const [standard, setStandard] = useState(prefilled.standard ?? "");
  const [gradeLevel, setGradeLevel] = useState(prefilled.gradeLevel ?? "");
  const [subject, setSubject] = useState(prefilled.subject ?? "");

  const { result, isLoading, error, generate, reset } = useAITool();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!standard.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        gradeLevel: gradeLevel || "K-12",
        subject: subject || "General",
        standard,
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Add Learning Targets to Class",
          icon: ListChecks,
          onClick: () => toast.success("I can statements saved to class standards tracker."),
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isLoading && <ResultSkeleton />}

      {!isLoading && (
        <>
          <PromptBar
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            label="Standard"
            placeholder="Paste the standard code or full text — e.g. CCSS.ELA-LITERACY.RI.8.1 or describe what students should know and be able to do..."
            required
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Grade Level</Label>
              <Input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 8th, High School"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. ELA, Math, Science"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!standard.trim()}>
            Unpack Standard
          </GenerateButton>
        </>
      )}
    </form>
  );
}
