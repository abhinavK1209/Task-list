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

  // Projects tab: active tasks that have a project, grouped by project
  const tasksByProject = projects
    .map(proj => ({
      project: proj,
      tasks: sortByPriority(active.filter(t => t.projectId === proj.id), ...args),
    }))
    .filter(g => g.tasks.length > 0);
  const unassigned = sortByPriority(active.filter(t => !t.projectId), ...args);

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
    if (tasksByProject.length === 0 && unassigned.length === 0) {
      return <div className="empty-state small"><p>No tasks with projects assigned.</p></div>;
    }
    return (
      <div className="task-list-wrapper">
        {tasksByProject.map(({ project, tasks: ptasks }) => (
          <section key={project.id} className="task-section">
            <h3 className="section-label project-section-label" style={{ borderLeftColor: project.color }}>
              <span className="project-dot" style={{ background: project.color }} />
              {project.name}
              <span className="count-badge">{ptasks.length}</span>
              <span className="project-boost-badge">+{project.score} pts boost</span>
            </h3>
            <div className="task-cards">
              {ptasks.map(task => <TaskItem key={task.id} task={task} {...itemProps} />)}
            </div>
          </section>
        ))}
        {unassigned.length > 0 && (
          <section className="task-section">
            <h3 className="section-label">
              No Project
              <span className="count-badge">{unassigned.length}</span>
            </h3>
            <div className="task-cards">
              {unassigned.map(task => <TaskItem key={task.id} task={task} {...itemProps} />)}
            </div>
          </section>
        )}
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
