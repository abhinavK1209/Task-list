import TaskItem from './TaskItem';
import { sortByPriority, daysUntil } from '../utils/prioritization';

export default function TaskList({ tasks, filter, customFactors, projects, builtinConfig, onComplete, onDelete, onEdit }) {
  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const args = [customFactors, projects, builtinConfig];

  const overdue  = sortByPriority(active.filter(t => daysUntil(t.dueDate) < 0), ...args);
  const dueSoon  = sortByPriority(active.filter(t => { const d = daysUntil(t.dueDate); return d >= 0 && d <= 7; }), ...args);
  const upcoming = sortByPriority(active.filter(t => daysUntil(t.dueDate) > 7), ...args);
  const sortedCompleted = [...completed].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  // Projects tab: active tasks marked as a project
  const projectTasks = sortByPriority(active.filter(t => t.isProject), ...args);

  let list = [];
  if (filter === 'all')       list = sortByPriority(active, ...args);
  else if (filter === 'overdue')   list = overdue;
  else if (filter === 'due-soon')  list = dueSoon;
  else if (filter === 'upcoming')  list = upcoming;
  else if (filter === 'completed') list = sortedCompleted;

  const itemProps = { customFactors, projects, builtinConfig, onComplete, onDelete, onEdit };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  // ── Projects tab ────────────────────────────────────────────────────────────
  if (filter === 'projects') {
    if (projectTasks.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <p>No project tasks yet.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            When adding or editing a task, set <strong>Project?</strong> to <strong>Yes</strong>.
          </p>
        </div>
      );
    }
    return (
      <div className="task-cards">
        {projectTasks.map(task => <TaskItem key={task.id} task={task} {...itemProps} />)}
      </div>
    );
  }

  // ── Standard tabs ────────────────────────────────────────────────────────────
  if (list.length === 0) {
    const msgs = {
      overdue:   'No overdue tasks.',
      'due-soon': 'Nothing due in the next 7 days.',
      upcoming:  'No upcoming tasks beyond 7 days.',
      completed: 'No completed tasks yet.',
      all:       'No active tasks.',
    };
    return <div className="empty-state small"><p>{msgs[filter]}</p></div>;
  }

  return (
    <div className="task-cards">
      {list.map(task => <TaskItem key={task.id} task={task} {...itemProps} />)}
    </div>
  );
}
