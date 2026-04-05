import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#6366f1',
];

export default function ProfileModal({ user, profileData, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(profileData.displayName || '');
  const [avatarColor, setAvatarColor] = useState(profileData.avatarColor || '#3b82f6');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const name = displayName.trim();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name || null });
      }
      if (db) {
        await setDoc(
          doc(db, 'users', user.uid, 'settings', 'profile'),
          { displayName: name, avatarColor, email: user.email },
          { merge: true }
        );
      }
      onSaved({ displayName: name, avatarColor });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1000);
    } catch {
      setError('Failed to save. Please try again.');
    }
    setLoading(false);
  }

  const initials = (displayName.trim() || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <div className="auth-header">
          <div className="profile-avatar-large" style={{ background: avatarColor }}>
            {initials}
          </div>
          <h2 style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>Your Profile</h2>
          <p className="auth-subtitle">{user?.email}</p>
        </div>

        <form className="auth-form" onSubmit={handleSave} noValidate>
          <div className="field">
            <label htmlFor="prof-name">
              Display Name <span className="optional">(optional)</span>
            </label>
            <input
              id="prof-name" type="text" maxLength={40}
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Avatar Color</label>
            <div className="avatar-color-row">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c} type="button"
                  className={`avatar-color-dot${avatarColor === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  title={c}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
          </div>

          {error   && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">✓ Profile saved!</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        <button className="auth-skip" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
