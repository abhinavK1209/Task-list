import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged, signOut,
} from 'firebase/auth';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs,
} from 'firebase/firestore';
import TaskForm      from './components/TaskForm';
import TaskList      from './components/TaskList';
import FactorManager from './components/FactorManager';
import AuthModal     from './components/AuthModal';
import { daysUntil, DEFAULT_BUILTIN } from './utils/prioritization';
import { auth, db, FIREBASE_CONFIGURED } from './firebase';
import './App.css';

// ── Storage keys (localStorage fallback) ────────────────────────────────────
const STORAGE_KEY  = 'taskflow_tasks';
const FACTORS_KEY  = 'taskflow_factors';
const BUILTIN_KEY  = 'taskflow_builtin';

function localLoad(key, fallback) {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return fallback;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'All',       cls: 'tab-all' },
  { id: 'overdue',   label: 'Overdue',   cls: 'tab-overdue' },
  { id: 'due-soon',  label: 'Due Soon',  cls: 'tab-due-soon' },
  { id: 'upcoming',  label: 'Upcoming',  cls: 'tab-upcoming' },
  { id: 'projects',  label: 'Projects',  cls: 'tab-projects' },
  { id: 'completed', label: 'Completed', cls: 'tab-completed' },
];

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user,        setUser]        = useState(null);
  const [authReady,   setAuthReady]   = useState(!FIREBASE_CONFIGURED);
  const [showAuth,    setShowAuth]    = useState(false);
  const [syncing,     setSyncing]     = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [tasks,         setTasks]         = useState(() => localLoad(STORAGE_KEY,  []));
  const [customFactors, setCustomFactors] = useState(() => localLoad(FACTORS_KEY,  []));
  const [builtinConfig, setBuiltinConfig] = useState(() => localLoad(BUILTIN_KEY,  DEFAULT_BUILTIN));
  const [filter,        setFilter]        = useState('all');
  const [editTask,      setEditTask]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [showFactors,   setShowFactors]   = useState(false);

  // ── Firebase auth listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // ── Firestore task sync (real-time) ───────────────────────────────────────
  useEffect(() => {
    if (!user || !db) return;

    setSyncing(true);

    // Subscribe to tasks
    const taskUnsub = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      snap => {
        const firestoreTasks = snap.docs.map(d => d.data());
        setTasks(firestoreTasks);
        setSyncing(false);
      },
      () => setSyncing(false)
    );

    // Subscribe to settings
    const settingsUnsub = onSnapshot(
      doc(db, 'users', user.uid, 'settings', 'main'),
      snap => {
        if (snap.exists()) {
          const { customFactors: cf, builtinConfig: bc } = snap.data();
          if (cf) setCustomFactors(cf);
          if (bc) setBuiltinConfig(bc);
        }
      }
    );

    // On first sign-in: migrate localStorage tasks to Firestore if Firestore is empty
    getDocs(collection(db, 'users', user.uid, 'tasks')).then(snap => {
      if (snap.empty) {
        const localTasks = localLoad(STORAGE_KEY, []);
        if (localTasks.length > 0) {
          const batch = writeBatch(db);
          localTasks.forEach(t => {
            batch.set(doc(db, 'users', user.uid, 'tasks', t.id), t);
          });
          batch.commit();
        }
      }
    });

    return () => { taskUnsub(); settingsUnsub(); };
  }, [user?.uid]);

  // ── localStorage sync (when logged out) ───────────────────────────────────
  useEffect(() => {
    if (user) return; // Firestore handles it
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, user]);

  useEffect(() => {
    localStorage.setItem(FACTORS_KEY, JSON.stringify(customFactors));
    if (user && db) {
      // Also sync settings to Firestore
      setDoc(doc(db, 'users', user.uid, 'settings', 'main'), { customFactors, builtinConfig }, { merge: true });
    }
  }, [customFactors, user?.uid]);

  useEffect(() => {
    localStorage.setItem(BUILTIN_KEY, JSON.stringify(builtinConfig));
    if (user && db) {
      setDoc(doc(db, 'users', user.uid, 'settings', 'main'), { customFactors, builtinConfig }, { merge: true });
    }
  }, [builtinConfig, user?.uid]);

  // Refresh priority scores every minute
  useEffect(() => {
    const t = setInterval(() => setTasks(p => [...p]), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function firestoreSet(task) {
    if (user && db) await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task);
    else setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
  }

  async function firestoreDelete(id) {
    if (user && db) await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
    else setTasks(prev => prev.filter(t => t.id !== id));
  }

  const handleAddTask = useCallback((formData) => {
    const newTask = { id: generateId(), ...formData, completed: false, createdAt: Date.now() };
    firestoreSet(newTask);
  }, [user?.uid]);

  const handleEditSubmit = useCallback((formData) => {
    firestoreSet({ ...editTask, ...formData });
    setEditTask(null); setShowForm(false);
  }, [editTask, user?.uid]);

  const handleComplete = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    firestoreSet({ ...task, completed: !task.completed, completedAt: !task.completed ? Date.now() : undefined });
  }, [tasks, user?.uid]);

  const handleDelete = useCallback((id) => firestoreDelete(id), [user?.uid]);

  const handleEditOpen = useCallback((task) => {
    setEditTask(task); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  function handleSaveFactors({ factors, builtinConfig: bc }) {
    setCustomFactors(factors);
    setBuiltinConfig(bc);
  }

  // ── Tab counts ────────────────────────────────────────────────────────────
  const active = tasks.filter(t => !t.completed);
  const counts = {
    all:        active.length,
    overdue:    active.filter(t => daysUntil(t.dueDate) < 0).length,
    'due-soon': active.filter(t => { const d = daysUntil(t.dueDate); return d >= 0 && d <= 7; }).length,
    upcoming:   active.filter(t => daysUntil(t.dueDate) > 7).length,
    projects:   active.filter(t => t.isProject).length,
    completed:  tasks.filter(t => t.completed).length,
  };

  if (!authReady) {
    return <div className="app-loading"><span className="logo-icon">✓</span></div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-top">
            <div className="logo">
              <span className="logo-icon">✓</span>
              <span className="logo-text">TaskFlow</span>
            </div>
            <div className="header-actions">
              {FIREBASE_CONFIGURED && (
                user ? (
                  <div className="user-info">
                    {syncing && <span className="sync-dot" title="Syncing…" />}
                    <span className="user-email" title={user.email}>
                      {user.email.split('@')[0]}
                    </span>
                    <button className="btn-settings" onClick={() => signOut(auth)}>Sign Out</button>
                  </div>
                ) : (
                  <button className="btn-settings btn-sync-cta" onClick={() => setShowAuth(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Sign in to sync
                  </button>
                )
              )}
              <button className="btn-settings" onClick={() => setShowFactors(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Scoring
              </button>
            </div>
          </div>
          <p className="header-subtitle">
            Smart Priority Planner
            {user && <span className="sync-status"> · {syncing ? 'Syncing…' : 'Synced'}</span>}
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="stats-bar">
          {[
            { label: 'Overdue',  val: counts.overdue,    cls: 'stat-overdue' },
            { label: 'Due Soon', val: counts['due-soon'], cls: 'stat-due-soon' },
            { label: 'Upcoming', val: counts.upcoming,   cls: '' },
            { label: 'Done',     val: counts.completed,  cls: 'stat-done' },
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

        {!showForm ? (
          <button className="btn btn-add-toggle" onClick={() => setShowForm(true)}>+ Add New Task</button>
        ) : (
          <div className="form-panel">
            <TaskForm
              onSubmit={editTask ? handleEditSubmit : handleAddTask}
              onCancel={() => { setEditTask(null); setShowForm(false); }}
              editTask={editTask}
              customFactors={customFactors}
            />
            {!editTask && (
              <button className="btn btn-ghost form-close" onClick={() => setShowForm(false)}>✕ Close</button>
            )}
          </div>
        )}

        <div className="filter-tabs" role="tablist">
          {TABS.map(tab => (
            <button key={tab.id} role="tab" aria-selected={filter === tab.id}
              className={`filter-tab ${tab.cls} ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}>
              {tab.label}
              {counts[tab.id] > 0 && <span className="tab-count">{counts[tab.id]}</span>}
            </button>
          ))}
        </div>

        <TaskList
          tasks={tasks}
          filter={filter}
          customFactors={customFactors}
          projects={[]}
          builtinConfig={builtinConfig}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEditOpen}
        />
      </main>

      <footer className="app-footer">
        <p>
          {user
            ? `Signed in as ${user.email} · Synced across all your devices`
            : 'Data saved locally · Sign in to sync across devices'}
        </p>
      </footer>

      {showFactors && (
        <FactorManager
          factors={customFactors}
          builtinConfig={builtinConfig}
          projects={[]}
          onSave={handleSaveFactors}
          onClose={() => setShowFactors(false)}
        />
      )}

      {showAuth && FIREBASE_CONFIGURED && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}
