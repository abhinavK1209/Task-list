import { useState, useRef } from 'react';

// ── ICS parser ───────────────────────────────────────────────────────────────

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function parseIcsDate(value) {
  if (!value) return { date: '', time: '' };
  if (/^\d{8}$/.test(value)) {
    return {
      date: `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`,
      time: '',
    };
  }
  if (/^\d{8}T\d{6}(Z)?$/.test(value)) {
    const yr = value.slice(0,4), mo = value.slice(4,6), dy = value.slice(6,8);
    const hr = value.slice(9,11), mn = value.slice(11,13);
    if (value.endsWith('Z')) {
      const d = new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:00Z`);
      return {
        date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
        time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      };
    }
    return { date: `${yr}-${mo}-${dy}`, time: `${hr}:${mn}` };
  }
  return { date: '', time: '' };
}

function unescape(val) {
  return val
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') ? url.trim() : '';
  } catch { return ''; }
}

function parseIcs(text) {
  const lines = unfold(text).split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT')   { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const propFull = line.slice(0, ci);
    const val      = line.slice(ci + 1);
    const propName = propFull.split(';')[0].toUpperCase();
    cur[propName] = val;
  }
  return events;
}

function icsToTask(event) {
  const title       = unescape(event.SUMMARY     || 'Untitled Event').trim().slice(0, 200);
  const description = unescape(event.DESCRIPTION || '').trim().slice(0, 2000);
  const url         = sanitizeUrl(event.URL || '');
  const { date, time } = parseIcsDate(event.DTSTART || '');
  let difficulty = 'Medium';
  if (event.PRIORITY) {
    const p = parseInt(event.PRIORITY, 10);
    if (!isNaN(p)) {
      if (p >= 1 && p <= 4) difficulty = 'Hard';
      else if (p >= 6 && p <= 9) difficulty = 'Easy';
    }
  }
  return { title, description, dueDate: date, dueTime: time, difficulty, isProject: false, projectBoost: 0, link: url, customFactors: {} };
}

// ── Duplicate detection ───────────────────────────────────────────────────────
// status: 'new' | 'duplicate' (same title+date) | 'conflict' (same title, diff date)

function classify(task, existingTasks) {
  const norm = t => t.title.trim().toLowerCase();
  const matches = existingTasks.filter(t => !t.completed && norm(t) === norm(task));
  if (matches.length === 0) return { status: 'new' };
  const exact = matches.find(t => t.dueDate === task.dueDate);
  if (exact) return { status: 'duplicate', existing: exact };
  return { status: 'conflict', existing: matches[0] };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IcsImport({ existingTasks = [], onImport, onClose }) {
  const [events,   setEvents]   = useState(null); // [{task, status, existing}]
  const [selected, setSelected] = useState(new Set());
  // For conflicts: user can pick 'ics' (keep ICS date) or 'existing' (keep existing date)
  const [datePick, setDatePick] = useState({}); // { index: 'ics' | 'existing' }
  const [error,    setError]    = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  function process(text) {
    try {
      const raw = parseIcs(text);
      if (raw.length === 0) {
        setError('No events found. Make sure the file is a valid .ics calendar export.');
        return;
      }
      const classified = raw.map(e => {
        const task = icsToTask(e);
        const { status, existing } = classify(task, existingTasks);
        return { task, status, existing };
      });
      setEvents(classified);
      // Default: select new + conflict, skip exact duplicates
      const defaultSelected = new Set(
        classified.map((e, i) => i).filter(i => classified[i].status !== 'duplicate')
      );
      setSelected(defaultSelected);
      // Default date pick for conflicts: use ICS date
      const picks = {};
      classified.forEach((e, i) => { if (e.status === 'conflict') picks[i] = 'ics'; });
      setDatePick(picks);
      setError('');
    } catch {
      setError('Could not read the calendar file. Please try again.');
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.ics') && file.type !== 'text/calendar') {
      setError('Please select a .ics calendar file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => process(e.target.result);
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function toggleAll() {
    const selectable = events.map((_, i) => i).filter(i => events[i].status !== 'duplicate');
    const allOn = selectable.every(i => selected.has(i));
    if (allOn) setSelected(new Set());
    else setSelected(new Set(selectable));
  }

  function toggle(i) {
    if (events[i].status === 'duplicate') return; // can't import exact duplicates
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleImport() {
    const toAdd = events
      .filter((_, i) => selected.has(i))
      .map(({ task, status, existing }, i) => {
        if (status === 'conflict' && datePick[i] === 'existing') {
          return { ...task, dueDate: existing.dueDate, dueTime: existing.dueTime || '' };
        }
        return task;
      });
    if (toAdd.length === 0) return;
    onImport(toAdd);
    onClose();
  }

  const newCount  = events ? events.filter(e => e.status === 'new').length : 0;
  const dupCount  = events ? events.filter(e => e.status === 'duplicate').length : 0;
  const confCount = events ? events.filter(e => e.status === 'conflict').length : 0;

  return (
    <div className="factor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="factor-panel">
        <div className="factor-panel-header">
          <h2>Import from Calendar (.ics)</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="factor-panel-desc">
          Upload a <strong>.ics</strong> file from Google Calendar, Apple Calendar, Outlook, etc.
          Exact duplicates are detected and skipped automatically.
        </p>

        <div className="factor-list">
          {!events && (
            <div
              className={`ics-dropzone${dragging ? ' dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="ics-dropzone-label">Drop .ics file here or click to browse</p>
              <input ref={fileRef} type="file" accept=".ics,text/calendar"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}

          {events && (
            <div className="ics-event-list">
              {/* Summary row */}
              <div className="ics-summary-row">
                <span className="ics-summary-chip ics-chip-new">{newCount} new</span>
                {confCount > 0 && <span className="ics-summary-chip ics-chip-conflict">{confCount} date conflict{confCount !== 1 ? 's' : ''}</span>}
                {dupCount  > 0 && <span className="ics-summary-chip ics-chip-dup">{dupCount} duplicate{dupCount !== 1 ? 's' : ''}</span>}
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={toggleAll}>
                  {events.filter((_, i) => events[i].status !== 'duplicate').every((_, j) => {
                    const realIdx = events.map((_, i) => i).filter(i => events[i].status !== 'duplicate')[j];
                    return selected.has(realIdx);
                  }) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {events.map(({ task, status, existing }, i) => (
                <div key={i} className={`ics-event-row${selected.has(i) ? ' selected' : ''}${status === 'duplicate' ? ' ics-row-dup' : ''}`}
                  onClick={() => toggle(i)}
                >
                  <input type="checkbox" checked={selected.has(i)}
                    disabled={status === 'duplicate'}
                    onChange={() => toggle(i)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="ics-event-info">
                    <div className="ics-event-title-row">
                      <span className="ics-event-title">{task.title}</span>
                      {status === 'duplicate' && <span className="ics-status-badge ics-badge-dup">Already exists</span>}
                      {status === 'conflict'  && <span className="ics-status-badge ics-badge-conflict">Title exists · different date</span>}
                    </div>

                    {status === 'conflict' ? (
                      <div className="ics-conflict-dates" onClick={e => e.stopPropagation()}>
                        <label className={`ics-date-option${datePick[i] === 'ics' ? ' chosen' : ''}`}>
                          <input type="radio" name={`date-${i}`} value="ics"
                            checked={datePick[i] === 'ics'}
                            onChange={() => setDatePick(p => ({ ...p, [i]: 'ics' }))} />
                          Use ICS date: <strong>{task.dueDate || 'none'}</strong>
                          {task.dueTime ? ` at ${task.dueTime}` : ''}
                        </label>
                        <label className={`ics-date-option${datePick[i] === 'existing' ? ' chosen' : ''}`}>
                          <input type="radio" name={`date-${i}`} value="existing"
                            checked={datePick[i] === 'existing'}
                            onChange={() => setDatePick(p => ({ ...p, [i]: 'existing' }))} />
                          Keep existing date: <strong>{existing.dueDate || 'none'}</strong>
                          {existing.dueTime ? ` at ${existing.dueTime}` : ''}
                        </label>
                      </div>
                    ) : (
                      <span className="ics-event-meta">
                        {task.dueDate ? `${task.dueDate}${task.dueTime ? ' at ' + task.dueTime : ''}` : 'No date'}
                        {' · '}{task.difficulty}
                        {status === 'duplicate' && existing.dueDate && ` (exists: ${existing.dueDate})`}
                      </span>
                    )}

                    {task.description && (
                      <span className="ics-event-desc">
                        {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {events && (
            <button type="button" className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => { setEvents(null); setError(''); }}>
              ← Choose different file
            </button>
          )}
        </div>

        <div className="factor-panel-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {events && (
            <button className="btn btn-primary" disabled={selected.size === 0} onClick={handleImport}>
              Import {selected.size > 0 ? selected.size : ''} Task{selected.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
