import { computePriorityScore, priorityLabel, formatDueDate, daysUntil } from '../utils/prioritization';

export default function TaskItem({ task, customFactors = [], projects = [], builtinConfig, onComplete, onDelete, onEdit }) {
  const score = computePriorityScore(task, customFactors, [], builtinConfig);
  const label = priorityLabel(score);
  const dueDateText = formatDueDate(task.dueDate);
  const isOverdue = !task.completed && daysUntil(task.dueDate) < 0;

  return (
    <div className={`task-item ${task.completed ? 'task-completed' : ''} priority-${label.toLowerCase()}`}>
      {/* Project stripe */}
      {task.isProject && !task.completed && (
        <div className="project-stripe" title={`Project (+${task.projectBoost || 0} pts)`} />
      )}

      {/* Checkbox */}
      <button className={`checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onComplete(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>
        {task.completed && (
          <svg viewBox="0 0 14 14" fill="none">
            <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="task-content">
        {task.link ? (
          <a className="task-title task-title-link" href={task.link} target="_blank" rel="noopener noreferrer">
            {task.title}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: 4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ) : (
          <span className="task-title">{task.title}</span>
        )}
        {task.description && <span className="task-description">{task.description}</span>}

        <div className="task-meta">
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dueDateText}
          </span>

          {task.difficulty && (
            <span className={`badge difficulty-${task.difficulty.toLowerCase()}`}>{task.difficulty}</span>
          )}

          {/* Project badge */}
          {task.isProject && (
            <span className="badge badge-project">
              Project +{task.projectBoost || 0}pts
            </span>
          )}

          {/* Custom factor badges */}
          {customFactors.map(factor => {
            const val = task.customFactors?.[factor.id];
            if (!val) return null;
            return <span key={factor.id} className="badge badge-custom" title={factor.name}>{factor.name}: {val}</span>;
          })}

          {!task.completed && (
            <span className={`badge priority-badge priority-${label.toLowerCase()}`}>{label} Priority</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions">
        {!task.completed && (
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
        {task.completed && (
          <button className="btn-icon btn-delete" onClick={() => onDelete(task.id)} title="Delete">
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
