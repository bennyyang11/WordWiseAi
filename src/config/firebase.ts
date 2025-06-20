import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase environment variables:', missing);
    console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
    return false;
  }
  
  return true;
};

// Initialize Firebase only if configuration is valid
let app;
let auth;
let db;

try {
  if (validateFirebaseConfig()) {
    console.log('🔥 Initializing Firebase...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable persistence for offline support
    auth.useDeviceLanguage();
    
    console.log('✅ Firebase initialized successfully');
  } else {
    throw new Error('Firebase configuration validation failed');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { auth, db };
export default app; 