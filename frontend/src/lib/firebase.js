import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDMQRxyUXZkj5_UF2s24hRQK6UJWnt031I',
  authDomain: 'android-c164b.firebaseapp.com',
  databaseURL: 'https://android-c164b-default-rtdb.firebaseio.com',
  projectId: 'android-c164b',
  storageBucket: 'android-c164b.firebasestorage.app',
  messagingSenderId: '69140808985',
  appId: '1:69140808985:web:86a8002a05439a71023188',
  measurementId: 'G-V6LW2BFTDT',
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export let firebaseAnalytics = null;

if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((ok) => {
    if (ok) {
      firebaseAnalytics = getAnalytics(app);
    }
  }).catch(() => {
    firebaseAnalytics = null;
  });
}
