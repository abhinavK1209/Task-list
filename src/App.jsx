import { useState, useEffect, useCallback } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { INITIAL_TASKS } from './utils/initialTasks';
import './App.css';

const STORAGE_KEY = 'taskflow_tasks';

// ── Unique ID generator ──────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Load / save to localStorage ─────────────────────────────────────────────
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt data — fall through to initial tasks
  }
  return INITIAL_TASKS;
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export default function App() {
  const [tasks, setTasks]       = useState(loadTasks);
  const [filter, setFilter]     = useState('all');
  const [editTask, setEditTask] = useState(null);  // null = create mode
  const [showForm, setShowForm] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Re-compute priorities periodically so urgency scores stay fresh
  // (triggers a re-render every minute without touching task data)
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks(prev => [...prev]); // shallow copy triggers re-render
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleAddTask = useCallback((formData) => {
    const newTask = {
      id: generateId(),
      ...formData,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const handleEditSubmit = useCallback((formData) => {
    setTasks(prev =>
      prev.map(t => t.id === editTask.id ? { ...t, ...formData } : t)
    );
    setEditTask(null);
    setShowForm(false);
  }, [editTask]);

  const handleComplete = useCallback((id) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
          : t
      )
    );
  }, []);

  const handleDelete = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleEditOpen = useCallback((task) => {
    setEditTask(task);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditTask(null);
    setShowForm(false);
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const activeCount    = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✓</span>
            <span className="logo-text">TaskFlow</span>
          </div>
          <p className="header-subtitle">Smart Priority Planner</p>
        </div>
      </header>

      <main className="app-main">
        {/* ── Stats bar ── */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">{activeCount}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* ── Add task toggle / form ── */}
        {!showForm ? (
          <button className="btn btn-add-toggle" onClick={() => setShowForm(true)}>
            + Add New Task
          </button>
        ) : (
          <div className="form-panel">
            <TaskForm
              onSubmit={editTask ? handleEditSubmit : handleAddTask}
              onCancel={handleCancelEdit}
              editTask={editTask}
            />
            {!editTask && (
              <button className="btn btn-ghost form-close" onClick={() => setShowForm(false)}>
                ✕ Close
              </button>
            )}
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="filter-tabs" role="tablist">
          {FILTERS.map(f => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === 'active'    && activeCount    > 0 && <span className="tab-count">{activeCount}</span>}
              {f.id === 'completed' && completedCount > 0 && <span className="tab-count">{completedCount}</span>}
            </button>
          ))}
        </div>

        {/* ── Task list ── */}
        <TaskList
          tasks={tasks}
          filter={filter}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEditOpen}
        />
      </main>

      <footer className="app-footer">
        <p>Priorities update automatically · No account needed · Data saved locally</p>
      </footer>
    </div>
  );
}
