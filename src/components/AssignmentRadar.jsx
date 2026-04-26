import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Sparkles, Calendar, RefreshCw, AlertCircle } from "lucide-react";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const MS_24H = 86_400_000;
const MS_3D = 259_200_000;
const MS_7D = 604_800_000;

function getUrgency(dueDate) {
  const now = Date.now();
  const msUntil = new Date(dueDate).getTime() - now;
  if (msUntil < 0) return "overdue";
  if (msUntil < MS_24H) return "red";
  if (msUntil < MS_3D) return "amber";
  if (msUntil < MS_7D) return "green";
  return "muted";
}

function formatDueLabel(dueDate) {
  const d = new Date(dueDate);
  const now = Date.now();
  const ms = d.getTime() - now;
  if (ms < 0) {
    const hours = Math.abs(Math.floor(ms / (60 * 60 * 1000)));
    return hours < 24 ? `Overdue by ${hours}h` : "Overdue";
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Due in under an hour";
  if (hours < 24) return `Due in ${hours}h`;
  if (days === 1) return "Due tomorrow";
  if (days < 7) return `Due in ${days} days`;
  return `Due ${d.toLocaleDateString()}`;
}

const urgencyStyles = {
  overdue:
    "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  amber:
    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  green:
    "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
  muted:
    "bg-muted/50 dark:bg-muted/30 border-border text-muted-foreground",
};

const urgencyDot = {
  overdue: "bg-red-500",
  red: "bg-red-500",
  amber: "bg-brand-orange",
  green: "bg-emerald-500",
  muted: "bg-muted-foreground",
};

async function fetchWeeklyBrief(pendingTasksText) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("REACT_APP_ANTHROPIC_API_KEY is not set.");
  }

  const system =
    "You are a student planning assistant. In exactly 3 sentences, summarize what this student should focus on this week based on their pending tasks and deadlines. Be specific and actionable. Return only the 3 sentences, no headings or bullet points.";
  const userContent =
    pendingTasksText.trim() ||
    "The student has no pending tasks with due dates listed.";

  const body = {
    model: DEFAULT_MODEL,
    max_tokens: 256,
    system,
    messages: [{ role: "user", content: [{ type: "text", text: userContent }] }],
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = `API error ${response.status}`;
    try {
      const j = JSON.parse(errText);
      message = j.error?.message || errText || message;
    } catch (_) {
      message = errText || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  return textBlock?.text?.trim() || "";
}

export default function AssignmentRadar({ tasks = [] }) {
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState(null);

  const pendingWithDue = useMemo(() => {
    const list = (Array.isArray(tasks) ? tasks : [])
      .filter((t) => !t.completed && t.due_date)
      .map((t) => ({ ...t, urgency: getUrgency(t.due_date) }))
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return list;
  }, [tasks]);

  const pendingTasksText = useMemo(() => {
    return pendingWithDue
      .map(
        (t) =>
          `- ${t.title} (due: ${formatDueLabel(t.due_date)}, priority: ${t.priority || "normal"})`
      )
      .join("\n");
  }, [pendingWithDue]);

  const loadBrief = async () => {
    setBriefError(null);
    setBriefLoading(true);
    try {
      const text = await fetchWeeklyBrief(pendingTasksText);
      setBrief(text);
    } catch (err) {
      setBriefError(err?.message || "Failed to load weekly brief");
    } finally {
      setBriefLoading(false);
    }
  };

  useEffect(() => {
    loadBrief();
  }, []); // Run once on mount; re-run would need pendingTasksText in deps if we want refresh when tasks change

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-6 space-y-4"
    >
      {/* Weekly Brief card */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-orange" />
            Weekly Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {briefLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {briefError && (
            <div className="flex flex-col gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {briefError}
              </p>
              <Button variant="outline" size="sm" onClick={loadBrief} className="w-fit">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
          {!briefLoading && !briefError && brief && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {brief}
            </p>
          )}
          {!briefLoading && !briefError && !brief && (
            <p className="text-sm text-muted-foreground">
              No pending tasks with due dates. Add tasks with deadlines to get a weekly focus summary.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Upcoming assignments & tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingWithDue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming assignments or tasks with due dates. Add due dates on your tasks to see them here.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingWithDue.map((task) => (
                <li
                  key={task.task_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${urgencyStyles[task.urgency]}`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${urgencyDot[task.urgency]}`}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {task.category && (
                        <Badge variant="secondary" className="text-sm md:text-xs font-normal">
                          {task.category}
                        </Badge>
                      )}
                      <span className="text-sm md:text-xs opacity-90">
                        {formatDueLabel(task.due_date)}
                      </span>
                      {task.priority && task.priority !== "medium" && (
                        <Badge
                          variant="outline"
                          className="text-sm md:text-xs font-normal capitalize"
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
