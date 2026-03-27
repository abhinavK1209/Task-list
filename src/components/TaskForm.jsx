import { useState, useEffect } from 'react';

const DIFFICULTIES = ['', 'Easy', 'Medium', 'Hard'];

export default function TaskForm({ onSubmit, onCancel, editTask = null, customFactors = [] }) {
  const [form,     setForm]     = useState({ title: '', dueDate: '', description: '', difficulty: '', isProject: false, projectBoost: 20 });
  const [cfValues, setCfValues] = useState({});
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title:        editTask.title        || '',
        dueDate:      editTask.dueDate      || '',
        description:  editTask.description  || '',
        difficulty:   editTask.difficulty   || '',
        isProject:    editTask.isProject    || false,
        projectBoost: editTask.projectBoost ?? 20,
      });
      setCfValues(editTask.customFactors || {});
    } else {
      setForm({ title: '', dueDate: '', description: '', difficulty: '', isProject: false, projectBoost: 20 });
      setCfValues({});
    }
    setErrors({});
  }, [editTask]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function clearFactor(factorId) {
    setCfValues(prev => { const n = { ...prev }; delete n[factorId]; return n; });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.dueDate)      errs.dueDate = 'Due date is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      title:         form.title.trim(),
      dueDate:       form.dueDate,
      description:   form.description.trim(),
      difficulty:    form.difficulty,
      isProject:     form.isProject,
      projectBoost:  form.isProject ? Number(form.projectBoost) || 0 : 0,
      customFactors: cfValues,
    });
    if (!editTask) {
      setForm({ title: '', dueDate: '', description: '', difficulty: '', isProject: false, projectBoost: 20 });
      setCfValues({});
    }
  }

  const isEditing = !!editTask;

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>

      {/* Title */}
      <div className="field">
        <label htmlFor="title">Task Title *</label>
        <input id="title" name="title" type="text" autoFocus={!isEditing}
          placeholder="e.g. Midterm Exam – Biology"
          value={form.title} onChange={handleChange}
          className={errors.title ? 'input-error' : ''} />
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      {/* Due date */}
      <div className="field">
        <label htmlFor="dueDate">Due Date *</label>
        <input id="dueDate" name="dueDate" type="date"
          value={form.dueDate} onChange={handleChange}
          className={errors.dueDate ? 'input-error' : ''} />
        {errors.dueDate && <span className="error-msg">{errors.dueDate}</span>}
      </div>

      {/* Difficulty */}
      <div className="field">
        <label htmlFor="difficulty">Difficulty</label>
        <select id="difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d || '— Not specified —'}</option>)}
        </select>
      </div>

      {/* Project toggle */}
      <div className="field">
        <label>Project?</label>
        <div className="project-toggle-row">
          <label className={`toggle-option ${!form.isProject ? 'selected' : ''}`}>
            <input type="radio" name="isProject" checked={!form.isProject}
              onChange={() => setForm(p => ({ ...p, isProject: false }))} />
            No
          </label>
          <label className={`toggle-option ${form.isProject ? 'selected' : ''}`}>
            <input type="radio" name="isProject" checked={form.isProject}
              onChange={() => setForm(p => ({ ...p, isProject: true }))} />
            Yes
          </label>
          {form.isProject && (
            <div className="boost-input-row">
              <span className="boost-label">Priority boost:</span>
              <input type="number" min="0" max="200"
                value={form.projectBoost}
                onChange={e => setForm(p => ({ ...p, projectBoost: e.target.value }))}
                className="boost-input"
              />
              <span className="option-pts-label">pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Custom factors */}
      {customFactors.length > 0 && (
        <div className="custom-factors-section">
          <p className="custom-factors-label">Custom Factors</p>
          {customFactors.map(factor => {
            const validOpts = factor.options.filter(o => o.label && o.score !== '');
            if (!validOpts.length) return null;
            const hasValue = !!cfValues[factor.id];
            return (
              <div className="field" key={factor.id}>
                <label>{factor.name}</label>
                <div className="cf-field-row">
                  <select
                    value={cfValues[factor.id] || ''}
                    onChange={e => setCfValues(prev => ({ ...prev, [factor.id]: e.target.value }))}
                    style={{ flex: 1 }}
                  >
                    <option value="">— Not specified —</option>
                    {validOpts
                      .slice().sort((a, b) => Number(b.score) - Number(a.score))
                      .map(opt => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label} (+{opt.score} pts)
                        </option>
                      ))}
                  </select>
                  {/* Per-task factor clear button */}
                  {hasValue && (
                    <button type="button" className="btn-icon btn-clear-factor"
                      onClick={() => clearFactor(factor.id)} title={`Remove ${factor.name} from this task`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      <div className="field">
        <label htmlFor="description">Description <span className="optional">(optional)</span></label>
        <textarea id="description" name="description" rows={3}
          placeholder="Add notes, topics to study, etc."
          value={form.description} onChange={handleChange} />
      </div>

      <div className="form-actions">
        {isEditing && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Save Changes' : '+ Add Task'}
        </button>
      </div>
    </form>
  );
}
