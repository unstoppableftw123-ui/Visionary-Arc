import { useState, useRef, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Swords,
  Package,
  MessageSquare,
  Wrench,
  Clock,
  Star,
  Bell,
  Send,
  X,
  Loader2,
  FileText,
  Target,
  Sparkles,
  FolderOpen,
  Link,
  Zap,
} from "lucide-react";
import { AuthContext } from "../App";
import { callAI } from "../services/aiRouter";

// ── Section data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: "library",
    label: "Library",
    icon: BookOpen,
    items: [
      { label: "Flashcard Sets", icon: FileText, href: "/study" },
      { label: "Notes", icon: FileText, href: "/notes-studio" },
      { label: "Whiteboard", icon: Sparkles, href: "/notes-studio" },
    ],
  },
  {
    key: "quests",
    label: "Active Quests",
    icon: Target,
    items: [
      { label: "Daily Missions", icon: Swords, href: "/dashboard" },
      { label: "Challenges", icon: Zap, href: "/challenges" },
    ],
  },
  {
    key: "artifacts",
    label: "Artifacts",
    icon: Package,
    items: [
      { label: "My Projects", icon: FolderOpen, href: "/portfolio" },
      { label: "Submit Link", icon: Link, href: "/portfolio" },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    icon: Wrench,
    items: [
      { label: "SAT/ACT Practice", icon: BookOpen, href: "/practice-hub" },
      { label: "Knowledge Graph", icon: Sparkles, href: "/graph" },
      { label: "Shop", icon: Star, href: "/shop" },
    ],
  },
  {
    key: "recent",
    label: "Recent",
    icon: Clock,
    items: [
      { label: "Study Hub", icon: FileText, href: "/study" },
      { label: "Leaderboard", icon: Star, href: "/rewards" },
    ],
  },
  {
    key: "starred",
    label: "Starred",
    icon: Star,
    items: [],
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    items: [],
  },
];

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 44;

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionRow({ section, isOpen, onToggle, expanded }) {
  const Icon = section.icon;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 group"
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.72rem",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <Icon size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}
            >
              {section.label}
            </motion.span>
          )}
        </AnimatePresence>
        {expanded && (
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.15 }}
            style={{ flexShrink: 0 }}
          >
            <ChevronDown size={11} style={{ color: "var(--text-muted)" }} />
          </motion.div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && expanded && section.items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {section.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors duration-100"
                  style={{
                    marginLeft: "8px",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-3)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <ItemIcon size={16} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </motion.div>
        )}
        {isOpen && expanded && section.items.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                padding: "4px 12px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Nothing here yet
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIChatSection({ expanded, userId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const reply = await callAI({
        feature: "fast",
        prompt: trimmed,
        systemPrompt: "You are a helpful study assistant for students aged 13-19. Be concise and encouraging.",
        userId,
      });
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Sorry, something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const Icon = MessageSquare;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150"
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.72rem",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <Icon size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}
            >
              AI Chat
            </motion.span>
          )}
        </AnimatePresence>
        {expanded && (
          <motion.div
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.15 }}
            style={{ flexShrink: 0 }}
          >
            <ChevronDown size={11} style={{ color: "var(--text-muted)" }} />
          </motion.div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Chat messages */}
            <div
              style={{
                maxHeight: "180px",
                overflowY: "auto",
                margin: "4px 4px 4px 8px",
                borderRadius: "8px",
                padding: "6px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              {messages.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>
                  Ask me anything…
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "6px",
                    textAlign: m.role === "user" ? "right" : "left",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                      maxWidth: "90%",
                      background: m.role === "user" ? "var(--accent)" : "var(--surface-3)",
                      color: m.role === "user" ? "#0e0a07" : "var(--text-primary)",
                      textAlign: "left",
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                  <Loader2 size={14} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                margin: "4px 4px 4px 8px",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask…"
                style={{
                  flex: 1,
                  fontSize: "0.75rem",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                  width: 0,
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  background: "var(--accent)",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Send size={11} color="#0e0a07" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GlobalSidebar() {
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [openSections, setOpenSections] = useState({ library: true, quests: true });
  // Mobile touch tracking
  const touchStartX = useRef(null);
  const sidebarRef = useRef(null);

  // Swipe-to-open on mobile (right edge swipe)
  useEffect(() => {
    function onTouchStart(e) {
      touchStartX.current = e.touches[0].clientX;
    }
    function onTouchEnd(e) {
      if (touchStartX.current === null) return;
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      // Swipe left (from right edge) → open
      if (dx > 50 && touchStartX.current > window.innerWidth - 80) {
        setExpanded(true);
      }
      // Swipe right while open → close
      if (dx < -50 && expanded) {
        setExpanded(false);
      }
      touchStartX.current = null;
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [expanded]);

  // Open sidebar + chat when FloatingAIChat docks
  useEffect(() => {
    function onDockChat() {
      setExpanded(true);
    }
    window.addEventListener("open-sidebar-chat", onDockChat);
    return () => window.removeEventListener("open-sidebar-chat", onDockChat);
  }, []);

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const sidebarStyle = {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    zIndex: 50,
    display: "flex",
    flexDirection: "row",
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpanded(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 49,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
            }}
            className="md:hidden"
          />
        )}
      </AnimatePresence>

      <div ref={sidebarRef} style={sidebarStyle}>
        {/* Toggle button — sits on the left edge of the sidebar panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              position: "relative",
              zIndex: 51,
              width: "18px",
              height: "48px",
              borderRadius: "6px 0 0 6px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRight: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              pointerEvents: "all",
              marginTop: "auto",
              marginBottom: "auto",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        </div>

        {/* Sidebar panel */}
        <motion.div
          animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          style={{
            height: "100%",
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          // Hidden on mobile unless expanded
          className={`${!expanded ? "hidden md:flex" : "flex"}`}
        >
          {/* Header */}
          <div
            style={{
              padding: expanded ? "14px 10px 10px" : "14px 6px 10px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent) 0%, var(--rank-a) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#0e0a07",
                fontFamily: "var(--font-display)",
              }}
            >
              {user?.email?.[0]?.toUpperCase() ?? "V"}
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  style={{ overflow: "hidden" }}
                >
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Quick Access
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    Visionary Arc
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scrollable sections */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: expanded ? "8px 6px" : "8px 4px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {/* AI Chat — first special section */}
            <AIChatSection expanded={expanded} userId={user?.id} />

            <div style={{ height: "4px" }} />

            {/* Standard tree sections */}
            {SECTIONS.map((section) => (
              <SectionRow
                key={section.key}
                section={section}
                expanded={expanded}
                isOpen={!!openSections[section.key]}
                onToggle={() => toggleSection(section.key)}
              />
            ))}
          </div>

          {/* Footer hint */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "8px 10px",
                  borderTop: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center" }}>
                  Press › to collapse
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Spin keyframe for loader */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
