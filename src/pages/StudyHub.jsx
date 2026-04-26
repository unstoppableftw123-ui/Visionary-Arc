import { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Sparkles, Pencil, PanelLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext, API } from "../App";
import apiService from "../services/apiService";
import { checkAndAwardBadges, showBadgeUnlockToast } from "../lib/badges";
import ChatArea from "../components/study-hub/ChatArea";
import ChatInputBar from "../components/study-hub/ChatInputBar";
import { callAnthropic } from "../components/study-hub/anthropicClient";
import { getStudyHubMockResponse } from "../components/study-hub/studyHubMock";
import MOCK_CHAT_HISTORY from "../components/study-hub/mockChatHistory";

// ─── Mode badge colors ────────────────────────────────────────────────────────
const MODE_BADGE = {
  summarize: { label: "Summary",    cls: "bg-brand-orange/15 text-brand-orange" },
  summary:   { label: "Summary",    cls: "bg-brand-orange/15 text-brand-orange" },
  notes:     { label: "Notes",      cls: "bg-sky-500/15 text-sky-400" },
  slides:    { label: "Slides",     cls: "bg-orange-600/15 text-orange-400" },
  quiz:      { label: "Quiz",       cls: "bg-rose-500/15 text-rose-400" },
  flashcards:{ label: "Flashcards", cls: "bg-emerald-500/15 text-emerald-400" },
};

const DEFAULT_SUMMARIZE = { agent: "deep", summaryStyle: "Concise", summaryLength: "Medium" };
const DEFAULT_QUIZ = { agent: "deep", questionType: "multiple_choice", numQuestions: 5, difficulty: "Medium" };
const DEFAULT_FLASHCARDS = { agent: "deep", numCards: 10, cardStyle: "term_def" };
const DEFAULT_NOTES = { notesStyle: "Outline" };
const DEFAULT_SLIDES = { slideCount: 5 };

let messageId = 0;
let attachmentId = 0;

export default function StudyHub() {
  const navigate = useNavigate();
  const { token, user, setUser, refreshCoins } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("summarize");
  const [options, setOptions] = useState({
    summarize: DEFAULT_SUMMARIZE,
    quiz: DEFAULT_QUIZ,
    flashcards: DEFAULT_FLASHCARDS,
    notes: DEFAULT_NOTES,
    slides: DEFAULT_SLIDES,
  });
  const [model, setModel] = useState("auto");
  const [attachments, setAttachments] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // New state for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getOptionsForMode = useCallback(() => {
    if (mode === "summarize") return options.summarize;
    if (mode === "quiz") return options.quiz;
    if (mode === "notes") return options.notes;
    if (mode === "slides") return options.slides;
    return options.flashcards;
  }, [mode, options]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setAttachments([]);
  }, []);

  const useMock = !(process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.REACT_APP_GROQ_API_KEY);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !attachments.length) return;

    const userMsg = {
      id: `msg-${++messageId}`,
      role: "user",
      mode,
      content: text,
      attachments: [...attachments],
    };
    const loadingId = `msg-${++messageId}`;
    const loadingMsg = {
      id: loadingId,
      role: "assistant",
      mode,
      loading: true,
      content: null,
      data: null,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setAttachments([]);
    setIsGenerating(true);

    try {
      const opts = { ...getOptionsForMode(), model: model === "auto" ? undefined : model };
      const result = useMock
        ? await getStudyHubMockResponse(mode, opts, text, attachments)
        : await callAnthropic(mode, opts, text, attachments, refreshCoins);
      const contentForMessage = result.type === "summary" || result.type === "notes" ? result.data : null;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                content: contentForMessage,
                data: result.data,
                error: null,
              }
            : m
        )
      );
      toast.success("Done!");
      if (mode === 'flashcards' || mode === 'quiz') {
        const reason = mode === 'flashcards' ? 'flashcard_session' : 'quiz_completion';
        apiService.coins.award(5, reason).then(({ balance }) => {
          setUser(prev => ({ ...prev, coins: balance }));
        }).catch(() => {});
        apiService.streaks.increment().catch(() => {});
        checkAndAwardBadges({
          user,
          stats: { level: user?.level, created_at: user?.created_at },
          onUserUpdate: setUser,
        }).then(({ unlocked }) => {
          unlocked.forEach(({ badge }) => showBadgeUnlockToast(badge));
        }).catch(() => {});
      }
    } catch (err) {
      if (err?.message?.includes('INSUFFICIENT_COINS')) {
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        toast.error('Not enough coins', {
          description: 'Top up in the Store to keep using AI.',
          action: { label: 'Get Coins', onClick: () => navigate('/store') },
        });
      } else {
        const message = err?.message || "Request failed.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { ...m, loading: false, error: message, content: null, data: null } : m
          )
        );
        toast.error(message);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [input, attachments, mode, getOptionsForMode, useMock, setUser, navigate]);

  const handleRegenerateMessage = useCallback(
    async (assistantMessageId) => {
      const idx = messages.findIndex((m) => m.id === assistantMessageId);
      if (idx <= 0) return;
      const prevMsg = messages[idx - 1];
      if (prevMsg.role !== "user") return;

      const loadingId = `msg-${++messageId}`;
      const loadingMsg = {
        id: loadingId,
        role: "assistant",
        mode: prevMsg.mode || mode,
        loading: true,
        content: null,
        data: null,
      };

      setMessages((prev) => {
        const next = [...prev];
        next[idx] = loadingMsg;
        return next;
      });
      setIsGenerating(true);

      const currentMode = prevMsg.mode || mode;
      const opts =
        currentMode === "summarize"
          ? options.summarize
          : currentMode === "quiz"
          ? options.quiz
          : currentMode === "notes"
          ? options.notes
          : currentMode === "slides"
          ? options.slides
          : options.flashcards;

      try {
        const optsWithModel = { ...opts, model: model === "auto" ? undefined : model };
        const result = useMock
          ? await getStudyHubMockResponse(currentMode, optsWithModel, prevMsg.content, prevMsg.attachments || [])
          : await callAnthropic(currentMode, optsWithModel, prevMsg.content, prevMsg.attachments || [], refreshCoins);
        const contentForMessage = result.type === "summary" || result.type === "notes" ? result.data : null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  loading: false,
                  content: contentForMessage,
                  data: result.data,
                  error: null,
                }
              : m
          )
        );
        toast.success("Regenerated!");
      } catch (err) {
        if (err?.message?.includes('INSUFFICIENT_COINS')) {
          setMessages((prev) => prev.filter((m) => m.id !== loadingId));
          toast.error('Not enough coins', {
            description: 'Top up in the Store to keep using AI.',
            action: { label: 'Get Coins', onClick: () => navigate('/store') },
          });
        } else {
          const message = err?.message || "Request failed.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId ? { ...m, loading: false, error: message, content: null, data: null } : m
            )
          );
          toast.error(message);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [messages, mode, options, useMock, model, navigate]
  );

  const handleCopy = useCallback(() => toast.success("Copied to clipboard."), []);

  const handleDownload = useCallback((text) => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-hub-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded.");
  }, []);

  const handleSave = useCallback(
    async (type, content) => {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const sourceText = lastUser?.content?.slice(0, 500) || "";
      const title = `${type} — ${new Date().toLocaleDateString()}`;
      const payload =
        type === "summary" || type === "notes"
          ? { item_type: type, title, content: typeof content === "string" ? content : JSON.stringify(content), source_text: sourceText }
          : type === "slides"
          ? { item_type: "slides", title, content: typeof content === "object" ? JSON.stringify(content) : content, source_text: sourceText }
          : type === "quiz"
          ? { item_type: "quiz", title, content: typeof content === "object" ? JSON.stringify(content) : content, source_text: sourceText }
          : { item_type: "flashcards", title, content: typeof content === "object" ? JSON.stringify(content) : content, source_text: sourceText };

      try {
        await axios.post(`${API}/library`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        toast.success("Saved to Library! +5 XP");
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Failed to save.");
      }
    },
    [messages, token]
  );

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  const handleOptionsChange = useCallback((key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleImageSelect = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const mediaType = file.type || "image/png";
      setAttachments((a) => [
        ...a,
        { id: ++attachmentId, type: "image", name: file.name, data: data.replace(/^data:[^;]+;base64,/, ""), mediaType },
      ]);
      toast.success("Image added.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (file.type.startsWith("image/")) {
      handleImageSelect(file);
      return;
    }
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments((a) => [...a, { id: ++attachmentId, type: "file", name: file.name, text: e.target.result }]);
        setInput((c) => (c ? c + "\n\n" : "") + e.target.result);
        toast.success("File added.");
      };
      reader.readAsText(file);
      return;
    }
    toast.error("Upload a .txt file or an image.");
  }, [handleImageSelect]);

  const handleLinkAdd = useCallback((url) => {
    setAttachments((a) => [...a, { id: ++attachmentId, type: "link", url }]);
    toast.success("Link noted — Claude will reference it based on context.");
  }, []);

  const handleRemoveAttachment = useCallback((index) => {
    setAttachments((a) => a.filter((_, i) => i !== index));
  }, []);

  const handlePasteAdd = useCallback((text) => {
    const label = text.slice(0, 30) + (text.length > 30 ? "…" : "");
    setAttachments((a) => [
      ...a,
      { id: ++attachmentId, type: "paste", name: label, text },
    ]);
    toast.success("Text added.");
  }, []);

  return (
    <div className="study-hub flex flex-1 overflow-hidden bg-hub-bg font-hub-sans text-hub-text min-h-0">

      {/* ── Collapsible Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex shrink-0 flex-col overflow-hidden border-r border-hub-border bg-hub-surface"
            style={{ minWidth: 0 }}
          >
            {/* Sidebar header */}
            <div className="flex shrink-0 items-center justify-between border-b border-hub-border px-4 py-3">
              <span className="font-hub-sans text-sm font-semibold text-hub-text">Chat History</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
                aria-label="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-2">
              {MOCK_CHAT_HISTORY.map((session) => {
                const badge = MODE_BADGE[session.mode] ?? { label: session.mode, cls: "bg-hub-elevated text-hub-muted" };
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => toast.info("Session loaded")}
                    className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition hover:bg-hub-elevated"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-hub-sans text-sm md:text-xs font-medium leading-snug text-hub-text">
                        {session.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-md px-1.5 py-0.5 font-hub-sans text-sm md:text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="font-hub-sans text-sm md:text-[10px] text-hub-dimmed">{session.date}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-hub-border px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-hub-elevated ${
                sidebarOpen ? "text-hub-accent" : "text-hub-muted hover:text-hub-text"
              }`}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hub-accent" />
              <span className="font-hub-sans text-base font-semibold text-hub-text">Study Hub</span>
            </div>

            {useMock && (
              <span className="rounded-full bg-hub-elevated px-2 py-0.5 font-hub-sans text-sm md:text-[10px] text-hub-muted">
                demo
              </span>
            )}
          </div>

          {/* New Chat button */}
          <button
            type="button"
            onClick={resetChat}
            className="flex items-center gap-1.5 rounded-xl border border-hub-border bg-hub-surface px-3 py-2 font-hub-sans text-sm text-hub-muted transition hover:bg-hub-elevated hover:text-hub-text"
          >
            <Pencil className="h-3.5 w-3.5" />
            New Chat
          </button>
        </header>

        {/* Chat area */}
        <ChatArea
          messages={messages}
          onModeChange={handleModeChange}
          onRegenerateMessage={handleRegenerateMessage}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onSave={handleSave}
        />

        {/* Input bar */}
        <div className="shrink-0">
          <ChatInputBar
            mode={mode}
            onModeChange={handleModeChange}
            options={options}
            onOptionsChange={handleOptionsChange}
            model={model}
            onModelChange={setModel}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            onFileSelect={handleFileSelect}
            onImageSelect={handleImageSelect}
            onLinkAdd={handleLinkAdd}
            onPasteAdd={handlePasteAdd}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            disabled={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
