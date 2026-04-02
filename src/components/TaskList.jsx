import { useState } from 'react';
import TaskItem from './TaskItem';
import { sortByPriority, daysUntil } from '../utils/prioritization';

export default function TaskList({
  tasks, filter, customFactors, builtinConfig,
  onComplete, onDelete, onEdit, onUnpin, onReorder, onResetOrder,
}) {
  const [dragId,    setDragId]    = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragAbove,  setDragAbove]  = useState(true);

  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const args      = [customFactors, [], builtinConfig];

  const hasManualOrder = active.some(t => t.manualOrder !== undefined);

  // ── Get filtered active tasks for current tab ──────────────────────────────
  function getFiltered() {
    if (filter === 'projects')  return active.filter(t => t.isProject);
    if (filter === 'overdue')   return active.filter(t => daysUntil(t.dueDate, t.dueTime) < 0);
    if (filter === 'due-soon')  return active.filter(t => { const d = daysUntil(t.dueDate, t.dueTime); return d >= 0 && d <= 7; });
    if (filter === 'upcoming')  return active.filter(t => daysUntil(t.dueDate, t.dueTime) > 7);
    if (filter === 'completed') return [...completed].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const cfMatch = filter.match(/^cf-(.+)/);
    if (cfMatch) return active.filter(t => t.customFactors?.[cfMatch[1]]);
    return active; // 'all'
  }

  const filtered = getFiltered();
  const isCompletedTab = filter === 'completed';

  // ── Build display list (pinned first, then auto-sorted) ────────────────────
  let list;
  if (isCompletedTab) {
    list = filtered;
  } else {
    const pinned = filtered.filter(t => t.manualOrder !== undefined)
      .sort((a, b) => a.manualOrder - b.manualOrder);
    const auto   = sortByPriority(filtered.filter(t => t.manualOrder === undefined), ...args);
    list = [...pinned, ...auto];
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function handleDragStart(e, task) {
    setDragId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }

  function handleDragOver(e, task) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (task.id !== dragId) {
      setDragOverId(task.id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragAbove(e.clientY < rect.top + rect.height / 2);
    }
  }

  function handleDrop(e, task) {
    e.preventDefault();
    if (dragId && task.id !== dragId) onReorder(dragId, task.id, dragAbove, list);
    setDragId(null); setDragOverId(null);
  }

  function handleDragEnd() { setDragId(null); setDragOverId(null); }

  // ── Empty states ───────────────────────────────────────────────────────────
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
      projects:  { icon: '📁', text: 'No project tasks yet.', hint: 'Set "Project?" to Yes when adding a task.' },
      overdue:   { text: 'No overdue tasks.' },
      'due-soon':{ text: 'Nothing due in the next 7 days.' },
      upcoming:  { text: 'No upcoming tasks beyond 7 days.' },
      completed: { text: 'No completed tasks yet.' },
      all:       { text: 'No active tasks.' },
    };
    const cfMatch = filter.match(/^cf-(.+)/);
    const factorName = cfMatch ? customFactors.find(f => f.id === cfMatch[1])?.name : null;
    const m = msgs[filter] || { text: `No tasks with "${factorName || 'this factor'}" set.` };
    return (
      <div className={`empty-state ${m.icon ? '' : 'small'}`}>
        {m.icon && <span className="empty-icon">{m.icon}</span>}
        <p>{m.text}</p>
        {m.hint && <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>{m.hint}</p>}
      </div>
    );
  }

  // ── Item props ─────────────────────────────────────────────────────────────
  const itemProps = { customFactors, builtinConfig, onComplete, onDelete, onEdit, onUnpin };

  return (
    <div>
      {hasManualOrder && !isCompletedTab && (
        <div className="manual-order-bar">
          <span>Custom order active</span>
          <button className="btn btn-ghost btn-sm" onClick={onResetOrder}>↺ Auto-sort</button>
        </div>
      )}
      <div className="task-cards">
        {list.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            {...itemProps}
            isDragging={dragId === task.id}
            isDragOver={dragOverId === task.id}
            dragAbove={dragAbove}
            dragProps={isCompletedTab ? {} : {
              draggable: true,
              onDragStart: e => handleDragStart(e, task),
              onDragOver:  e => handleDragOver(e, task),
              onDrop:      e => handleDrop(e, task),
              onDragEnd:   handleDragEnd,
            }}
          />
        ))}
      </div>
    </div>
  );
}
