import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, DifficultyCards, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const STUDY_STYLES = [
  { value: "Quiz me", icon: "❓", desc: "Test my knowledge question by question" },
  { value: "Explain concepts", icon: "📚", desc: "Walk me through the key ideas" },
  { value: "Both", icon: "⚡", desc: "Mix of explanation and quizzing" },
];

const PROMPT = `You are a study partner. The student is studying: [topic]. [upcomingExam] Mode: [learningStyle]. If quizzing: ask one question at a time, wait for an answer, then give feedback before moving on. If explaining: break the topic into 3-5 key ideas and check understanding after each. Keep it conversational and encouraging.`;

export default function StudyBotTool({ prefilled = {} }) {
  const [topic, setTopic] = useState(prefilled.topic ?? "");
  const [upcomingExam, setUpcomingExam] = useState("");
  const [learningStyle, setLearningStyle] = useState("Both");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: {
        topic,
        upcomingExam: upcomingExam.trim()
          ? `They have this coming up: ${upcomingExam}`
          : "",
        learningStyle,
      },
    }).then((res) => {
      if (res) awardXP({ amount: 15, reason: "Study Bot session" });
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
              label="What I'm studying"
              placeholder="Tell me what you need to master — a chapter, concept, unit, or anything you're trying to get into your head..."
              required
              rows={2}
            />

            <div className="space-y-1.5">
              <Label>Exam or assignment coming up (optional)</Label>
              <Input
                value={upcomingExam}
                onChange={(e) => setUpcomingExam(e.target.value)}
                placeholder="e.g. Chapter 5 test on Friday"
              />
            </div>

            <DifficultyCards
              value={learningStyle}
              onChange={setLearningStyle}
              label="How I learn best"
              levels={STUDY_STYLES}
            />

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!topic.trim() || outOfCoins}>
              Start Studying · +15 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
