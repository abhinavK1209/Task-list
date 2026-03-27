import TaskItem from './TaskItem';
import { sortByPriority, daysUntil } from '../utils/prioritization';

/**
 * TaskList — renders tasks for the active tab.
 * Tabs: all | overdue | due-soon | upcoming | completed
 */
export default function TaskList({ tasks, filter, customFactors, onComplete, onDelete, onEdit }) {
  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  // Bucket active tasks
  const overdue  = sortByPriority(active.filter(t => daysUntil(t.dueDate) < 0),  customFactors);
  const dueSoon  = sortByPriority(active.filter(t => { const d = daysUntil(t.dueDate); return d >= 0 && d <= 7; }), customFactors);
  const upcoming = sortByPriority(active.filter(t => daysUntil(t.dueDate) > 7),  customFactors);
  const sortedCompleted = [...completed].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  // Choose which list to show based on tab
  let list = [];
  if (filter === 'all')       list = sortByPriority(active, customFactors);
  else if (filter === 'overdue')   list = overdue;
  else if (filter === 'due-soon')  list = dueSoon;
  else if (filter === 'upcoming')  list = upcoming;
  else if (filter === 'completed') list = sortedCompleted;

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    );
  }

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
      {list.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          customFactors={customFactors}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
