import { useState, useEffect } from "react";
import { gradebookAPI } from "../services/apiService";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import { Badge } from "../components/ui/badge";

function pct(score, max) {
  if (score == null || !max) return null;
  return Math.round((score / max) * 100);
}

function pctToLetter(p) {
  if (p == null) return "—";
  if (p >= 90) return "A";
  if (p >= 80) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}

const LETTER_STYLE = {
  A: "text-green-700 font-bold",
  B: "text-blue-700 font-bold",
  C: "text-amber-700 font-bold",
  D: "text-red-600 font-bold",
  F: "text-red-700 font-bold",
  "—": "text-muted-foreground",
};

export default function MyGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradebookAPI
      .getMyGrades()
      .then((data) => setGrades(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load grades"))
      .finally(() => setLoading(false));
  }, []);

  // Compute overall average
  const scored = grades.filter((g) => g.score != null && g.maxScore);
  const overallPct =
    scored.length > 0
      ? Math.round(scored.reduce((sum, g) => sum + pct(g.score, g.maxScore), 0) / scored.length)
      : null;
  const overallLetter = pctToLetter(overallPct);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="My Grades" subtitle="Your submissions, scores, and teacher feedback" />

      {/* Summary strip */}
      {!loading && grades.length > 0 && (
        <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-5 py-4">
          <div className="text-center">
            <p className={`text-3xl ${LETTER_STYLE[overallLetter]}`}>{overallLetter}</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Overall</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-semibold">{overallPct != null ? `${overallPct}%` : "—"}</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Average</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-semibold">{grades.length}</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Submissions</p>
          </div>
          {grades.some((g) => g.isLate) && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-semibold text-orange-500">
                  {grades.filter((g) => g.isLate).length}
                </p>
                <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Late</p>
              </div>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No graded submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grades.map((g) => {
            const p = pct(g.score, g.maxScore);
            const letter = pctToLetter(p);
            return (
              <div
                key={g.submission_id}
                className="rounded-lg border border-border bg-card px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: assignment info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm leading-tight">{g.assignmentTitle}</p>
                      {g.isLate && (
                        <Badge
                          variant="outline"
                          className="text-sm md:text-[10px] py-0 border-orange-400 text-orange-500"
                        >
                          Late
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{g.className}</p>
                    <p className="text-sm md:text-xs text-muted-foreground">
                      Submitted{" "}
                      {new Date(g.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Right: score + letter */}
                  <div className="text-right shrink-0">
                    <p className={`text-xl leading-tight ${LETTER_STYLE[letter]}`}>{letter}</p>
                    <p className="text-sm text-muted-foreground">
                      {g.score}/{g.maxScore}
                      {p != null && (
                        <span className="ml-1 text-sm md:text-xs">({p}%)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Teacher comment */}
                {g.teacherComment && (
                  <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm md:text-xs text-muted-foreground border-l-2 border-primary/40">
                    <span className="font-medium text-foreground/70">Teacher: </span>
                    {g.teacherComment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
