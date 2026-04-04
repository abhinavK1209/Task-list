import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export default function AuthModal({ onClose }) {
  const [mode,      setMode]      = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function friendlyError(code) {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':   return 'Incorrect email or password.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password':        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':    return 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user': return 'Sign-in window was closed. Please try again.';
      case 'auth/popup-blocked':        return 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
      default:                          return 'Something went wrong. Please try again.';
    }
  }

  async function handleGoogle() {
    setError(''); setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
    }
    setGLoading(false);
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
        setLoading(false); return;
      }
      onClose();
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
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

        <div className="auth-form">
          {/* Google button — shown on sign in + sign up, not reset */}
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                className="btn-google"
                onClick={handleGoogle}
                disabled={gLoading || loading}
              >
                {gLoading ? (
                  <span className="google-spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                )}
                {gLoading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>
            </>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading || gLoading}>
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
        </div>

        <button className="auth-skip" onClick={onClose}>
          Continue without account — use this device only
        </button>
      </div>
    </div>
  );
}
