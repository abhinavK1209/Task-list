import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthModal({ onClose }) {
  const [mode,     setMode]     = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function friendlyError(code) {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Incorrect email or password.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      onClose();
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

  const titles = { signin: 'Sign In', signup: 'Create Account', reset: 'Reset Password' };

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <div className="auth-header">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: 4 }}>
            <span className="logo-icon">✓</span>
            <span className="logo-text">TaskFlow</span>
          </div>
          <p className="auth-subtitle">Sync your tasks across all devices</p>
        </div>

        {/* Mode tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setResetSent(false); }}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setResetSent(false); }}>
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {resetSent ? (
            <div className="auth-success">
              ✓ Reset email sent to <strong>{email}</strong>. Check your inbox.
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input id="auth-email" type="email" autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" />
              </div>

              {mode !== 'reset' && (
                <div className="field">
                  <label htmlFor="auth-pw">Password</label>
                  <input id="auth-pw" type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} />
                </div>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Please wait…' : titles[mode]}
              </button>

              {mode === 'signin' && (
                <button type="button" className="auth-link"
                  onClick={() => { setMode('reset'); setError(''); }}>
                  Forgot password?
                </button>
              )}
            </>
          )}
        </form>

        <button className="auth-skip" onClick={onClose}>
          Continue without account — use this device only
        </button>
      </div>
    </div>
  );
}
