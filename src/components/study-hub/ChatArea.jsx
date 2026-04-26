import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileText, Layers, Brain, Presentation, BookOpen } from "lucide-react";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

function EmptyState({ onModeChange }) {
  const quickModes = [
    { id: "summarize", icon: FileText, label: "Summary", desc: "Condense into key points" },
    { id: "flashcards", icon: Layers, label: "Flashcards", desc: "Term + definition cards" },
    { id: "quiz", icon: Brain, label: "Quiz", desc: "Multiple choice / short answer" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center px-4 py-20 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-hub-elevated">
        <Sparkles className="h-10 w-10 text-hub-accent" />
      </div>
      <h2 className="font-hub-sans text-2xl font-semibold text-hub-text">
        What are you studying today?
      </h2>
      <p className="mt-2.5 max-w-sm font-hub-sans text-sm text-hub-muted">
        Upload a file, paste text, or type a topic below.
      </p>
      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
        {quickModes.map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange?.(id)}
            className="flex flex-col items-start rounded-2xl border border-hub-border bg-hub-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-hub-accent/40 hover:bg-hub-elevated active:scale-[0.98]"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-hub-elevated">
              <Icon className="h-4 w-4 text-hub-accent" />
            </div>
            <p className="font-hub-sans text-sm font-semibold text-hub-text">{label}</p>
            <p className="mt-1 font-hub-sans text-sm md:text-xs leading-relaxed text-hub-muted">{desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatArea({
  messages,
  onModeChange,
  onRegenerateMessage,
  onCopy,
  onDownload,
  onSave,
}) {
  const scrollRef = useRef(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (messages.length > prevLengthRef.current) {
      if (userScrolledUp) setShowNewMessagePill(true);
      else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, userScrolledUp]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setUserScrolledUp(!nearBottom);
    if (nearBottom) setShowNewMessagePill(false);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setShowNewMessagePill(false);
    setUserScrolledUp(false);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 pb-32 pt-4"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <EmptyState onModeChange={onModeChange} />
          ) : (
            messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} message={msg} />
              ) : (
                <AssistantMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={
                    onRegenerateMessage && !msg.loading && !msg.error
                      ? () => onRegenerateMessage(msg.id)
                      : undefined
                  }
                  onCopy={onCopy}
                  onDownload={onDownload}
                  onSave={onSave}
                />
              )
            )
          )}
        </div>
      </div>
      {showNewMessagePill && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 rounded-full border border-hub-border bg-hub-surface px-4 py-2 font-hub-sans text-sm text-hub-muted shadow-lg transition hover:bg-hub-elevated hover:text-hub-text"
        >
          New message
        </button>
      )}
    </div>
  );
}
