import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, DifficultyCards, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const DEBATE_LEVELS = [
  { value: "Beginner", icon: "🌱", desc: "Clear, simple arguments" },
  { value: "Intermediate", icon: "⚡", desc: "Counterarguments & evidence" },
  { value: "Advanced", icon: "🔥", desc: "Rhetorical techniques" },
];

const PROMPT = `You are a debate partner. The student is arguing: [studentPosition] on the topic: [topic]. You argue the opposite. Difficulty: [difficulty]. Start by making your opening argument (2-3 sentences). Then respond to whatever the student says. At [difficulty] level: Beginner = clear simple arguments, Intermediate = introduce counterarguments and evidence, Advanced = use rhetorical techniques and challenge assumptions. Stay in character as a debate opponent — be respectful but firm.`;

export default function DebatePartnerTool({ prefilled = {} }) {
  const [topic, setTopic] = useState(prefilled.topic ?? "");
  const [studentPosition, setStudentPosition] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || !studentPosition.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: { topic, studentPosition, difficulty },
    }).then((res) => {
      if (res) awardXP({ amount: 20, reason: "Debate Partner session" });
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
            <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm md:text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Enter your topic and your position. The AI automatically takes the opposing side and opens the debate. You respond, and it continues.
            </div>

            <PromptBar
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              label="Topic to debate"
              placeholder="State the debate topic clearly — e.g. 'Social media should be banned for teens under 16'..."
              required
              rows={2}
            />

            <div className="space-y-1.5">
              <Label>
                My position <span className="text-destructive">*</span>
              </Label>
              <Input
                value={studentPosition}
                onChange={(e) => setStudentPosition(e.target.value)}
                placeholder="e.g. I agree — social media harms teen mental health"
                required
              />
            </div>

            <DifficultyCards
              value={difficulty}
              onChange={setDifficulty}
              label="Opponent Difficulty"
              levels={DEBATE_LEVELS}
            />

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!topic.trim() || !studentPosition.trim() || outOfCoins}>
              Start Debate · +20 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
