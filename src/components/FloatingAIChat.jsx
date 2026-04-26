import { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Minus, PanelRight, Send, Zap, Loader2, Clock } from "lucide-react";
import { AuthContext } from "../App";
import { callAI } from "../services/aiRouter";

const BRAND = {
  orange: "#e8722a",
  surface: "#150f09",
  surfaceEl: "#1e160d",
  tan: "#c4a882",
  border: "rgba(196,168,130,0.15)",
  orangeGlow: "rgba(232,114,42,0.35)",
};

const USE_MOCK = process.env.REACT_APP_USE_MOCK === "true";

const CHIP_MAP = {
  "/questboard":  ["⚡ Generate Quest", "💡 Get Hint", "🧠 Quiz Me"],
  "/library":     ["⚡ Flashcards", "📋 Summarize", "🔍 Search Docs"],
  "/dashboard":   ["📊 My Progress", "🎯 Next Quest", "💰 Earn More"],
};
const DEFAULT_CHIPS = ["⚡ Generate", "🧠 Quiz", "📋 Summarize"];

const SYSTEM_PROMPT =
  "You are an AI Mentor for Visionary Arc, a gamified career and study platform for students aged 13–19. " +
  "Be encouraging, concise, and practical. When suggesting actions, relate them to XP, coins, tracks, or quests when relevant.";

const MOCK_REPLIES = [
  "Great question! Here's a quick tip: consistent daily study sessions earn you the most XP over time. Try 3 focused sessions today!",
  "To level up faster, focus on completing your daily missions first — they give 25–75 XP each. 🎯",
  "You're on the right track! Keep building your streak for a massive 200 XP bonus at day 7. 🔥",
  "Pro tip: submitting a completed project earns up to 1,000 XP at Expert level — start with a Starter brief to warm up!",
];
let mockIndex = 0;
function getMockReply() {
  const reply = MOCK_REPLIES[mockIndex % MOCK_REPLIES.length];
  mockIndex++;
  return reply;
}

function formatSessionDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now - 86400000).toDateString();
  if (d.toDateString() === today)
    return `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (d.toDateString() === yesterday)
    return `Yesterday · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    ` · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  );
}

export default function FloatingAIChat({ onDock }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const prevOpenRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasContextSuggestion] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("va_chat_history") || "[]");
    } catch {
      return [];
    }
  });

  const chips = CHIP_MAP[location.pathname] ?? DEFAULT_CHIPS;

  // Keep messagesRef current so the close-effect can read latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When the panel closes: save non-empty session to history, reset history view
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      setShowHistory(false);
      if (messagesRef.current.length > 0) {
        const session = {
          id: Date.now(),
          date: new Date().toISOString(),
          messages: [...messagesRef.current],
        };
        setSessions((prev) => {
          const updated = [session, ...prev].slice(0, 20);
          try {
            localStorage.setItem("va_chat_history", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setMessages([]);
      }
    }
    prevOpenRef.current = open;
  }, [open]);

  async function send(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      let reply;
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        reply = getMockReply();
      } else {
        reply = await callAI({
          feature: "ai_tutor",
          prompt: trimmed,
          systemPrompt: SYSTEM_PROMPT,
          userId: user?.id,
        });
      }
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleDock() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("open-sidebar-chat"));
    onDock?.();
  }

  // Shared style for header icon buttons
  const iconBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <>
      {/* Full-viewport constraint ref for drag bounds */}
      <div
        ref={constraintsRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />

      {/* Floating panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ scale: 0.1, opacity: 0, transformOrigin: "bottom right" }}
            animate={{ scale: 1, opacity: 1, transformOrigin: "bottom right" }}
            exit={{ scale: 0.1, opacity: 0, transformOrigin: "bottom right" }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed",
              bottom: 80,
              right: 20,
              width: 340,
              height: 400,
              zIndex: 9999,
              borderRadius: 16,
              background: BRAND.surface,
              border: `1px solid ${BRAND.border}`,
              boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${BRAND.border}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              cursor: "auto",
            }}
          >
            {/* Header — drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${BRAND.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "grab",
                background: BRAND.surfaceEl,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18 }}>⚡</span>
              <span
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: BRAND.tan,
                  fontFamily: "var(--font-display, sans-serif)",
                  letterSpacing: "0.04em",
                }}
              >
                AI Mentor
              </span>

              {/* History toggle */}
              <button
                onClick={() => setShowHistory((h) => !h)}
                title="Chat history"
                style={{
                  ...iconBtn,
                  color: showHistory ? BRAND.orange : BRAND.tan,
                  opacity: showHistory ? 1 : 0.7,
                }}
              >
                <Clock size={15} />
              </button>

              {/* Dock to sidebar */}
              <button
                onClick={handleDock}
                title="Dock to sidebar"
                style={{ ...iconBtn, color: BRAND.tan, opacity: 0.7 }}
              >
                <PanelRight size={15} />
              </button>

              {/* Minimize */}
              <button
                onClick={() => setOpen(false)}
                title="Minimize"
                style={{ ...iconBtn, color: BRAND.tan, opacity: 0.7 }}
              >
                <Minus size={15} />
              </button>
            </div>

            {/* Inner body — history panel overlays the chat body */}
            <div
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* ── History panel — slides in from the left ── */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ x: -340 }}
                    animate={{ x: 0 }}
                    exit={{ x: -340 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: BRAND.surface,
                      zIndex: 5,
                      display: "flex",
                      flexDirection: "column",
                      overflowY: "auto",
                    }}
                  >
                    {sessions.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          padding: "0 28px",
                        }}
                      >
                        <Clock
                          size={30}
                          style={{ color: "rgba(196,168,130,0.2)" }}
                        />
                        <p
                          style={{
                            textAlign: "center",
                            color: "rgba(196,168,130,0.4)",
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-body, sans-serif)",
                            lineHeight: 1.5,
                          }}
                        >
                          No previous conversations yet
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: "10px 10px 14px" }}>
                        <p
                          style={{
                            fontSize: "0.68rem",
                            color: "rgba(196,168,130,0.35)",
                            fontFamily: "var(--font-body, sans-serif)",
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          Recent sessions
                        </p>
                        {sessions.map((session) => {
                          const preview =
                            session.messages.find((m) => m.role === "user")?.text ?? "";
                          const msgCount = session.messages.length;
                          return (
                            <div
                              key={session.id}
                              style={{
                                background: BRAND.surfaceEl,
                                border: `1px solid ${BRAND.border}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                marginBottom: 6,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.67rem",
                                  color: "rgba(196,168,130,0.4)",
                                  fontFamily: "var(--font-body, sans-serif)",
                                  marginBottom: 3,
                                }}
                              >
                                {formatSessionDate(session.date)}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.78rem",
                                  color: BRAND.tan,
                                  fontFamily: "var(--font-body, sans-serif)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {preview.length > 52
                                  ? preview.slice(0, 52) + "…"
                                  : preview}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.65rem",
                                  color: "rgba(196,168,130,0.28)",
                                  fontFamily: "var(--font-body, sans-serif)",
                                  marginTop: 3,
                                }}
                              >
                                {msgCount} message{msgCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Context chips ── */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "8px 10px",
                  flexShrink: 0,
                  flexWrap: "wrap",
                  borderBottom: `1px solid ${BRAND.border}`,
                }}
              >
                {chips.map((chip) => (
                  <motion.button
                    key={chip}
                    onClick={() => send(chip.replace(/^[^a-zA-Z]+/, "").trim())}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: "rgba(232,114,42,0.12)",
                      border: "1px solid rgba(232,114,42,0.3)",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: "0.72rem",
                      color: BRAND.tan,
                      cursor: "pointer",
                      fontFamily: "var(--font-body, sans-serif)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chip}
                  </motion.button>
                ))}
              </div>

              {/* ── Messages ── */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {messages.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      color: "rgba(196,168,130,0.4)",
                      fontSize: "0.78rem",
                      marginTop: 24,
                      fontFamily: "var(--font-body, sans-serif)",
                    }}
                  >
                    Ask me anything or tap a chip above…
                  </p>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background:
                        msg.role === "user"
                          ? BRAND.orange
                          : "rgba(196,168,130,0.1)",
                      borderRadius:
                        msg.role === "user"
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                      padding: "7px 11px",
                      fontSize: "0.8rem",
                      lineHeight: 1.45,
                      color: msg.role === "user" ? "#fff" : BRAND.tan,
                      fontFamily: "var(--font-body, sans-serif)",
                      border:
                        msg.role === "ai" ? `1px solid ${BRAND.border}` : "none",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      alignSelf: "flex-start",
                      background: "rgba(196,168,130,0.1)",
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: "14px 14px 14px 4px",
                      padding: "8px 12px",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <Loader2
                      size={13}
                      style={{ color: BRAND.orange, animation: "spin 1s linear infinite" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: BRAND.tan }}>
                      Thinking…
                    </span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input bar ── */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "8px 10px",
                  borderTop: `1px solid ${BRAND.border}`,
                  background: BRAND.surfaceEl,
                  flexShrink: 0,
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your AI Mentor…"
                  style={{
                    flex: 1,
                    background: "rgba(196,168,130,0.07)",
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 10,
                    padding: "7px 11px",
                    fontSize: "0.8rem",
                    color: "#f9fafb",
                    outline: "none",
                    fontFamily: "var(--font-body, sans-serif)",
                  }}
                />
                <motion.button
                  onClick={() => send()}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  disabled={!input.trim() || loading}
                  style={{
                    background:
                      input.trim() && !loading
                        ? BRAND.orange
                        : "rgba(232,114,42,0.3)",
                    border: "none",
                    borderRadius: 10,
                    padding: "7px 10px",
                    cursor: input.trim() && !loading ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                >
                  <Send size={15} color="#fff" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: open
            ? `0 0 0 0 ${BRAND.orangeGlow}`
            : [
                `0 0 0 0px ${BRAND.orangeGlow}`,
                `0 0 0 12px rgba(232,114,42,0)`,
              ],
        }}
        transition={
          open
            ? { duration: 0.2 }
            : {
                boxShadow: {
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeOut",
                },
              }
        }
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: BRAND.orange,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        <Zap size={22} color="#fff" fill="#fff" />
        {/* Red badge */}
        {!open && hasContextSuggestion && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #150f09",
            }}
          />
        )}
      </motion.button>
    </>
  );
}
