import { useState, useEffect, useCallback } from "react";
import { gradebookAPI } from "../../services/apiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

function pct(score, max) {
  if (score == null || !max) return null;
  return Math.round((score / max) * 100);
}

function pctToLetter(p) {
  if (p == null) return null;
  if (p >= 90) return "A";
  if (p >= 80) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}

const GRADE_CELL = {
  A: "bg-green-500/15 text-green-700 font-semibold",
  B: "bg-blue-500/15 text-blue-700 font-semibold",
  C: "bg-brand-orange/15 text-brand-deep font-semibold",
  D: "bg-red-500/15 text-red-600 font-semibold",
  F: "bg-red-600/15 text-red-700 font-bold",
};

function exportCSV(students, assignments, submissionsMap) {
  const header = ["Student", "Grade", ...assignments.map((a) => `${a.title} (/${a.maxScore})`), "Average %"];
  const rows = students.map((s) => {
    const cells = assignments.map((a) => {
      const sub = submissionsMap?.[s.id]?.[a.id];
      return sub ? `${sub.score}/${sub.maxScore}${sub.isLate ? " (Late)" : ""}` : "—";
    });
    const scored = assignments
      .map((a) => submissionsMap?.[s.id]?.[a.id])
      .filter(Boolean)
      .map((sub) => pct(sub.score, sub.maxScore));
    const avg = scored.length
      ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
      : null;
    return [s.name, s.grade, ...cells, avg != null ? `${avg}%` : "—"];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gradebook.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function SubmissionDetail({
  submission,
  student,
  assignment,
  commentInput,
  setCommentInput,
  scoreInput,
  setScoreInput,
  saving,
  onSaveComment,
  onSaveScore,
}) {
  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{student.name}</p>
          <p className="text-sm md:text-xs text-muted-foreground">{assignment.title}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm md:text-xs text-muted-foreground">Submitted</p>
          <p className="text-sm md:text-xs">
            {new Date(submission.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {submission.isLate && (
            <span className="text-sm md:text-[10px] font-semibold text-orange-500 uppercase tracking-wide">
              Late
            </span>
          )}
        </div>
      </div>

      {/* Score override */}
      <div>
        <p className="text-sm md:text-xs font-medium text-muted-foreground mb-1">Score Override</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            min={0}
            max={submission.maxScore}
          />
          <span className="text-muted-foreground text-sm">/ {submission.maxScore}</span>
          <Button size="sm" variant="outline" onClick={onSaveScore} disabled={saving}>
            Save
          </Button>
        </div>
      </div>

      {/* Student answers */}
      {submission.answers?.length > 0 && (
        <div>
          <p className="text-sm md:text-xs font-medium text-muted-foreground mb-2">Student Answers</p>
          <div className="space-y-2.5 max-h-48 overflow-y-auto rounded border border-border p-2.5 bg-muted/20">
            {submission.answers.map((ans, i) => (
              <div key={i} className="text-sm md:text-xs space-y-0.5">
                <p className="font-medium text-foreground/80">
                  {i + 1}. {ans.question}
                </p>
                <div className="flex items-start gap-1.5 pl-3">
                  <span
                    className={`shrink-0 mt-0.5 font-bold ${
                      ans.isCorrect ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {ans.isCorrect ? "✓" : "✗"}
                  </span>
                  <span>
                    <span className={ans.isCorrect ? "text-green-700" : "text-red-600"}>
                      {ans.studentAnswer}
                    </span>
                    {!ans.isCorrect && (
                      <span className="text-muted-foreground ml-1.5">
                        (correct: {ans.correctAnswer})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher comment */}
      <div>
        <p className="text-sm md:text-xs font-medium text-muted-foreground mb-1">Teacher Comment</p>
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder="Add feedback for the student..."
        />
        <Button size="sm" className="mt-1.5" onClick={onSaveComment} disabled={saving}>
          Save Comment
        </Button>
      </div>
    </div>
  );
}

export default function Gradebook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { submission, student, assignment }
  const [commentInput, setCommentInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await gradebookAPI.getGradebook("cls1");
      setData(result);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load gradebook");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openDetail(student, assignment, submission) {
    setSelected({ submission, student, assignment });
    setCommentInput(submission.teacherComment || "");
    setScoreInput(String(submission.score ?? ""));
  }

  async function saveComment() {
    if (!selected) return;
    setSaving(true);
    try {
      await gradebookAPI.updateComment(selected.submission.submission_id, commentInput);
      selected.submission.teacherComment = commentInput;
      toast.success("Comment saved");
    } catch {
      toast.error("Failed to save comment");
    } finally {
      setSaving(false);
    }
  }

  async function saveScore() {
    if (!selected) return;
    const newScore = parseFloat(scoreInput);
    if (isNaN(newScore) || newScore < 0) {
      toast.error("Enter a valid score");
      return;
    }
    setSaving(true);
    try {
      await gradebookAPI.updateScore(selected.submission.submission_id, newScore);
      selected.submission.score = newScore;
      setData((prev) => ({ ...prev })); // trigger re-render
      toast.success("Score updated");
    } catch {
      toast.error("Failed to update score");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Gradebook</h1>
        </div>
        <div className="rounded-lg border border-border h-64 animate-pulse bg-muted/20" />
      </div>
    );
  }

  const { students = [], assignments = [], submissionsMap = {} } = data || {};

  return (
    <>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Gradebook</h1>
            <p className="text-muted-foreground mt-1">
              Showing {students.length} students · {assignments.length} assignments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(students, assignments, submissionsMap)}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-sm md:text-xs font-medium text-muted-foreground min-w-[160px] sticky left-0 bg-muted/40 z-10">
                  Student
                </th>
                {assignments.map((a) => (
                  <th
                    key={a.id}
                    className="text-center px-3 py-3 text-sm md:text-xs font-medium text-muted-foreground min-w-[120px]"
                  >
                    <div className="truncate max-w-[110px] mx-auto" title={a.title}>
                      {a.title}
                    </div>
                    <div className="text-sm md:text-[10px] text-muted-foreground/60 font-normal capitalize">
                      {a.type}
                    </div>
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-sm md:text-xs font-medium text-muted-foreground min-w-[60px]">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => {
                const subs = assignments.map((a) => submissionsMap?.[s.id]?.[a.id] ?? null);
                const scored = subs.filter(Boolean).map((sub) => pct(sub.score, sub.maxScore));
                const avgPct = scored.length
                  ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
                  : null;
                const avgLetter = pctToLetter(avgPct);
                const initials = s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("");

                return (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-background z-10 border-r border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm md:text-[11px] font-semibold text-muted-foreground">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-sm md:text-xs leading-tight">{s.name}</p>
                          <p className="text-sm md:text-[10px] text-muted-foreground">{s.grade} Grade</p>
                        </div>
                      </div>
                    </td>
                    {subs.map((sub, i) => {
                      const a = assignments[i];
                      const p = sub ? pct(sub.score, sub.maxScore) : null;
                      const letter = pctToLetter(p);
                      return (
                        <td
                          key={i}
                          className={`text-center px-3 py-3 ${
                            sub ? "cursor-pointer hover:bg-muted/40" : ""
                          }`}
                          onClick={() => sub && openDetail(s, a, sub)}
                          title={sub ? "Click to view details" : "Not submitted"}
                        >
                          {sub ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex h-7 min-w-[52px] px-1.5 items-center justify-center rounded-md text-sm md:text-xs ${
                                  GRADE_CELL[letter] ?? ""
                                }`}
                              >
                                {sub.score}/{sub.maxScore}
                              </span>
                              {sub.isLate && (
                                <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-wide">
                                  Late
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm md:text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-3">
                      {avgPct != null ? (
                        <span className={`font-bold text-sm ${GRADE_CELL[avgLetter] ?? ""}`}>
                          {avgLetter}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-sm md:text-xs text-muted-foreground">
          — indicates not submitted. Click any score to view details.{" "}
          <span className="text-orange-500 font-medium">Late</span> flags submitted-after-due-date
          work.
        </p>
      </div>

      {/* Submission detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <SubmissionDetail
              submission={selected.submission}
              student={selected.student}
              assignment={selected.assignment}
              commentInput={commentInput}
              setCommentInput={setCommentInput}
              scoreInput={scoreInput}
              setScoreInput={setScoreInput}
              saving={saving}
              onSaveComment={saveComment}
              onSaveScore={saveScore}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
