import { useState, useRef } from 'react';

// ── ICS parser ───────────────────────────────────────────────────────────────

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function parseIcsDate(value) {
  if (!value) return { date: '', time: '' };

  // DATE-only: YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    return {
      date: `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`,
      time: '',
    };
  }

  // DATETIME: YYYYMMDDTHHmmss[Z]
  if (/^\d{8}T\d{6}(Z)?$/.test(value)) {
    const yr = value.slice(0,4), mo = value.slice(4,6), dy = value.slice(6,8);
    const hr = value.slice(9,11), mn = value.slice(11,13);
    if (value.endsWith('Z')) {
      // UTC → local
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

    // Store raw value; for DTSTART/DTEND keep the raw datetime string
    cur[propName] = val;
  }

  return events;
}

function icsToTask(event) {
  const title       = unescape(event.SUMMARY       || 'Untitled Event').trim();
  const description = unescape(event.DESCRIPTION   || '').trim();
  const url         = (event.URL || '').trim();

  // DTSTART: strip TZID params — we already split at first colon, so value is clean
  const { date, time } = parseIcsDate(event.DTSTART || '');

  // PRIORITY mapping per RFC 5545: 1-4=high 5=medium 6-9=low
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

// ── Component ────────────────────────────────────────────────────────────────

export default function IcsImport({ onImport, onClose }) {
  const [events,   setEvents]   = useState(null);   // null = not yet parsed
  const [selected, setSelected] = useState(new Set());
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
      const tasks = raw.map(icsToTask);
      setEvents(tasks);
      setSelected(new Set(tasks.map((_, i) => i)));
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
    if (selected.size === events.length) setSelected(new Set());
    else setSelected(new Set(events.map((_, i) => i)));
  }

  function toggle(i) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleImport() {
    const toAdd = events.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;
    onImport(toAdd);
    onClose();
  }

  return (
    <div className="factor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="factor-panel">
        {/* Header */}
        <div className="factor-panel-header">
          <h2>Import from Calendar (.ics)</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="factor-panel-desc">
          Upload a <strong>.ics</strong> file exported from Google Calendar, Apple Calendar, Outlook, or any other calendar app.
          Events are imported as tasks with their title, date, and description.
        </p>

        <div className="factor-list">
          {/* Drop zone */}
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
              <input
                ref={fileRef} type="file" accept=".ics,text/calendar"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {error && <p className="auth-error" style={{ margin: 0 }}>{error}</p>}

          {/* Event list */}
          {events && (
            <div className="ics-event-list">
              <div className="ics-event-list-header">
                <span className="ics-event-count">
                  {events.length} event{events.length !== 1 ? 's' : ''} found
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={toggleAll}>
                  {selected.size === events.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {events.map((ev, i) => (
                <label key={i} className={`ics-event-row${selected.has(i) ? ' selected' : ''}`}>
                  <input
                    type="checkbox" checked={selected.has(i)}
                    onChange={() => toggle(i)}
                  />
                  <div className="ics-event-info">
                    <span className="ics-event-title">{ev.title}</span>
                    <span className="ics-event-meta">
                      {ev.dueDate
                        ? `${ev.dueDate}${ev.dueTime ? ' at ' + ev.dueTime : ''}`
                        : 'No date'}
                      {' · '}{ev.difficulty}
                    </span>
                    {ev.description && (
                      <span className="ics-event-desc">{ev.description.slice(0, 80)}{ev.description.length > 80 ? '…' : ''}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {events && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => { setEvents(null); setError(''); }}
            >
              ← Choose different file
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="factor-panel-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {events && (
            <button
              className="btn btn-primary"
              disabled={selected.size === 0}
              onClick={handleImport}
            >
              Import {selected.size > 0 ? selected.size : ''} Task{selected.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
