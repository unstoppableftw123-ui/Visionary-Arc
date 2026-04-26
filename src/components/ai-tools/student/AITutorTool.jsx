import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, DifficultyCards, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const LEARNING_STYLES = [
  { value: "Explain it simply", icon: "💡", desc: "Clear, plain-language explanation" },
  { value: "Walk me through step by step", icon: "👣", desc: "Guided step-by-step" },
  { value: "Ask me questions", icon: "❓", desc: "Socratic dialogue" },
  { value: "Give me an example", icon: "🎯", desc: "Concrete examples first" },
];

const PROMPT = `You are a patient, encouraging tutor helping a student understand something. Subject: [subject]. Student's question: [question]. [currentUnderstanding] Style: [style]. Never just give the answer — guide the student to understand it themselves. Be warm, clear, and use relatable examples.`;

export default function AITutorTool({ prefilled = {} }) {
  const [subject, setSubject] = useState(prefilled.subject ?? "");
  const [question, setQuestion] = useState(prefilled.question ?? "");
  const [currentUnderstanding, setCurrentUnderstanding] = useState("");
  const [style, setStyle] = useState("Explain it simply");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        subject: subject || "General",
        question,
        currentUnderstanding: currentUnderstanding.trim()
          ? `Their current understanding: ${currentUnderstanding}`
          : "",
        style,
      },
    }).then((res) => {
      if (res) awardXP({ amount: 10, reason: "AI Tutor session" });
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
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Algebra, Biology, US History"
              />
            </div>

            <PromptBar
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              label="What I'm trying to understand"
              placeholder="Describe what's confusing you or what you want to learn — the more context you give, the better the explanation..."
              required
              rows={3}
            />

            <div className="space-y-1.5">
              <Label>My current understanding (optional)</Label>
              <Textarea
                value={currentUnderstanding}
                onChange={(e) => setCurrentUnderstanding(e.target.value)}
                placeholder="Here's what I think so far… (helps the tutor start from where you are)"
                rows={2}
              />
            </div>

            <DifficultyCards
              value={style}
              onChange={setStyle}
              label="How I'd like to learn"
              levels={LEARNING_STYLES}
            />

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!question.trim() || outOfCoins}>
              Ask AI Tutor · +10 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
