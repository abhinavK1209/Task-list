/**
 * Firebase initialization.
 * If VITE_FIREBASE_API_KEY is not set, auth and db remain null
 * and the app falls back to localStorage-only mode gracefully.
 */
import { initializeApp }            from 'firebase/app';
import { getAuth }                  from 'firebase/auth';
import { getFirestore }             from 'firebase/firestore';

export const FIREBASE_CONFIGURED = !!import.meta.env.VITE_FIREBASE_API_KEY;

let auth = null;
let db   = null;

if (FIREBASE_CONFIGURED) {
  const app = initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  });
  auth = getAuth(app);
  db   = getFirestore(app);
}

export { auth, db };
