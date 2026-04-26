import { useState } from "react";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { useStudentAITool } from "../hooks/useStudentAITool";
import { useXPReward } from "../hooks/useXPReward";
import { ResultSkeleton } from "../ToolResult";
import { PromptBar, GenerateButton } from "../FormComponents";
import { ConversationThread } from "../ConversationThread";

const PROMPT = `A student has uploaded a document and has a question about it. Answer their question based ONLY on the content of the document. If the answer isn't in the document, say so clearly. Be concise and direct. Document: [documentContent]. Student's question: [question]`;

export default function ChatWithDocsTool({ prefilled = {} }) {
  const [documentContent, setDocumentContent] = useState(prefilled.documentContent ?? "");
  const [question, setQuestion] = useState("");

  const { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef } = useStudentAITool();
  const { awardXP } = useXPReward();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!documentContent.trim() || !question.trim()) return;
    generate({
      promptTemplate: PROMPT,
      formData: { documentContent, question },
    }).then((res) => {
      if (res) awardXP({ amount: 5, reason: "Doc question answered" });
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
            <div className="space-y-2">
              <Label>
                Document content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Paste the document text here… (file upload coming in Phase 2)"
                rows={7}
                required
                className="rounded-xl border-2 border-border bg-secondary/40 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/45 resize-none focus:border-primary/60 focus:bg-secondary/60 focus:outline-none leading-relaxed"
              />
              <p className="text-sm md:text-xs text-muted-foreground">
                Paste the text from your document. File upload coming soon.
              </p>
            </div>

            <PromptBar
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              label="My question about this document"
              placeholder="What do you want to know? Ask anything about the document — main argument, specific details, definitions, comparisons..."
              required
              rows={2}
            />

            {outOfCoins && (
              <p className="text-sm text-amber-600 text-center">
                You're out of coins — earn more by completing activities
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <GenerateButton disabled={!documentContent.trim() || !question.trim() || outOfCoins}>
              Chat with Doc · +5 XP
            </GenerateButton>
          </>
        )}
      </form>
    </div>
  );
}
