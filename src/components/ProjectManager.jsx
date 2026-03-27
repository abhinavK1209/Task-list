import { useState } from 'react';

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#06b6d4', '#f97316',
];

function emptyProject() {
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: '',
    color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    score: 20,
  };
}

export default function ProjectManager({ projects, onSave, onClose }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(projects)));

  function update(id, key, val) {
    setLocal(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p));
  }

  function handleSave() {
    onSave(local.filter(p => p.name.trim()));
    onClose();
  }

  return (
    <div className="factor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="factor-panel">
        <div className="factor-panel-header">
          <h2>Manage Projects</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="factor-panel-desc">
          Projects group related tasks and add a priority boost to all tasks within them.
        </p>

        <div className="factor-list">
          {local.length === 0 && <p className="empty-factors">No projects yet. Add one below.</p>}
          {local.map(proj => (
            <div key={proj.id} className="factor-editor">
              <div className="project-editor-row">
                {/* Color picker */}
                <div className="color-picker">
                  {PROJECT_COLORS.map(c => (
                    <button key={c}
                      className={`color-dot ${proj.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => update(proj.id, 'color', c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="project-fields">
                <div className="field" style={{ flex: 1 }}>
                  <label>Project Name</label>
                  <input type="text" placeholder="e.g. Science Fair"
                    value={proj.name} onChange={e => update(proj.id, 'name', e.target.value)} />
                </div>
                <div className="field" style={{ width: 90 }}>
                  <label>Priority Boost</label>
                  <div className="score-input-row">
                    <input type="number" min="0" max="100"
                      value={proj.score} onChange={e => update(proj.id, 'score', e.target.value)}
                      className="builtin-score-input" />
                    <span className="option-pts-label">pts</span>
                  </div>
                </div>
                <button className="btn-icon btn-delete proj-delete"
                  onClick={() => setLocal(p => p.filter(x => x.id !== proj.id))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-add-factor"
            onClick={() => setLocal(p => [...p, emptyProject()])}>
            + New Project
          </button>
        </div>

        <div className="factor-panel-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Projects</button>
        </div>
      </div>
    </div>
  );
}
