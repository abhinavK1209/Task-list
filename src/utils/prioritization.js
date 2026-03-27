/**
 * PRIORITY SCORING SYSTEM
 * ========================
 * Score = urgencyScore + difficultyScore + keywordScore + customFactorScores + projectScore
 *
 * Built-in urgency and difficulty scores are fully configurable via builtinConfig.
 */

// ── Default built-in config (used when none is saved) ───────────────────────
export const DEFAULT_BUILTIN = {
  // Urgency brackets: checked top-to-bottom; first match wins.
  // maxDays: -1 = overdue, null = catch-all (61+ days)
  urgency: [
    { label: 'Overdue',     maxDays: -1,  score: 100 },
    { label: 'Due today',   maxDays: 0,   score: 100 },
    { label: 'Tomorrow',    maxDays: 1,   score: 95  },
    { label: '2–3 days',    maxDays: 3,   score: 85  },
    { label: '4–7 days',    maxDays: 7,   score: 70  },
    { label: '8–14 days',   maxDays: 14,  score: 50  },
    { label: '15–30 days',  maxDays: 30,  score: 30  },
    { label: '31–60 days',  maxDays: 60,  score: 15  },
    { label: '61+ days',    maxDays: null, score: 5  },
  ],
  difficulty: [
    { label: 'Hard',          score: 30 },
    { label: 'Medium',        score: 20 },
    { label: 'Easy',          score: 10 },
    { label: 'Not specified', score: 15 },
  ],
};

// ── 1. URGENCY SCORE ─────────────────────────────────────────────────────────
function urgencyScore(dueDateStr, brackets = DEFAULT_BUILTIN.urgency) {
  if (!dueDateStr) return 0;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  for (const b of brackets) {
    if (b.maxDays === -1 && daysLeft < 0)    return Number(b.score); // overdue
    if (b.maxDays === null)                  return Number(b.score); // catch-all
    if (b.maxDays >= 0 && daysLeft <= b.maxDays && daysLeft >= 0) return Number(b.score);
  }
  return 0;
}

// ── 2. DIFFICULTY SCORE ──────────────────────────────────────────────────────
function difficultyScore(difficulty, options = DEFAULT_BUILTIN.difficulty) {
  const match = options.find(o => o.label === difficulty);
  if (match) return Number(match.score);
  // fallback to "Not specified"
  const fallback = options.find(o => o.label === 'Not specified');
  return fallback ? Number(fallback.score) : 15;
}

// ── 3. KEYWORD BOOST ─────────────────────────────────────────────────────────
const HIGH_KEYWORDS   = ['exam', 'final', 'midterm', 'test', 'quiz'];
const MEDIUM_KEYWORDS = ['project', 'assignment', 'presentation', 'report', 'essay', 'paper'];
const LOW_KEYWORDS    = ['homework', 'hw', 'reading', 'review', 'study', 'practice'];

function keywordScore(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (HIGH_KEYWORDS.some(k => text.includes(k)))   return 25;
  if (MEDIUM_KEYWORDS.some(k => text.includes(k))) return 15;
  if (LOW_KEYWORDS.some(k => text.includes(k)))    return 8;
  return 0;
}

// ── 4. CUSTOM FACTOR SCORE ───────────────────────────────────────────────────
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

// ── 5. PROJECT SCORE ─────────────────────────────────────────────────────────
// Tasks marked as a project get a custom per-task point boost.
function projectScore(task) {
  if (!task.isProject) return 0;
  return Number(task.projectBoost) || 0;
}

// ── COMBINED SCORE ───────────────────────────────────────────────────────────
export function computePriorityScore(task, customFactors = [], _unused = [], builtinConfig = DEFAULT_BUILTIN) {
  return (
    urgencyScore(task.dueDate, builtinConfig.urgency) +
    difficultyScore(task.difficulty, builtinConfig.difficulty) +
    keywordScore(task.title, task.description) +
    customScore(task, customFactors) +
    projectScore(task)
  );
}

// ── LABEL FROM SCORE ────────────────────────────────────────────────────────
export function priorityLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ── SORT HELPER ──────────────────────────────────────────────────────────────
export function sortByPriority(tasks, customFactors = [], _unused = [], builtinConfig = DEFAULT_BUILTIN) {
  return [...tasks].sort((a, b) =>
    computePriorityScore(b, customFactors, [], builtinConfig) -
    computePriorityScore(a, customFactors, [], builtinConfig)
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
  const d = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  const fmt = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (d < 0)  return `${fmt} (${Math.abs(d)}d overdue)`;
  if (d === 0) return `${fmt} (Due today)`;
  if (d === 1) return `${fmt} (Tomorrow)`;
  if (d <= 7)  return `${fmt} (${d}d left)`;
  return fmt;
}
