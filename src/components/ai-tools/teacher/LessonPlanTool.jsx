import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, QuantitySlider, GenerateButton, LivePreviewHint } from "../FormComponents";
import { toast } from "sonner";

const mockClasses = [
  { id: 1, name: "7th Grade Math", subject: "Math", gradeLevel: "7th" },
  { id: 2, name: "AP English Literature", subject: "ELA", gradeLevel: "11th" },
  { id: 3, name: "Biology Honors", subject: "Science", gradeLevel: "10th" },
];

const PROMPT = `Generate a detailed lesson plan for a [gradeLevel] [subject] class. Topic: [topic]. Duration: [duration] minutes. [objectives] Structure: (1) Hook/engagement opener, (2) Direct instruction, (3) Guided practice, (4) Independent practice, (5) Exit ticket. Use clear section headers.`;

export default function LessonPlanTool({ prefilled = {} }) {
  const [classId, setClassId] = useState(prefilled.classId ?? "");
  const [gradeLevel, setGradeLevel] = useState(prefilled.gradeLevel ?? "");
  const [topic, setTopic] = useState(prefilled.topic ?? "");
  const [duration, setDuration] = useState("45");
  const [objectives, setObjectives] = useState("");

  const { result, isLoading, error, generate, reset } = useAITool();

  const selectedClass = mockClasses.find((c) => String(c.id) === String(classId));

  const handleClassChange = (val) => {
    setClassId(val);
    const cls = mockClasses.find((c) => String(c.id) === val);
    if (cls) setGradeLevel(cls.gradeLevel);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        gradeLevel: gradeLevel || selectedClass?.gradeLevel || "K-12",
        subject: selectedClass?.subject || "General",
        topic,
        duration,
        objectives: objectives.trim()
          ? `Learning objectives: ${objectives}`
          : "",
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Schedule to Calendar",
          icon: CalendarPlus,
          onClick: () => toast.info("Calendar integration coming soon!"),
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
              <Label>Class</Label>
              <Select value={String(classId)} onValueChange={handleClassChange}>
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

            <div className="space-y-1.5">
              <Label>Grade Level</Label>
              <Input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 7th, 10th, K-5"
              />
            </div>
          </div>

          <PromptBar
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            label="Topic / Standard"
            placeholder="Describe what you want to teach or explore — a concept, unit, or standard..."
            required
            rows={2}
          />

          <QuantitySlider
            value={duration}
            onChange={setDuration}
            min={15}
            max={90}
            step={15}
            label="Lesson Duration"
            suffix=" min"
          />

          <div className="space-y-1.5">
            <Label>Learning Objectives (optional)</Label>
            <Textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Students will be able to…"
              rows={2}
            />
          </div>

          <LivePreviewHint
            lines={
              topic.trim()
                ? [
                    `📚 ${duration}-minute ${selectedClass?.subject || "lesson"} exploring: "${topic.trim()}"`,
                    "Structure: Hook → Instruction → Guided Practice → Independent Practice → Exit Ticket",
                  ]
                : []
            }
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!topic.trim()}>
            Generate Lesson Plan
          </GenerateButton>
        </>
      )}
    </form>
  );
}
