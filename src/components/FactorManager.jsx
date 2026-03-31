import { useState } from 'react';
import { DEFAULT_BUILTIN } from '../utils/prioritization';

/**
 * FactorManager — "Scoring Settings" slide-in panel.
 * Three sections:
 *   1. Summary table  — always visible, shows all factors + scores
 *   2. Built-in config — customise urgency brackets + difficulty scores
 *   3. Custom factors  — user-defined factors with arbitrary options
 */

// ── Helpers ──────────────────────────────────────────────────────────────────
function emptyFactor() {
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: '',
    options: [{ label: '', score: '' }, { label: '', score: '' }],
    isTab: false,
    tabColor: '#8b5cf6',
  };
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ score, max }) {
  const pct = max > 0 ? Math.round((Number(score) / max) * 100) : 0;
  return (
    <div className="mini-track">
      <div className="mini-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── 1. Summary table (always visible) ────────────────────────────────────────
function SummaryTable({ builtinConfig, customFactors, projects }) {
  const allSections = [
    {
      name: 'Due Date Urgency',
      rows: builtinConfig.urgency.map(b => ({ label: b.label, score: b.score })),
    },
    {
      name: 'Difficulty',
      rows: builtinConfig.difficulty.map(d => ({ label: d.label, score: d.score })),
    },
    ...customFactors
      .filter(f => f.name && f.options.some(o => o.label && o.score !== ''))
      .map(f => ({
        name: f.name,
        rows: f.options
          .filter(o => o.label && o.score !== '')
          .sort((a, b) => Number(b.score) - Number(a.score))
          .map(o => ({ label: o.label, score: o.score })),
      })),
    ...projects
      .filter(p => p.name)
      .map(p => ({
        name: 'Project Boost',
        rows: [{ label: p.name, score: p.score }],
      })),
  ];

  return (
    <div className="factor-summary">
      <p className="factor-summary-title">All Scoring Factors</p>
      <table className="factor-table">
        <thead>
          <tr>
            <th>Factor</th>
            <th>Option / Bracket</th>
            <th>Score</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {allSections.map(section => {
            const max = Math.max(...section.rows.map(r => Number(r.score)));
            return section.rows.map((row, i) => (
              <tr key={`${section.name}-${i}`}>
                {i === 0 && (
                  <td rowSpan={section.rows.length} className="factor-name-cell">
                    {section.name}
                  </td>
                )}
                <td>{row.label}</td>
                <td className="pts-cell">{row.score} pts</td>
                <td className="bar-cell">
                  <MiniBar score={row.score} max={max} />
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 2a. Urgency bracket editor ────────────────────────────────────────────────
function UrgencyEditor({ brackets, onChange }) {
  function setScore(i, val) {
    const updated = brackets.map((b, idx) => idx === i ? { ...b, score: val } : b);
    onChange(updated);
  }

  return (
    <div className="builtin-section">
      <p className="builtin-section-title">Due Date Urgency</p>
      <p className="factor-hint">
        Points added based on how soon the task is due.
        Higher score = higher priority. Overdue tasks always score highest.
      </p>
      <div className="builtin-table">
        {brackets.map((b, i) => (
          <div key={i} className="builtin-row">
            <span className="builtin-label">{b.label}</span>
            <input
              type="number" min="0" max="200"
              value={b.score}
              onChange={e => setScore(i, e.target.value)}
              className="builtin-score-input"
            />
            <span className="option-pts-label">pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2b. Difficulty option editor ──────────────────────────────────────────────
function DifficultyEditor({ options, onChange }) {
  function setScore(i, val) {
    const updated = options.map((o, idx) => idx === i ? { ...o, score: val } : o);
    onChange(updated);
  }

  return (
    <div className="builtin-section">
      <p className="builtin-section-title">Difficulty</p>
      <p className="factor-hint">Points added based on task difficulty rating.</p>
      <div className="builtin-table">
        {options.map((o, i) => (
          <div key={i} className="builtin-row">
            <span className="builtin-label">{o.label}</span>
            <input
              type="number" min="0" max="200"
              value={o.score}
              onChange={e => setScore(i, e.target.value)}
              className="builtin-score-input"
            />
            <span className="option-pts-label">pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. Custom factor editor ───────────────────────────────────────────────────
function ScorePreview({ options }) {
  const valid = options.filter(o => o.label && o.score !== '');
  if (valid.length === 0) return null;
  const max = Math.max(...valid.map(o => Number(o.score)));
  if (max === 0) return null;
  return (
    <div className="score-chart">
      <p className="chart-title">Score Preview</p>
      {valid.sort((a, b) => Number(b.score) - Number(a.score)).map((opt, i) => (
        <div key={i} className="chart-row">
          <span className="chart-label">{opt.label}</span>
          <div className="chart-track">
            <div className="chart-bar" style={{ width: `${Math.round((Number(opt.score) / max) * 100)}%` }} />
          </div>
          <span className="chart-pts">{opt.score} pts</span>
        </div>
      ))}
    </div>
  );
}

function FactorEditor({ factor, onChange, onDelete }) {
  function setOption(i, key, val) {
    onChange({ ...factor, options: factor.options.map((o, idx) => idx === i ? { ...o, [key]: val } : o) });
  }
  function addOption() {
    onChange({ ...factor, options: [...factor.options, { label: '', score: '' }] });
  }
  function removeOption(i) {
    if (factor.options.length <= 1) return;
    onChange({ ...factor, options: factor.options.filter((_, idx) => idx !== i) });
  }

  const isTab = factor.isTab ?? false;
  const tabColor = factor.tabColor ?? '#8b5cf6';

  return (
    <div className="factor-editor">
      <div className="factor-editor-header">
        <div className="field" style={{ flex: 1 }}>
          <label>Factor Name</label>
          <input type="text" placeholder='e.g. "Team Size"'
            value={factor.name} onChange={e => onChange({ ...factor, name: e.target.value })} />
        </div>
        <button className="btn-icon btn-delete" onClick={onDelete} title="Delete factor">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>

      {/* Tab toggle */}
      <div className="field">
        <label>Show as filter tab?</label>
        <div className="project-toggle-row">
          <label className={`toggle-option ${!isTab ? 'selected' : ''}`}>
            <input type="radio" name={`isTab-${factor.id}`} checked={!isTab}
              onChange={() => onChange({ ...factor, isTab: false })} />
            No
          </label>
          <label className={`toggle-option ${isTab ? 'selected' : ''}`}>
            <input type="radio" name={`isTab-${factor.id}`} checked={isTab}
              onChange={() => onChange({ ...factor, isTab: true })} />
            Yes
          </label>
          {isTab && (
            <div className="boost-input-row">
              <span className="boost-label">Tab color:</span>
              <div className="tab-color-wrapper" style={{ background: tabColor }}>
                <input type="color" value={tabColor}
                  onChange={e => onChange({ ...factor, tabColor: e.target.value })}
                  className="tab-color-input" />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="factor-hint">Each option adds its score to a task's priority when selected.</p>
      <div className="options-list">
        {factor.options.map((opt, i) => (
          <div key={i} className="option-row">
            <input type="text" placeholder="Label" value={opt.label}
              onChange={e => setOption(i, 'label', e.target.value)} className="option-label-input" />
            <input type="number" placeholder="Score" min="0" max="200" value={opt.score}
              onChange={e => {
                const clamped = e.target.value === '' ? '' : String(Math.min(200, Math.max(0, Number(e.target.value) || 0)));
                setOption(i, 'score', clamped);
              }} className="option-score-input" />
            <span className="option-pts-label">pts</span>
            <button className="btn-icon" onClick={() => removeOption(i)} disabled={factor.options.length <= 1}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={addOption}>+ Add Option</button>
      <ScorePreview options={factor.options} />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function FactorManager({ factors, builtinConfig, projects, onSave, onClose }) {
  const [localFactors,  setLocalFactors]  = useState(() => JSON.parse(JSON.stringify(factors)));
  const [localBuiltin,  setLocalBuiltin]  = useState(() => JSON.parse(JSON.stringify(builtinConfig)));
  const [activeSection, setActiveSection] = useState('summary');

  function handleSave() {
    const validFactors = localFactors.filter(f =>
      f.name.trim() && f.options.some(o => o.label.trim() && o.score !== '')
    );
    onSave({ factors: validFactors, builtinConfig: localBuiltin });
    onClose();
  }

  const SECTIONS = [
    { id: 'summary',    label: 'Summary' },
    { id: 'urgency',    label: 'Due Date' },
    { id: 'difficulty', label: 'Difficulty' },
    { id: 'custom',     label: 'Custom' },
  ];

  return (
    <div className="factor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="factor-panel">
        {/* Header */}
        <div className="factor-panel-header">
          <h2>Scoring Settings</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="panel-section-tabs">
          {SECTIONS.map(s => (
            <button key={s.id}
              className={`panel-section-tab ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="factor-list">
          {activeSection === 'summary' && (
            <SummaryTable
              builtinConfig={localBuiltin}
              customFactors={localFactors}
              projects={projects}
            />
          )}

          {activeSection === 'urgency' && (
            <UrgencyEditor
              brackets={localBuiltin.urgency}
              onChange={u => setLocalBuiltin(b => ({ ...b, urgency: u }))}
            />
          )}

          {activeSection === 'difficulty' && (
            <DifficultyEditor
              options={localBuiltin.difficulty}
              onChange={d => setLocalBuiltin(b => ({ ...b, difficulty: d }))}
            />
          )}

          {activeSection === 'custom' && (
            <>
              {localFactors.length === 0 && (
                <p className="empty-factors">No custom factors yet.</p>
              )}
              {localFactors.map(f => (
                <FactorEditor key={f.id} factor={f}
                  onChange={upd => setLocalFactors(prev => prev.map(x => x.id === f.id ? upd : x))}
                  onDelete={() => setLocalFactors(prev => prev.filter(x => x.id !== f.id))}
                />
              ))}
              <button className="btn btn-ghost btn-add-factor"
                onClick={() => setLocalFactors(p => [...p, emptyFactor()])}>
                + New Factor
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="factor-panel-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
