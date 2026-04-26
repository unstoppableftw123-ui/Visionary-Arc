import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../App";
import { detectTool, interpolate, MOCK_RESPONSES } from "./useAITool";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStudentAITool() {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coinBalance, setCoinBalance] = useState(null);
  const [studentContext, setStudentContext] = useState(null);
  const chatEndRef = useRef(null);

  // Load enrolled classes + coin balance on mount (once user is available)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Enrolled classes → build subject/class context
      try {
        const res = await axios.get("/api/classes");
        const classes = Array.isArray(res.data) ? res.data : [];
        const subjects = [...new Set(classes.map((c) => c.subject).filter(Boolean))];
        setStudentContext({
          name: user.name || "Student",
          grade: user.grade || user.gradeLevel || "",
          classes: classes.map((c) => c.name).join(", "),
          subjects: subjects.join(", "),
        });
      } catch {
        setStudentContext({
          name: user.name || "Student",
          grade: user.grade || user.gradeLevel || "",
          classes: "",
          subjects: "",
        });
      }
      // Coin balance
      try {
        const res = await axios.get("/api/coins/balance");
        setCoinBalance(res.data?.balance ?? null);
      } catch {
        setCoinBalance(null);
      }
    };
    load();
  }, [user?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll whenever history grows
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const buildSystemPrompt = () => {
    if (!studentContext) return "";
    const { name, grade, classes, subjects } = studentContext;
    let s = `You are a personal AI tutor for a student named ${name}.`;
    if (classes) s += ` They are enrolled in: ${classes}.`;
    if (subjects) s += ` Their current subject focus is ${subjects}.`;
    if (grade) s += ` Adapt your language to their grade level: ${grade}.`;
    return s;
  };

  const generate = async ({ promptTemplate, formData }) => {
    // Guard: no coins
    if (coinBalance !== null && coinBalance <= 0) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    const userMessage = interpolate(promptTemplate, formData);
    const newHistory = [...history, { role: "user", content: userMessage }];
    setHistory(newHistory);

    try {
      // Deduct 1 coin
      try {
        const spendRes = await axios.post("/api/coins/spend", {
          amount: 1,
          reason: "AI tool usage",
        });
        const newBal = spendRes.data?.balance;
        if (newBal !== undefined) {
          setCoinBalance(newBal);
        } else {
          setCoinBalance((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
        }
      } catch {
        setCoinBalance((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }

      // Try real API with full conversation history
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newHistory,
            systemPrompt: buildSystemPrompt(),
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          const text = data.result || data.content || "";
          const updated = [...newHistory, { role: "assistant", content: text }];
          setHistory(updated);
          return text;
        }
      } catch {
        clearTimeout(timeout);
      }

      // Mock fallback: simulate generation delay then return tool-matched response
      await new Promise((r) => setTimeout(r, 1600 + Math.random() * 800));
      const toolKey = detectTool(userMessage);
      const mockText = MOCK_RESPONSES[toolKey] ?? MOCK_RESPONSES.generic;
      const updated = [...newHistory, { role: "assistant", content: mockText }];
      setHistory(updated);
      return mockText;
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setError(null);
  };

  return { history, isLoading, error, coinBalance, generate, clearHistory, chatEndRef };
}
