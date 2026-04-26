import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { mockStudents } from "../../data/mockTeacherData";

const STATUS_CONFIG = {
  on_track: { label: "On Track", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  struggling: { label: "Struggling", className: "bg-brand-orange/15 text-brand-deep border-brand-orange/20" },
  at_risk: { label: "At Risk", className: "bg-red-500/15 text-red-600 border-red-500/20" },
};

const GRADE_COLORS = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-brand-deep",
  D: "text-red-500",
  F: "text-red-600 font-bold",
};

const FILTERS = ["All", "On Track", "Struggling", "At Risk"];

export default function Students() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filterKey = { "On Track": "on_track", "Struggling": "struggling", "At Risk": "at_risk" };

  const filtered = mockStudents.filter((s) => {
    const matchSearch =
      !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" || s.status === filterKey[filter];
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Students</h1>
        <p className="text-muted-foreground mt-1">{mockStudents.length} students across all classes</p>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm md:text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Student list */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="hidden gap-x-4 border-b border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto_auto] lg:text-xs">
          <span>Student</span>
          <span />
          <span>Status</span>
          <span>Consistency</span>
          <span>Last Active</span>
          <span>Grade</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((s) => {
            const cfg = STATUS_CONFIG[s.status];
            const initials = s.name.split(" ").map((n) => n[0]).join("");
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toast.info("Student profile coming soon")}
                className="grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30 lg:grid-cols-[auto_1fr_auto_auto_auto_auto] lg:gap-x-4 lg:gap-y-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-sm md:text-xs text-muted-foreground">{s.grade} Grade · {s.assignmentsCompleted}/{s.assignmentsTotal} assignments done</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-sm md:text-[10px] font-semibold ${cfg.className}`}>
                  {cfg.label}
                </span>
                <div className="flex items-center gap-2 w-28">
                  <Progress value={s.consistencyScore} className="h-1.5 flex-1" />
                  <span className="text-sm md:text-xs text-muted-foreground w-7 text-right">{s.consistencyScore}%</span>
                </div>
                <span className="text-sm md:text-xs text-muted-foreground whitespace-nowrap">{s.lastActive}</span>
                <span className={`text-sm font-bold ${GRADE_COLORS[s.currentGrade]}`}>{s.currentGrade}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No students match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
