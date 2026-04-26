import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, QuantitySlider, GenerateButton, LivePreviewHint } from "../FormComponents";
import { toast } from "sonner";

const PROMPT = `Create a grading rubric for a [gradeLevel] [assignmentType] titled '[assignmentName]'. Include [numCriteria] criteria. Column headers: [performanceLevels]. For each criterion, write specific, observable descriptors at each level. Format as a markdown table.`;

export default function RubricGeneratorTool({ prefilled = {} }) {
  const [assignmentName, setAssignmentName] = useState(prefilled.assignmentName ?? "");
  const [assignmentType, setAssignmentType] = useState("Essay");
  const [gradeLevel, setGradeLevel] = useState(prefilled.gradeLevel ?? "");
  const [numCriteria, setNumCriteria] = useState("4");
  const [performanceLevels, setPerformanceLevels] = useState(
    "Excellent–Proficient–Developing–Beginning"
  );

  const { result, isLoading, error, generate, reset } = useAITool();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assignmentName.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        gradeLevel: gradeLevel || "K-12",
        assignmentType,
        assignmentName,
        numCriteria,
        performanceLevels,
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Attach to Assignment",
          icon: Paperclip,
          onClick: () => toast.info("Select an existing assignment to link this rubric to."),
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
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            label="Assignment Name"
            placeholder="Name the assignment you're building this rubric for — be specific about what students are creating..."
            required
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignment Type</Label>
              <Select value={assignmentType} onValueChange={setAssignmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Essay", "Project", "Presentation", "Lab Report", "Creative Work", "Other"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Grade Level</Label>
              <Input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 9th, AP"
              />
            </div>
          </div>

          <QuantitySlider
            value={numCriteria}
            onChange={setNumCriteria}
            min={3}
            max={5}
            step={1}
            label="Number of Criteria"
            suffix=" criteria"
          />

          <div className="space-y-1.5">
            <Label>Performance Levels</Label>
            <Select value={performanceLevels} onValueChange={setPerformanceLevels}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Excellent–Proficient–Developing–Beginning",
                  "4–3–2–1",
                  "A–B–C–D",
                ].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <LivePreviewHint
            lines={
              assignmentName.trim()
                ? [
                    `📋 ${numCriteria}-criteria ${assignmentType.toLowerCase()} rubric for: "${assignmentName.trim()}"`,
                    `Performance levels: ${performanceLevels.replace(/–/g, " → ")}`,
                  ]
                : []
            }
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!assignmentName.trim()}>
            Generate Rubric
          </GenerateButton>
        </>
      )}
    </form>
  );
}
