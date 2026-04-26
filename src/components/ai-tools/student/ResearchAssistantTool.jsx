import { useState } from "react";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `You are a research assistant helping a student. Topic: [topic]. [alreadyKnow] They need: [researchNeeds]. Provide: (1) A clear overview of the topic (3-4 sentences), (2) 4-5 key points or arguments, (3) Types of sources they should look for (be specific — e.g. 'look for CDC data on X' not just 'find statistics'), (4) 3 guiding research questions to focus their search. Do not make up specific URLs or citations.`;

export default function ResearchAssistantTool({ prefilled = {} }) {
  const [topic, setTopic] = useState(prefilled.topic ?? "");
  const [alreadyKnow, setAlreadyKnow] = useState("");
  const [researchNeeds, setResearchNeeds] = useState("All of the above");
  const [gradeLevel, setGradeLevel] = useState("9-10");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        topic,
        alreadyKnow: alreadyKnow.trim() ? `They already know: ${alreadyKnow}` : "",
        researchNeeds,
      },
    }).then((res) => {
      if (res) awardXP({ amount: 10, reason: "Research Assistant session" });
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
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              label="Research topic"
              placeholder="What are you researching? Describe the topic, question, or argument you're trying to build — the more specific, the better..."
              required
              rows={2}
            />

            <div className="space-y-1.5">
              <Label>What I already know (optional)</Label>
              <Textarea
                value={alreadyKnow}
                onChange={(e) => setAlreadyKnow(e.target.value)}
                placeholder="Brief summary of what you already know about this topic…"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>What I need to find</Label>
                <Select value={researchNeeds} onValueChange={setResearchNeeds}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Background info",
                      "Key arguments",
                      "Statistics & data",
                      "Expert opinions",
                      "All of the above",
                    ].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["6-8", "9-10", "11-12", "College"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!topic.trim() || outOfCoins}>
              Research This Topic · +10 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
