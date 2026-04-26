import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useAITool } from "../hooks/useAITool";
import { ResultSkeleton, ToolResult } from "../ToolResult";
import { PromptBar, ToggleOption, GenerateButton } from "../FormComponents";
import { toast } from "sonner";

const PROMPT = `Rewrite this text for a [targetLevel] reading level. [preserveVocab] Keep all facts and meaning intact. Only simplify language and sentence structure. Original text: [text]`;

const READING_LEVELS = [
  "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9-10", "Grade 11-12",
];

export default function TextLevelerTool({ prefilled = {} }) {
  const [text, setText] = useState(prefilled.text ?? "");
  const [targetLevel, setTargetLevel] = useState("Grade 6");
  const [preserveVocab, setPreserveVocab] = useState(false);

  const { result, isLoading, error, generate, reset } = useAITool();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        targetLevel,
        preserveVocab: preserveVocab
          ? "Keep subject-specific vocabulary terms but bold them and simplify all surrounding language."
          : "",
        text,
      },
    });
  };

  if (result) {
    return (
      <ToolResult
        result={result}
        onReset={reset}
        contextualAction={{
          label: "Add to Assignment",
          icon: FilePlus2,
          onClick: () => toast.success("Leveled text added as a differentiated version."),
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            label="Original Text"
            placeholder="Paste the text you want to level up or down — article, passage, instructions, or any reading material..."
            required
            rows={7}
          />

          <div className="space-y-1.5">
            <Label>Target Reading Level</Label>
            <Select value={targetLevel} onValueChange={setTargetLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READING_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ToggleOption
            checked={preserveVocab}
            onCheckedChange={setPreserveVocab}
            label="Preserve Key Vocabulary"
            description="Keeps subject-specific terms intact but bolds them and simplifies all surrounding language."
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <GenerateButton disabled={!text.trim()}>
            Level This Text
          </GenerateButton>
        </>
      )}
    </form>
  );
}
