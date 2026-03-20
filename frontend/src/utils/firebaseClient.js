import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let appInstance = null;
let authInstance = null;

function getEnv(key) {
  // eslint-disable-next-line no-undef
  return import.meta?.env?.[key];
}

export function isFirebaseConfigured() {
  const apiKey = getEnv('VITE_FIREBASE_API_KEY');
  const authDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
  const appId = getEnv('VITE_FIREBASE_APP_ID');
  return !!(apiKey && authDomain && projectId && appId);
}

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  if (!isFirebaseConfigured()) return null;

  if (!appInstance) {
    if (!getApps().length) {
      appInstance = initializeApp({
        apiKey: getEnv('VITE_FIREBASE_API_KEY'),
        authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
        appId: getEnv('VITE_FIREBASE_APP_ID'),
      });
    } else {
      appInstance = getApps()[0];
    }
  }

  authInstance = getAuth(appInstance);
  return authInstance;
}

