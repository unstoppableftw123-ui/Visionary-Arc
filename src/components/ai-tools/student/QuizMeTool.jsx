import { useState } from "react";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, DifficultyCards, QuantitySlider, GenerateButton, LivePreviewHint } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `Create a [difficulty] [format] quiz on: [topic]. [numQuestions] questions. For multiple choice, use A/B/C/D format. For short answer, write clear, specific questions. Include an answer key at the end labeled 'Answers:'. Make questions progressively harder.`;

export default function QuizMeTool({ prefilled = {} }) {
  const [topic, setTopic] = useState(prefilled.topic ?? "");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState("10");
  const [format, setFormat] = useState("Multiple choice");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: { difficulty, format, topic, numQuestions },
    }).then((res) => {
      if (res) awardXP({ amount: 20, reason: "Quiz completed" });
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
              label="Topic or subject"
              placeholder="What do you want to be tested on? A concept, chapter, subject, or anything you're studying..."
              required
              rows={2}
            />

            <DifficultyCards value={difficulty} onChange={setDifficulty} />

            <QuantitySlider
              value={numQuestions}
              onChange={setNumQuestions}
              min={5}
              max={15}
              step={5}
              label="Number of Questions"
              suffix=" questions"
            />

            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Multiple choice", "Short answer", "Mixed"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LivePreviewHint
              lines={
                topic.trim()
                  ? [
                      `🎯 ${numQuestions} ${difficulty.toLowerCase()} ${format.toLowerCase()} questions on: "${topic.trim()}"`,
                      "Answer key included at the end",
                    ]
                  : []
              }
            />

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!topic.trim() || outOfCoins}>
              Quiz Me! · +20 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
