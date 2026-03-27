import TaskItem from './TaskItem';
import { sortByPriority } from '../utils/prioritization';

/**
 * TaskList — renders active and completed task sections based on the active filter.
 * Props:
 *   tasks     — full task array
 *   filter    — 'all' | 'active' | 'completed'
 *   onComplete, onDelete, onEdit — handlers passed through to TaskItem
 */
export default function TaskList({ tasks, filter, onComplete, onDelete, onEdit }) {
  // Split into active and completed
  const activeTasks    = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Sort active tasks by live priority score
  const sortedActive    = sortByPriority(activeTasks);
  // Completed tasks sorted by most recently completed
  const sortedCompleted = [...completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const showActive    = filter === 'all' || filter === 'active';
  const showCompleted = filter === 'all' || filter === 'completed';

  const hasAnything = tasks.length > 0;
  const hasActive   = activeTasks.length > 0;
  const hasCompleted = completedTasks.length > 0;

  if (!hasAnything) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  return (
    <div className="task-list-wrapper">
      {/* ── Active tasks ── */}
      {showActive && (
        <section className="task-section">
          {filter === 'active' && hasActive === 0 ? (
            <div className="empty-state small">
              <p>All done! No active tasks.</p>
            </div>
          ) : (
            <>
              {filter === 'all' && (
                <h3 className="section-label">
                  Tasks
                  <span className="count-badge">{activeTasks.length}</span>
                </h3>
              )}
              <div className="task-cards">
                {sortedActive.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Completed tasks ── */}
      {showCompleted && hasCompleted && (
        <section className="task-section completed-section">
          <h3 className="section-label completed-label">
            Completed
            <span className="count-badge">{completedTasks.length}</span>
          </h3>
          <div className="task-cards">
            {sortedCompleted.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      )}

      {showCompleted && !hasCompleted && filter === 'completed' && (
        <div className="empty-state small">
          <p>No completed tasks yet.</p>
        </div>
      )}
    </div>
  );
}
