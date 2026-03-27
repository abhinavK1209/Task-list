/**
 * Sample pre-loaded tasks.
 * Replace or extend these once the ICS file is available.
 * All tasks are due after 3/12 as requested.
 */

function id() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const INITIAL_TASKS = [
  {
    id: id(),
    title: 'Midterm Exam – Chemistry',
    description: 'Covers chapters 1–8. Review periodic table, bonding, reactions.',
    dueDate: '2026-03-28',
    difficulty: 'Hard',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: id(),
    title: 'Project Proposal – Software Engineering',
    description: 'Submit 2-page proposal with team members and project scope.',
    dueDate: '2026-04-01',
    difficulty: 'Medium',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: id(),
    title: 'Reading Assignment – History Ch. 12',
    description: 'Read and annotate chapter 12. Bring notes to class.',
    dueDate: '2026-04-04',
    difficulty: 'Easy',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: id(),
    title: 'Essay – English Composition',
    description: '1500-word argumentative essay on media literacy.',
    dueDate: '2026-04-10',
    difficulty: 'Medium',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: id(),
    title: 'Final Exam – Calculus II',
    description: 'Cumulative final. Focus on integration techniques and series.',
    dueDate: '2026-05-05',
    difficulty: 'Hard',
    completed: false,
    createdAt: Date.now(),
  },
];
