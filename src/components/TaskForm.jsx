import { useState, useEffect } from 'react';

const DIFFICULTIES = ['', 'Easy', 'Medium', 'Hard'];

const EMPTY_FORM = {
  title: '',
  dueDate: '',
  description: '',
  difficulty: '',
};

/**
 * TaskForm — used for both creating new tasks and editing existing ones.
 * Props:
 *   onSubmit(taskData)  — called with form values
 *   onCancel()          — called when user cancels (edit mode only)
 *   editTask            — pre-fills form when editing; null = create mode
 */
export default function TaskForm({ onSubmit, onCancel, editTask = null }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Pre-fill form when editing
  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || '',
        dueDate: editTask.dueDate || '',
        description: editTask.description || '',
        difficulty: editTask.difficulty || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editTask]);

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.dueDate) errs.dueDate = 'Due date is required.';
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      title: form.title.trim(),
      dueDate: form.dueDate,
      description: form.description.trim(),
      difficulty: form.difficulty,
    });
    if (!editTask) setForm(EMPTY_FORM); // reset only in create mode
  }

  const isEditing = !!editTask;

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>

      {/* Title */}
      <div className="field">
        <label htmlFor="title">Task Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Midterm Exam – Biology"
          value={form.title}
          onChange={handleChange}
          className={errors.title ? 'input-error' : ''}
          autoFocus={!isEditing}
        />
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      {/* Due date */}
      <div className="field">
        <label htmlFor="dueDate">Due Date *</label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
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

      {/* Description */}
      <div className="field">
        <label htmlFor="description">Description <span className="optional">(optional)</span></label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add notes, topics to study, etc."
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        {isEditing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Save Changes' : '+ Add Task'}
        </button>
      </div>
    </form>
  );
}
