/**
 * Dashboard analytics data derivation from tasks (check_ins, category, tags).
 * Used by the "My Analytics" section; no extra API calls.
 */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Short day label
 */
function formatDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS[d.getDay()];
}

/**
 * Last N days (including today) as YYYY-MM-DD, oldest first.
 * @param {number} n
 * @returns {string[]}
 */
function lastNDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

/**
 * 7-day bar chart: completions per day.
 * @param {Array<{ check_ins?: string[] }>} tasks
 * @returns {Array<{ day: string, date: string, completions: number }>}
 */
export function getLast7DaysCompletions(tasks) {
  const dates = lastNDays(7);
  return dates.map((date) => {
    const completions = (tasks || []).filter((t) =>
      (t.check_ins || []).includes(date)
    ).length;
    return {
      day: formatDay(date),
      date,
      completions,
    };
  });
}

const XP_PER_COMPLETION = 10;

/**
 * 14-day XP line chart (derived from task completions × fixed XP).
 * @param {Array<{ check_ins?: string[] }>} tasks
 * @param {number} [xpPerCompletion]
 * @returns {Array<{ date: string, xp: number, displayDate: string }>}
 */
export function getLast14DaysXp(tasks, xpPerCompletion = XP_PER_COMPLETION) {
  const dates = lastNDays(14);
  return dates.map((date) => {
    const count = (tasks || []).filter((t) =>
      (t.check_ins || []).includes(date)
    ).length;
    const xp = count * xpPerCompletion;
    const d = new Date(date + "T12:00:00");
    const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
    return { date, xp, displayDate };
  });
}

/** Map category + tags to a display subject name */
const SUBJECT_MAP = {
  math: "Math",
  calculus: "Math",
  algebra: "Math",
  geometry: "Math",
  english: "English",
  writing: "English",
  essay: "English",
  vocabulary: "Vocabulary",
  sat: "Test Prep",
  test_prep: "Test Prep",
  act: "Test Prep",
  academics: "General",
  default: "General",
};

/**
 * Infer subject from task (category + first relevant tag).
 * @param {{ category?: string, tags?: string[] }} task
 * @returns {string}
 */
function getSubjectForTask(task) {
  const tags = (task.tags || []).map((t) => t.toLowerCase());
  const cat = (task.category || "academics").toLowerCase();
  for (const tag of tags) {
    if (SUBJECT_MAP[tag]) return SUBJECT_MAP[tag];
  }
  return SUBJECT_MAP[cat] || SUBJECT_MAP.default;
}

/**
 * Radar chart: performance by subject (total check-ins per subject).
 * @param {Array<{ check_ins?: string[], category?: string, tags?: string[] }>} tasks
 * @returns {Array<{ subject: string, value: number, fullMark: number }>}
 */
export function getSubjectScores(tasks) {
  const bySubject = {};
  (tasks || []).forEach((t) => {
    const subject = getSubjectForTask(t);
    const count = (t.check_ins || []).length;
    bySubject[subject] = (bySubject[subject] || 0) + count;
  });
  const subjects = ["Math", "English", "Vocabulary", "Test Prep", "General"];
  const values = subjects.map((s) => ({ subject: s, value: bySubject[s] || 0 }));
  const maxVal = Math.max(1, ...values.map((v) => v.value));
  const fullMark = Math.max(100, maxVal);
  return values.map((v) => ({ ...v, fullMark }));
}

/**
 * Heatmap: last 12 weeks, 7 days (Sun–Sat). Each cell = { date, count }.
 * @param {Array<{ check_ins?: string[] }>} tasks
 * @returns {Array<Array<{ date: string, count: number }>>} weeks, each week = 7 days
 */
export function getHeatmapData(tasks) {
  const countByDate = {};
  (tasks || []).forEach((t) => {
    (t.check_ins || []).forEach((d) => {
      countByDate[d] = (countByDate[d] || 0) + 1;
    });
  });

  const weeks = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7 * w);
    const weekStartDay = weekStart.getDay();
    const weekDates = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekStart);
      cellDate.setDate(weekStart.getDate() - weekStartDay + d);
      const dateStr = cellDate.toISOString().split("T")[0];
      const count = countByDate[dateStr] || 0;
      weekDates.push({ date: dateStr, count });
    }
    weeks.push(weekDates);
  }

  return weeks;
}
