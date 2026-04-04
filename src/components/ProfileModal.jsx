import { useState, useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#6366f1',
];

export default function ProfileModal({ user, profileData, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(profileData.displayName || '');
  const [avatarColor, setAvatarColor] = useState(profileData.avatarColor || '#3b82f6');
  const [photoURL,    setPhotoURL]    = useState(profileData.photoURL    || '');
  const [photoFile,   setPhotoFile]   = useState(null);   // File object pending upload
  const [photoPreview, setPhotoPreview] = useState(profileData.photoURL || '');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2 MB.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoURL('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let finalPhotoURL = photoURL;

      // Upload new photo if one was selected
      if (photoFile && storage) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, photoFile, { contentType: photoFile.type });
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      const name = displayName.trim();

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name || null,
          photoURL:    finalPhotoURL || null,
        });
      }

      // Persist to Firestore
      if (db) {
        await setDoc(
          doc(db, 'users', user.uid, 'settings', 'profile'),
          { displayName: name, avatarColor, photoURL: finalPhotoURL, email: user.email },
          { merge: true }
        );
      }

      onSaved({ displayName: name, avatarColor, photoURL: finalPhotoURL });
      setPhotoURL(finalPhotoURL);
      setPhotoFile(null);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1000);
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
    }
    setLoading(false);
  }

  const initials = (displayName.trim() || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <div className="auth-header">
          {/* Avatar preview */}
          <div className="profile-avatar-wrap">
            {photoPreview ? (
              <img src={photoPreview} alt="avatar" className="profile-avatar-large profile-avatar-img" />
            ) : (
              <div className="profile-avatar-large" style={{ background: avatarColor }}>
                {initials}
              </div>
            )}
            <button
              type="button"
              className="profile-avatar-edit-btn"
              onClick={() => fileRef.current?.click()}
              title="Upload photo"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
          <h2 style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>Your Profile</h2>
          <p className="auth-subtitle">{user?.email}</p>
        </div>

        <form className="auth-form" onSubmit={handleSave} noValidate>
          {/* Photo actions */}
          {photoPreview && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                Change photo
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto}>
                Remove
              </button>
            </div>
          )}
          {!photoPreview && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileRef.current?.click()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload profile photo
            </button>
          )}

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

          {/* Color picker — used as fallback when no photo */}
          {!photoPreview && (
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
          )}

          {error   && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">✓ Profile saved!</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? (photoFile ? 'Uploading…' : 'Saving…') : 'Save Profile'}
          </button>
        </form>

        <button className="auth-skip" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
