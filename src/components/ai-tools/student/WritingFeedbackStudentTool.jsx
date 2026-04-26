import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `You are a helpful writing coach. Give constructive feedback on this student's writing. They want to focus on: [focusArea]. Evaluation criteria: [criteria]. Format your response as: (1) What's working well — be specific and reference their actual writing, (2) One main thing to improve — clear and actionable, (3) One specific sentence or section to revise — show an example of how. Be encouraging. Don't rewrite their whole essay. Student writing: [writing]`;

export default function WritingFeedbackStudentTool({ prefilled = {} }) {
  const [assignmentName, setAssignmentName] = useState(prefilled.assignmentName ?? "");
  const [writing, setWriting] = useState(prefilled.writing ?? "");
  const [criteria, setCriteria] = useState(prefilled.criteria ?? "");
  const [focusArea, setFocusArea] = useState("Overall");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!writing.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        focusArea,
        criteria: criteria.trim() || "clarity, argument, evidence, and mechanics",
        writing,
      },
    }).then((res) => {
      if (res) awardXP({ amount: 10, reason: "Writing feedback before submitting" });
    });
  };

  const outOfCoins = coinBalance !== null && coinBalance <= 0;

  return (
    <div className="space-y-4">
      <ConversationThread history={history} chatEndRef={chatEndRef} onClear={clearHistory} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {isLoading && <ResultSkeleton />}
        {!isLoading && (
          <>
            <div className="space-y-1.5">
              <Label>Assignment name (optional)</Label>
              <Input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g. Persuasive Essay Draft 1"
              />
            </div>

            <PromptBar
              value={writing}
              onChange={(e) => setWriting(e.target.value)}
              label="My writing"
              placeholder="Paste your writing here — draft, paragraph, or full essay. The more you share, the better the feedback..."
              required
              rows={7}
            />

            <div className="space-y-1.5">
              <Label>What my teacher is grading on (optional)</Label>
              <Textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="Paste rubric or describe what your teacher wants to see…"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>What I want feedback on most</Label>
              <Select value={focusArea} onValueChange={setFocusArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Overall",
                    "Introduction",
                    "Argument & evidence",
                    "Conclusion",
                    "Grammar & clarity",
                  ].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!writing.trim() || outOfCoins}>
              Get Feedback · +10 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
