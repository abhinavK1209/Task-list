/**
 * PRIORITY SCORING SYSTEM
 * ========================
 * Each task receives a numeric score combining three factors:
 *   1. Urgency  — how many days until due (closer = higher score)
 *   2. Difficulty — Hard > Medium > Easy
 *   3. Keywords  — high-stakes words in title/description get a boost
 *
 * Final score range: ~0–155
 * Label thresholds:  High ≥ 80 | Medium ≥ 40 | Low < 40
 */

// ── 1. URGENCY SCORE (0–100) ────────────────────────────────────────────────
// Days remaining mapped to a score on an inverse curve so that
// tasks due today/tomorrow dominate the ranking.
function urgencyScore(dueDateStr) {
  if (!dueDateStr) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0); // compare at day granularity
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0)  return 100; // overdue or due today
  if (daysLeft === 1) return 95;
  if (daysLeft <= 3)  return 85;
  if (daysLeft <= 7)  return 70;
  if (daysLeft <= 14) return 50;
  if (daysLeft <= 30) return 30;
  if (daysLeft <= 60) return 15;
  return 5;
}

// ── 2. DIFFICULTY SCORE (0–30) ──────────────────────────────────────────────
function difficultyScore(difficulty) {
  switch (difficulty) {
    case 'Hard':   return 30;
    case 'Medium': return 20;
    case 'Easy':   return 10;
    default:       return 15; // unset → treat as between Easy and Medium
  }
}

// ── 3. KEYWORD BOOST (0–25) ─────────────────────────────────────────────────
// High-stakes academic / work keywords push a task's priority up.
const HIGH_PRIORITY_KEYWORDS   = ['exam', 'final', 'midterm', 'test', 'quiz'];
const MEDIUM_PRIORITY_KEYWORDS = ['project', 'assignment', 'presentation', 'report', 'essay', 'paper'];
const LOW_PRIORITY_KEYWORDS    = ['homework', 'hw', 'reading', 'review', 'study', 'practice'];

function keywordScore(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();

  if (HIGH_PRIORITY_KEYWORDS.some(kw => text.includes(kw)))   return 25;
  if (MEDIUM_PRIORITY_KEYWORDS.some(kw => text.includes(kw))) return 15;
  if (LOW_PRIORITY_KEYWORDS.some(kw => text.includes(kw)))    return 8;
  return 0;
}

// ── COMBINED SCORE ───────────────────────────────────────────────────────────
export function computePriorityScore(task) {
  return (
    urgencyScore(task.dueDate) +
    difficultyScore(task.difficulty) +
    keywordScore(task.title, task.description)
  );
}

// ── LABEL FROM SCORE ────────────────────────────────────────────────────────
export function priorityLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ── SORT HELPER ──────────────────────────────────────────────────────────────
// Returns a new array sorted highest → lowest priority score.
export function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    const scoreA = computePriorityScore(a);
    const scoreB = computePriorityScore(b);
    return scoreB - scoreA;
  });
}

// ── HUMAN-READABLE DUE DATE ──────────────────────────────────────────────────
export function formatDueDate(dueDateStr) {
  if (!dueDateStr) return 'No due date';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (daysLeft < 0)  return `${formatted} (${Math.abs(daysLeft)}d overdue)`;
  if (daysLeft === 0) return `${formatted} (Due today)`;
  if (daysLeft === 1) return `${formatted} (Tomorrow)`;
  if (daysLeft <= 7)  return `${formatted} (${daysLeft}d left)`;
  return formatted;
}
