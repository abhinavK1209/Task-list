/**
 * PRIORITY SCORING SYSTEM
 * ========================
 * Score = urgencyScore + difficultyScore + keywordScore + customFactorScores
 *
 * Final score range: ~0–155+ (higher with custom factors)
 * Label thresholds:  High ≥ 80 | Medium ≥ 40 | Low < 40
 */

// ── 1. URGENCY SCORE (0–100) ────────────────────────────────────────────────
function urgencyScore(dueDateStr) {
  if (!dueDateStr) return 0;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0)  return 100;
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
    default:       return 15;
  }
}

// ── 3. KEYWORD BOOST (0–25) ─────────────────────────────────────────────────
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

// ── 4. CUSTOM FACTOR SCORE ───────────────────────────────────────────────────
// Sums the scores of any user-defined factors applied to the task.
function customScore(task, customFactors = []) {
  let total = 0;
  for (const factor of customFactors) {
    const chosen = task.customFactors?.[factor.id];
    if (chosen) {
      const opt = factor.options.find(o => o.label === chosen);
      if (opt) total += Number(opt.score) || 0;
    }
  }
  return total;
}

// ── COMBINED SCORE ───────────────────────────────────────────────────────────
export function computePriorityScore(task, customFactors = []) {
  return (
    urgencyScore(task.dueDate) +
    difficultyScore(task.difficulty) +
    keywordScore(task.title, task.description) +
    customScore(task, customFactors)
  );
}

// ── LABEL FROM SCORE ────────────────────────────────────────────────────────
export function priorityLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ── SORT HELPER ──────────────────────────────────────────────────────────────
export function sortByPriority(tasks, customFactors = []) {
  return [...tasks].sort((a, b) =>
    computePriorityScore(b, customFactors) - computePriorityScore(a, customFactors)
  );
}

// ── DAYS UNTIL DUE ───────────────────────────────────────────────────────────
export function daysUntil(dueDateStr) {
  if (!dueDateStr) return Infinity;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

// ── HUMAN-READABLE DUE DATE ──────────────────────────────────────────────────
export function formatDueDate(dueDateStr) {
  if (!dueDateStr) return 'No due date';
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (daysLeft < 0)   return `${formatted} (${Math.abs(daysLeft)}d overdue)`;
  if (daysLeft === 0) return `${formatted} (Due today)`;
  if (daysLeft === 1) return `${formatted} (Tomorrow)`;
  if (daysLeft <= 7)  return `${formatted} (${daysLeft}d left)`;
  return formatted;
}
