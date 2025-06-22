import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

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
    console.error('❌ Missing Firebase environment variables:', missing);
    console.error('📋 Please check your .env file and ensure all Firebase configuration variables are set.');
    return false;
  }
  
  // Log successful configuration (but hide sensitive data)
  console.log('✅ Firebase configuration validated');
  console.log('🔧 Project ID:', firebaseConfig.projectId);
  console.log('🌐 Auth Domain:', firebaseConfig.authDomain);
  
  return true;
};

// Initialize Firebase - Production Only
let app: any;
let auth: Auth;
let db: Firestore;

try {
  if (!validateFirebaseConfig()) {
    throw new Error('Firebase configuration validation failed');
  }

  console.log('🚀 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  
  console.log('🔐 Initializing Firebase Auth...');
  auth = getAuth(app);
  
  console.log('🗄️ Initializing Firestore...');
  db = getFirestore(app);

  // Configure for production use
  auth.useDeviceLanguage();
  
  console.log('✅ Firebase initialized successfully');

  // Add connection monitoring
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('👤 User authenticated:', user.uid);
    } else {
      console.log('👤 User not authenticated');
    }
  });

} catch (error) {
  console.error('💥 Firebase initialization failed:', error);
  
  // Provide helpful error messages
  if (error instanceof Error) {
    if (error.message.includes('API key not valid')) {
      console.error('🔑 Invalid API key. Check your VITE_FIREBASE_API_KEY in .env file');
    } else if (error.message.includes('Project ID')) {
      console.error('🆔 Invalid Project ID. Check your VITE_FIREBASE_PROJECT_ID in .env file');
    } else if (error.message.includes('Network')) {
      console.error('🌐 Network error. Check your internet connection and Firebase project status');
    }
  }
  
  throw error;
}

export { auth, db };
export default app; 