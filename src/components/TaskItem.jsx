import { computePriorityScore, priorityLabel, formatDueDate } from '../utils/prioritization';

/**
 * TaskItem — renders a single task card.
 * Props:
 *   task        — task object
 *   onComplete  — toggle completion
 *   onDelete    — permanently delete
 *   onEdit      — open edit form for this task
 */
export default function TaskItem({ task, onComplete, onDelete, onEdit }) {
  const score = computePriorityScore(task);
  const label = priorityLabel(score);
  const dueDateText = formatDueDate(task.dueDate);
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div className={`task-item ${task.completed ? 'task-completed' : ''} priority-${label.toLowerCase()}`}>
      {/* Left: checkbox */}
      <button
        className={`checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onComplete(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Center: task details */}
      <div className="task-content">
        <span className="task-title">{task.title}</span>

        {task.description && (
          <span className="task-description">{task.description}</span>
        )}

        <div className="task-meta">
          {/* Due date */}
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dueDateText}
          </span>

          {/* Difficulty badge */}
          {task.difficulty && (
            <span className={`badge difficulty-${task.difficulty.toLowerCase()}`}>
              {task.difficulty}
            </span>
          )}

          {/* Priority badge (hidden for completed tasks) */}
          {!task.completed && (
            <span className={`badge priority-badge priority-${label.toLowerCase()}`}>
              {label} Priority
            </span>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="task-actions">
        {!task.completed && (
          <button
            className="btn-icon"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label="Edit task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}

        {task.completed && (
          <button
            className="btn-icon btn-delete"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label="Delete task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
