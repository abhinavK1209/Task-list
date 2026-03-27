import { useState, useEffect, useCallback } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import FactorManager from './components/FactorManager';
import { daysUntil } from './utils/prioritization';
import './App.css';

const STORAGE_KEY  = 'taskflow_tasks';
const FACTORS_KEY  = 'taskflow_factors';

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return []; // blank for new users
}

function loadFactors() {
  try {
    const raw = localStorage.getItem(FACTORS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return [];
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'All',       color: 'tab-all' },
  { id: 'overdue',   label: 'Overdue',   color: 'tab-overdue' },
  { id: 'due-soon',  label: 'Due Soon',  color: 'tab-due-soon' },
  { id: 'upcoming',  label: 'Upcoming',  color: 'tab-upcoming' },
  { id: 'completed', label: 'Completed', color: 'tab-completed' },
];

export default function App() {
  const [tasks,         setTasks]         = useState(loadTasks);
  const [customFactors, setCustomFactors] = useState(loadFactors);
  const [filter,        setFilter]        = useState('all');
  const [editTask,      setEditTask]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [showFactors,   setShowFactors]   = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(FACTORS_KEY, JSON.stringify(customFactors)); }, [customFactors]);

  // Refresh priority scores every minute (due dates change daily)
  useEffect(() => {
    const t = setInterval(() => setTasks(p => [...p]), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleAddTask = useCallback((formData) => {
    setTasks(prev => [...prev, { id: generateId(), ...formData, completed: false, createdAt: Date.now() }]);
  }, []);

  const handleEditSubmit = useCallback((formData) => {
    setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...formData } : t));
    setEditTask(null);
    setShowForm(false);
  }, [editTask]);

  const handleComplete = useCallback((id) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t
    ));
  }, []);

  const handleDelete = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleEditOpen = useCallback((task) => {
    setEditTask(task); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const counts = {
    all:       active.length,
    overdue:   active.filter(t => daysUntil(t.dueDate) < 0).length,
    'due-soon':active.filter(t => { const d = daysUntil(t.dueDate); return d >= 0 && d <= 7; }).length,
    upcoming:  active.filter(t => daysUntil(t.dueDate) > 7).length,
    completed: completed.length,
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-top">
            <div className="logo">
              <span className="logo-icon">✓</span>
              <span className="logo-text">TaskFlow</span>
            </div>
            <button
              className="btn-settings"
              onClick={() => setShowFactors(true)}
              title="Manage custom priority factors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Customize Factors
            </button>
          </div>
          <p className="header-subtitle">Smart Priority Planner</p>
        </div>
      </header>

      <main className="app-main">
        {/* ── Stats bar ── */}
        <div className="stats-bar">
          {[
            { label: 'Overdue',   val: counts.overdue,    cls: 'stat-overdue' },
            { label: 'Due Soon',  val: counts['due-soon'], cls: 'stat-due-soon' },
            { label: 'Upcoming',  val: counts.upcoming,   cls: '' },
            { label: 'Done',      val: counts.completed,  cls: 'stat-done' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: 'contents' }}>
              <div className={`stat ${s.cls}`}>
                <span className="stat-number">{s.val}</span>
                <span className="stat-label">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="stat-divider" />}
            </div>
          ))}
        </div>

        {/* ── Add task / edit form ── */}
        {!showForm ? (
          <button className="btn btn-add-toggle" onClick={() => setShowForm(true)}>
            + Add New Task
          </button>
        ) : (
          <div className="form-panel">
            <TaskForm
              onSubmit={editTask ? handleEditSubmit : handleAddTask}
              onCancel={() => { setEditTask(null); setShowForm(false); }}
              editTask={editTask}
              customFactors={customFactors}
            />
            {!editTask && (
              <button className="btn btn-ghost form-close" onClick={() => setShowForm(false)}>
                ✕ Close
              </button>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="filter-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              className={`filter-tab ${tab.color} ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className="tab-count">{counts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Task list ── */}
        <TaskList
          tasks={tasks}
          filter={filter}
          customFactors={customFactors}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEditOpen}
        />
      </main>

      <footer className="app-footer">
        <p>Priorities update automatically · Data saved in your browser · No account needed</p>
      </footer>

      {/* ── Custom Factor Manager ── */}
      {showFactors && (
        <FactorManager
          factors={customFactors}
          onSave={setCustomFactors}
          onClose={() => setShowFactors(false)}
        />
      )}
    </div>
  );
}
