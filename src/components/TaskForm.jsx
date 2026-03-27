import { useState, useEffect } from 'react';

const DIFFICULTIES = ['', 'Easy', 'Medium', 'Hard'];

/**
 * TaskForm — create or edit a task.
 * Props:
 *   onSubmit(taskData)  — called with form values
 *   onCancel()          — called when user cancels (edit mode)
 *   editTask            — pre-fills form when editing; null = create mode
 *   customFactors       — array of user-defined priority factors
 */
export default function TaskForm({ onSubmit, onCancel, editTask = null, customFactors = [] }) {
  const [form, setForm]   = useState({ title: '', dueDate: '', description: '', difficulty: '' });
  const [cfValues, setCfValues] = useState({});  // custom factor selections
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title:       editTask.title       || '',
        dueDate:     editTask.dueDate     || '',
        description: editTask.description || '',
        difficulty:  editTask.difficulty  || '',
      });
      setCfValues(editTask.customFactors || {});
    } else {
      setForm({ title: '', dueDate: '', description: '', difficulty: '' });
      setCfValues({});
    }
    setErrors({});
  }, [editTask]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function handleCfChange(factorId, value) {
    setCfValues(prev => ({ ...prev, [factorId]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.dueDate)      errs.dueDate = 'Due date is required.';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      title:         form.title.trim(),
      dueDate:       form.dueDate,
      description:   form.description.trim(),
      difficulty:    form.difficulty,
      customFactors: cfValues,
    });
    if (!editTask) {
      setForm({ title: '', dueDate: '', description: '', difficulty: '' });
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
        <input id="title" name="title" type="text"
          placeholder="e.g. Midterm Exam – Biology"
          value={form.title} onChange={handleChange}
          className={errors.title ? 'input-error' : ''}
          autoFocus={!isEditing}
        />
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      {/* Due date */}
      <div className="field">
        <label htmlFor="dueDate">Due Date *</label>
        <input id="dueDate" name="dueDate" type="date"
          value={form.dueDate} onChange={handleChange}
          className={errors.dueDate ? 'input-error' : ''}
        />
        {errors.dueDate && <span className="error-msg">{errors.dueDate}</span>}
      </div>

      {/* Difficulty */}
      <div className="field">
        <label htmlFor="difficulty">Difficulty</label>
        <select id="difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>
          {DIFFICULTIES.map(d => (
            <option key={d} value={d}>{d || '— Not specified —'}</option>
          ))}
        </select>
      </div>

      {/* ── Custom factor fields ── */}
      {customFactors.length > 0 && (
        <div className="custom-factors-section">
          <p className="custom-factors-label">Custom Factors</p>
          {customFactors.map(factor => {
            const validOpts = factor.options.filter(o => o.label && o.score !== '');
            if (!validOpts.length) return null;
            return (
              <div className="field" key={factor.id}>
                <label htmlFor={`cf-${factor.id}`}>{factor.name}</label>
                <select
                  id={`cf-${factor.id}`}
                  value={cfValues[factor.id] || ''}
                  onChange={e => handleCfChange(factor.id, e.target.value)}
                >
                  <option value="">— Not specified —</option>
                  {validOpts
                    .slice()
                    .sort((a, b) => Number(b.score) - Number(a.score))
                    .map(opt => (
                      <option key={opt.label} value={opt.label}>
                        {opt.label} (+{opt.score} pts)
                      </option>
                    ))}
                </select>
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
          value={form.description} onChange={handleChange}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Save Changes' : '+ Add Task'}
        </button>
      </div>
    </form>
  );
}
