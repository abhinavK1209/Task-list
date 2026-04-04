import { useState, useEffect, useCallback, useRef } from 'react';
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
import ProfileModal  from './components/ProfileModal';
import IcsImport     from './components/IcsImport';
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

// ── Static tabs ───────────────────────────────────────────────────────────────
const STATIC_TABS = [
  { id: 'all',       label: 'All',       cls: 'tab-all' },
  { id: 'overdue',   label: 'Overdue',   cls: 'tab-overdue' },
  { id: 'due-soon',  label: 'Due Soon',  cls: 'tab-due-soon' },
  { id: 'upcoming',  label: 'Upcoming',  cls: 'tab-upcoming' },
  { id: 'projects',  label: 'Projects',  cls: 'tab-projects' },
];

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user,        setUser]        = useState(null);
  const [authReady,   setAuthReady]   = useState(!FIREBASE_CONFIGURED);
  const [showAuth,    setShowAuth]    = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showIcs,     setShowIcs]     = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', avatarColor: '#3b82f6', photoURL: '' });

  // ── Data ──────────────────────────────────────────────────────────────────
  const [tasks,         setTasks]         = useState(() => localLoad(STORAGE_KEY,  []));
  const [customFactors, setCustomFactors] = useState(() => localLoad(FACTORS_KEY,  []));
  const [builtinConfig, setBuiltinConfig] = useState(() => localLoad(BUILTIN_KEY,  DEFAULT_BUILTIN));
  const [filter,        setFilter]        = useState('all');
  const [editTask,      setEditTask]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [showFactors,   setShowFactors]   = useState(false);
  const tabsRef = useRef(null);

  // ── Scroll wheel → horizontal scroll on tabs ──────────────────────────────
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

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

    // Load profile
    const profileUnsub = onSnapshot(
      doc(db, 'users', user.uid, 'settings', 'profile'),
      snap => {
        if (snap.exists()) {
          const { displayName, avatarColor, photoURL } = snap.data();
          setProfileData(p => ({
            displayName: displayName ?? p.displayName,
            avatarColor: avatarColor ?? p.avatarColor,
            photoURL:    photoURL    ?? p.photoURL,
          }));
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

    return () => { taskUnsub(); settingsUnsub(); profileUnsub(); };
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

  // Refresh every second when timed tasks exist (for countdown), else every minute
  const hasTimedTasks = tasks.some(t => t.dueTime && !t.completed);
  useEffect(() => {
    const ms = hasTimedTasks ? 1_000 : 60_000;
    const t = setInterval(() => setTasks(p => [...p]), ms);
    return () => clearInterval(t);
  }, [hasTimedTasks]);

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
    setShowForm(false);
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

  // ── Manual ordering ───────────────────────────────────────────────────────
  function handleReorder(draggedId, targetId, insertBefore, displayList) {
    const without = displayList.filter(t => t.id !== draggedId);
    const targetIdx = without.findIndex(t => t.id === targetId);
    const insertIdx = insertBefore ? targetIdx : targetIdx + 1;
    without.splice(insertIdx, 0, displayList.find(t => t.id === draggedId));
    // Assign manualOrder to every task now in displayList
    without.forEach((t, i) => {
      const updated = { ...t, manualOrder: i * 10 };
      firestoreSet(updated);
    });
  }

  function handleUnpin(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const { manualOrder, ...rest } = task;
    firestoreSet(rest);
  }

  function handleResetOrder() {
    tasks.filter(t => t.manualOrder !== undefined).forEach(t => {
      const { manualOrder, ...rest } = t;
      firestoreSet(rest);
    });
  }

  function handleSaveFactors({ factors, builtinConfig: bc }) {
    setCustomFactors(factors);
    setBuiltinConfig(bc);
  }

  const handleImportTasks = useCallback((importedTasks) => {
    importedTasks.forEach(taskData => {
      const newTask = { id: generateId(), ...taskData, completed: false, createdAt: Date.now() };
      firestoreSet(newTask);
    });
  }, [user?.uid]);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const active = tasks.filter(t => !t.completed);
  const cfCounts = {};
  customFactors.filter(f => f.isTab && f.name).forEach(f => {
    cfCounts[`cf-${f.id}`] = active.filter(t => t.customFactors?.[f.id]).length;
  });
  const counts = {
    all:        active.length,
    overdue:    active.filter(t => daysUntil(t.dueDate, t.dueTime) < 0).length,
    'due-soon': active.filter(t => { const d = daysUntil(t.dueDate, t.dueTime); return d >= 0 && d <= 7; }).length,
    upcoming:   active.filter(t => daysUntil(t.dueDate, t.dueTime) > 7).length,
    projects:   active.filter(t => t.isProject).length,
    completed:  tasks.filter(t => t.completed).length,
    ...cfCounts,
  };

  // ── Dynamic tabs (custom factor tabs inserted before Completed) ───────────
  const customTabs = customFactors
    .filter(f => f.isTab && f.name)
    .map(f => ({ id: `cf-${f.id}`, label: f.name, cls: 'tab-custom', color: f.tabColor || '#8b5cf6' }));
  const ALL_TABS = [
    ...STATIC_TABS,
    ...customTabs,
    { id: 'completed', label: 'Completed', cls: 'tab-completed' },
  ];

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
                    <button
                      className="avatar-btn"
                      style={profileData.photoURL ? {} : { background: profileData.avatarColor }}
                      onClick={() => setShowProfile(true)}
                      title="Edit profile"
                    >
                      {profileData.photoURL
                        ? <img src={profileData.photoURL} alt="avatar" className="avatar-btn-img" />
                        : (profileData.displayName || user.email).charAt(0).toUpperCase()
                      }
                    </button>
                    <span className="user-email" title={user.email}>
                      {profileData.displayName || user.email.split('@')[0]}
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
              <button className="btn-settings" onClick={() => setShowIcs(true)} title="Import .ics calendar file">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Import
              </button>
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

        <div className="filter-tabs" role="tablist" ref={tabsRef}>
          {ALL_TABS.map(tab => {
            const isActive = filter === tab.id;
            const isCustom = tab.cls === 'tab-custom';
            const style = isCustom
              ? isActive
                ? { background: tab.color, borderColor: tab.color, color: '#fff' }
                : { '--custom-tab-color': tab.color }
              : {};
            return (
              <button key={tab.id} role="tab" aria-selected={isActive}
                className={`filter-tab ${tab.cls} ${isActive ? 'active' : ''}`}
                style={style}
                onClick={() => setFilter(tab.id)}>
                {tab.label}
                {counts[tab.id] > 0 && <span className="tab-count">{counts[tab.id]}</span>}
              </button>
            );
          })}
        </div>

        <TaskList
          tasks={tasks}
          filter={filter}
          customFactors={customFactors}
          builtinConfig={builtinConfig}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEditOpen}
          onUnpin={handleUnpin}
          onReorder={handleReorder}
          onResetOrder={handleResetOrder}
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

      {showProfile && user && FIREBASE_CONFIGURED && (
        <ProfileModal
          user={user}
          profileData={profileData}
          onClose={() => setShowProfile(false)}
          onSaved={data => setProfileData(data)}
        />
      )}

      {showIcs && (
        <IcsImport
          onImport={handleImportTasks}
          onClose={() => setShowIcs(false)}
        />
      )}
    </div>
  );
}
