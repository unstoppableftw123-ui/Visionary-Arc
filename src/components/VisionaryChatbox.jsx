import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext, API } from "../App";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import { ChatSessionSkeleton } from "./ui/skeleton";

// Icons as inline SVGs for simplicity
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);


export default function VisionaryChatbox() {
  const { user, token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      scrollToBottom();
    }
  }, [messages, user]);

  useEffect(() => {
    if (user && isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory, user]);

  // Don't render if user is not logged in
  if (!user) return null;

  // Fetch sessions when history is opened
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await axios.get(`${API}/ai/visionary/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load a specific session
  const loadSession = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/ai/visionary/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(response.data);
      setMessages(response.data.messages || []);
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/ai/visionary/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSession?.session_id === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setShowHistory(false);
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/ai/visionary/chat`,
        {
          message: userMessage,
          session_id: currentSession?.session_id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update session if new
      if (response.data.is_new_session) {
        setCurrentSession({
          session_id: response.data.session_id,
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")
        });
      }

      // Add AI response
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.response, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again.", 
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Format message content with markdown-like styling
  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-bold text-base mt-2 mb-1">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className="font-bold text-lg mt-2 mb-1">{line.slice(2)}</h2>;
        }
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="mb-1">
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
            </p>
          );
        }
        // Regular text
        if (line.trim()) {
          return <p key={i} className="mb-1">{line}</p>;
        }
        return <br key={i} />;
      });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-orange-700 to-orange-600 hover:from-orange-700 hover:to-orange-600",
          "flex items-center justify-center text-[var(--text-primary)] transition-all duration-300",
          "hover:scale-110 hover:shadow-xl",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Open Visionary AI"
      >
        <SparklesIcon />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] h-[550px] rounded-2xl shadow-2xl",
          "bg-background border border-border overflow-hidden",
          "flex flex-col transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-700 to-orange-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeftIcon />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] flex items-center justify-center">
                <SparklesIcon />
              </div>
            )}
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">
                {showHistory ? "Chat History" : "Visionary AI"}
              </h3>
              {!showHistory && (
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] text-sm md:text-xs">Research & Study Assistant</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <>
                <button
                  onClick={() => {
                    setShowHistory(true);
                    fetchSessions();
                  }}
                  className="p-1.5 text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] hover:text-[var(--text-primary)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] rounded-lg transition-colors"
                  title="Chat History"
                >
                  <HistoryIcon />
                </button>
                <button
                  onClick={startNewChat}
                  className="p-1.5 text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] hover:text-[var(--text-primary)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] rounded-lg transition-colors"
                  title="New Chat"
                >
                  <PlusIcon />
                </button>
              </>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] hover:text-[var(--text-primary)] hover:bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] rounded-lg transition-colors"
              title="Close"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {showHistory ? (
          /* History View */
          <ScrollArea className="flex-1 p-3">
            {loadingSessions ? (
              <div className="space-y-1 py-1">
                {[0, 1, 2].map((i) => (
                  <ChatSessionSkeleton key={i} index={i} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <HistoryIcon />
                <p className="mt-2 text-sm">No chat history yet</p>
                <p className="text-sm md:text-xs">Start a new conversation!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => loadSession(session.session_id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors group",
                      "hover:bg-accent border border-transparent hover:border-border",
                      currentSession?.session_id === session.session_id && "bg-accent border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.title}</p>
                        <p className="text-sm md:text-xs text-muted-foreground mt-0.5">
                          {new Date(session.updated_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.session_id, e)}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          /* Chat View */
          <>
            {/* Session indicator */}
            {currentSession && (
              <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                <p className="text-sm md:text-xs text-muted-foreground truncate">
                  💬 {currentSession.title}
                </p>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-700 to-orange-600 dark:from-orange-900/30 dark:to-orange-950/20 flex items-center justify-center mb-4">
                    <SparklesIcon />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Hello! I'm Visionary AI</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your research & study assistant. Ask me anything!
                  </p>
                  <div className="grid gap-2 w-full">
                    {[
                      "Explain quantum computing simply",
                      "Help me study for my exam",
                      "Research tips for my essay"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="text-sm md:text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-left transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-gradient-to-br from-orange-700 to-orange-600 text-[var(--text-primary)] rounded-br-md"
                            : msg.isError
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-bl-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        {msg.role === "user" ? (
                          <p>{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {formatMessage(msg.content)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Visionary AI..."
                  disabled={loading}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-full text-sm",
                    "bg-muted border-0 focus:ring-2 focus:ring-orange-500/50 outline-none",
                    "placeholder:text-muted-foreground"
                  )}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="rounded-full w-10 h-10 bg-gradient-to-br from-orange-700 to-orange-600 hover:from-orange-700 hover:to-orange-600"
                >
                  <SendIcon />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
