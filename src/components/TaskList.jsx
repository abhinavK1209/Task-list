import TaskItem from './TaskItem';
import { sortByPriority } from '../utils/prioritization';

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dueDateStr) {
  if (!dueDateStr) return Infinity;
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today()) / (1000 * 60 * 60 * 24));
}

/**
 * TaskList — renders tasks split into Overdue / Due Soon / Upcoming / Completed.
 */
export default function TaskList({ tasks, filter, onComplete, onDelete, onEdit }) {
  const activeTasks    = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Bucket active tasks by urgency
  const overdue   = sortByPriority(activeTasks.filter(t => daysUntil(t.dueDate) < 0));
  const dueSoon   = sortByPriority(activeTasks.filter(t => { const d = daysUntil(t.dueDate); return d >= 0 && d <= 7; }));
  const upcoming  = sortByPriority(activeTasks.filter(t => daysUntil(t.dueDate) > 7));

  const sortedCompleted = [...completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const showActive    = filter === 'all' || filter === 'active';
  const showCompleted = filter === 'all' || filter === 'completed';

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  function Section({ label, count, tasks, className = '' }) {
    if (tasks.length === 0) return null;
    return (
      <section className={`task-section ${className}`}>
        <h3 className={`section-label ${className}-label`}>
          {label}
          <span className="count-badge">{count}</span>
        </h3>
        <div className="task-cards">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task}
              onComplete={onComplete} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="task-list-wrapper">
      {showActive && activeTasks.length === 0 && filter === 'active' && (
        <div className="empty-state small"><p>All done! No active tasks.</p></div>
      )}

      {showActive && (
        <>
          <Section label="Overdue"  count={overdue.length}  tasks={overdue}  className="section-overdue" />
          <Section label="Due Soon" count={dueSoon.length}  tasks={dueSoon}  className="section-due-soon" />
          <Section label="Upcoming" count={upcoming.length} tasks={upcoming} className="section-upcoming" />
        </>
      )}

      {showCompleted && completedTasks.length > 0 && (
        <section className="task-section completed-section">
          <h3 className="section-label completed-label">
            Completed
            <span className="count-badge">{completedTasks.length}</span>
          </h3>
          <div className="task-cards">
            {sortedCompleted.map(task => (
              <TaskItem key={task.id} task={task}
                onComplete={onComplete} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}

      {showCompleted && completedTasks.length === 0 && filter === 'completed' && (
        <div className="empty-state small"><p>No completed tasks yet.</p></div>
      )}
    </div>
  );
}
