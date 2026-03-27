import { useState } from 'react';

/**
 * FactorManager — slide-in panel for creating/editing/deleting custom
 * priority factors. Each factor has a name and a list of options,
 * where each option has a label and a numeric score contribution.
 *
 * Props:
 *   factors     — array of factor objects
 *   onSave(factors) — called when factors change
 *   onClose()   — close the panel
 */

function emptyFactor() {
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: '',
    options: [
      { label: '', score: '' },
      { label: '', score: '' },
    ],
  };
}

// ── Score chart: horizontal bars proportional to score ───────────────────────
function ScoreChart({ options }) {
  const valid = options.filter(o => o.label && o.score !== '');
  if (valid.length === 0) return null;
  const max = Math.max(...valid.map(o => Number(o.score)));
  if (max === 0) return null;

  return (
    <div className="score-chart">
      <p className="chart-title">Score Preview</p>
      {valid.map((opt, i) => {
        const pct = Math.round((Number(opt.score) / max) * 100);
        return (
          <div key={i} className="chart-row">
            <span className="chart-label">{opt.label}</span>
            <div className="chart-track">
              <div className="chart-bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="chart-pts">{opt.score} pts</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Single factor editor ─────────────────────────────────────────────────────
function FactorEditor({ factor, onChange, onDelete }) {
  function setName(name) {
    onChange({ ...factor, name });
  }

  function setOption(i, key, val) {
    const options = factor.options.map((o, idx) =>
      idx === i ? { ...o, [key]: val } : o
    );
    onChange({ ...factor, options });
  }

  function addOption() {
    onChange({ ...factor, options: [...factor.options, { label: '', score: '' }] });
  }

  function removeOption(i) {
    if (factor.options.length <= 1) return;
    onChange({ ...factor, options: factor.options.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="factor-editor">
      <div className="factor-editor-header">
        <div className="field" style={{ flex: 1 }}>
          <label>Factor Name</label>
          <input
            type="text"
            placeholder='e.g. "Team Size" or "Subject Importance"'
            value={factor.name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button className="btn-icon btn-delete" onClick={onDelete} title="Delete factor">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>

      <p className="factor-hint">
        Define rating options and assign each a <strong>score</strong> — higher score = higher priority boost.
      </p>

      <div className="options-list">
        {factor.options.map((opt, i) => (
          <div key={i} className="option-row">
            <input
              type="text"
              placeholder="Label (e.g. High)"
              value={opt.label}
              onChange={e => setOption(i, 'label', e.target.value)}
              className="option-label-input"
            />
            <input
              type="number"
              placeholder="Score"
              min="0"
              max="100"
              value={opt.score}
              onChange={e => setOption(i, 'score', e.target.value)}
              className="option-score-input"
            />
            <span className="option-pts-label">pts</span>
            <button
              className="btn-icon"
              onClick={() => removeOption(i)}
              title="Remove option"
              disabled={factor.options.length <= 1}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost btn-sm" onClick={addOption}>+ Add Option</button>

      <ScoreChart options={factor.options} />
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────
export default function FactorManager({ factors, onSave, onClose }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(factors)));

  function addFactor() {
    setLocal(prev => [...prev, emptyFactor()]);
  }

  function updateFactor(id, updated) {
    setLocal(prev => prev.map(f => f.id === id ? updated : f));
  }

  function deleteFactor(id) {
    setLocal(prev => prev.filter(f => f.id !== id));
  }

  function handleSave() {
    // Filter out incomplete factors (no name or no valid options)
    const valid = local.filter(f =>
      f.name.trim() && f.options.some(o => o.label.trim() && o.score !== '')
    );
    onSave(valid);
    onClose();
  }

  return (
    <div className="factor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="factor-panel">
        <div className="factor-panel-header">
          <h2>Custom Priority Factors</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="factor-panel-desc">
          Create your own scoring factors. Each factor's score adds to a task's priority —
          the higher the total score, the higher the task ranks.
        </p>

        <div className="factor-list">
          {local.length === 0 && (
            <p className="empty-factors">No custom factors yet. Add one below.</p>
          )}
          {local.map(f => (
            <FactorEditor
              key={f.id}
              factor={f}
              onChange={updated => updateFactor(f.id, updated)}
              onDelete={() => deleteFactor(f.id)}
            />
          ))}
        </div>

        <button className="btn btn-ghost btn-add-factor" onClick={addFactor}>
          + New Factor
        </button>

        <div className="factor-panel-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Factors</button>
        </div>
      </div>
    </div>
  );
}
