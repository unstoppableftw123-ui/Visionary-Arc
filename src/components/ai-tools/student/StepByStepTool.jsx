import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `A student needs help breaking down a task. Task: [task]. [confusion] Subject: [subject]. Give them: (1) A clear, simple explanation of what this task is really asking, (2) 4-6 numbered steps to complete it in order, (3) A tip for the step most students find hardest, (4) One question to check their understanding before they start. Keep language simple and encouraging.`;

export default function StepByStepTool({ prefilled = {} }) {
  const [task, setTask] = useState(prefilled.task ?? "");
  const [confusion, setConfusion] = useState("");
  const [subject, setSubject] = useState(prefilled.subject ?? "");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        task,
        confusion: confusion.trim() ? `What confuses them: ${confusion}` : "",
        subject: subject || "General",
      },
    }).then((res) => {
      if (res) awardXP({ amount: 5, reason: "Broke down a task" });
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
            <PromptBar
              value={task}
              onChange={(e) => setTask(e.target.value)}
              label="What I need to do"
              placeholder="Describe the assignment or task — e.g. 'Write a compare and contrast essay on two historical events'..."
              required
              rows={2}
            />

            <div className="space-y-1.5">
              <Label>What's confusing me (optional)</Label>
              <Textarea
                value={confusion}
                onChange={(e) => setConfusion(e.target.value)}
                placeholder="Describe what part you don't understand or where you feel stuck…"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. History, Science, Math"
              />
            </div>

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!task.trim() || outOfCoins}>
              Break This Down · +5 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
