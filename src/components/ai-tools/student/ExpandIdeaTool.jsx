import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `Help a student expand their idea without writing it for them. Their idea: [idea]. [context] Expansion goal: [expansionGoal]. Show them 2-3 directions they could take this idea, with a sentence or two demonstrating each direction. Then ask them which direction feels right. Do not write the full expanded version — guide them to do it.`;

export default function ExpandIdeaTool({ prefilled = {} }) {
  const [idea, setIdea] = useState(prefilled.idea ?? "");
  const [context, setContext] = useState(prefilled.context ?? "");
  const [expansionGoal, setExpansionGoal] = useState("Add more detail");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idea.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        idea,
        context: context.trim() ? `Context: ${context}` : "",
        expansionGoal,
      },
    }).then((res) => {
      if (res) awardXP({ amount: 10, reason: "Expanded an idea" });
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
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              label="My idea or rough draft"
              placeholder="Paste your idea, rough notes, or a sentence you want to grow — don't worry if it's messy, that's the point..."
              required
              rows={5}
            />

            <div className="space-y-1.5">
              <Label>Subject or assignment context (optional)</Label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Argumentative essay on renewable energy"
              />
            </div>

            <div className="space-y-1.5">
              <Label>How I want to expand it</Label>
              <Select value={expansionGoal} onValueChange={setExpansionGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Add more detail",
                    "Add evidence or examples",
                    "Make it more persuasive",
                    "Turn it into a full paragraph",
                  ].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
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

            <GenerateButton disabled={!idea.trim() || outOfCoins}>
              Expand My Idea · +10 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
