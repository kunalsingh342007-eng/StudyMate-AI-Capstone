import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../../firebase-applet-config.json';

// Built-in fallback project configuration for studymate-ai-c3f25
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'studymate-ai-c3f25',
  appId: '1:859209390665:web:d67fe3625b59abe045fd98',
  apiKey: 'AIzaSyCQxFyN9rYDrP4XITblVi8lTUKB517RgAc',
  authDomain: 'studymate-ai-c3f25.firebaseapp.com',
  firestoreDatabaseId: '(default)',
  storageBucket: 'studymate-ai-c3f25.firebasestorage.app',
  messagingSenderId: '859209390665',
};

// Configuration priority:
// 1. Client environment variables (VITE_FIREBASE_*)
// 2. Provisioned firebase-applet-config.json
// 3. DEFAULT_FIREBASE_CONFIG fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (appletConfig as any)?.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (appletConfig as any)?.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (appletConfig as any)?.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (appletConfig as any)?.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (appletConfig as any)?.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (appletConfig as any)?.appId || DEFAULT_FIREBASE_CONFIG.appId,
};

const databaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  (appletConfig as any)?.firestoreDatabaseId ||
  '(default)';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isConfigured = false;

// Initialize app, auth, and firestore with isolated error boundaries
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.warn('[StudyMate Firebase] App initialization encountered an issue:', error);
  }

  if (app) {
    try {
      auth = getAuth(app);
      isConfigured = true;
    } catch (authError) {
      console.warn('[StudyMate Firebase] Auth initialization encountered an issue:', authError);
    }

    try {
      db =
        databaseId && databaseId !== '(default)' && databaseId !== firebaseConfig.projectId
          ? getFirestore(app, databaseId)
          : getFirestore(app);
    } catch (dbError) {
      console.warn('[StudyMate Firebase] Firestore initialization encountered an issue:', dbError);
    }
  }
} else {
  console.info('[StudyMate Firebase] Client environment credentials not fully set; operating with demo fallback support.');
}

export { app, auth, db, isConfigured as isFirebaseConfigured };
