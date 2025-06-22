import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';

export interface FirebaseTestResult {
  step: string;
  success: boolean;
  error?: string;
  details?: any;
}

export const testFirebaseConnection = async (): Promise<FirebaseTestResult[]> => {
  const results: FirebaseTestResult[] = [];

  // Test 1: Firebase Configuration
  try {
    const config = {
      projectId: auth.app.options.projectId,
      authDomain: auth.app.options.authDomain,
      hasApiKey: !!auth.app.options.apiKey,
      hasAppId: !!auth.app.options.appId
    };
    
    results.push({
      step: 'Firebase Configuration',
      success: true,
      details: config
    });
  } catch (error) {
    results.push({
      step: 'Firebase Configuration',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Authentication Service
  try {
    const userCredential = await signInAnonymously(auth);
    results.push({
      step: 'Anonymous Authentication',
      success: true,
      details: { uid: userCredential.user.uid }
    });

    // Test 3: Firestore Write
    try {
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'Connection test',
        timestamp: serverTimestamp(),
        testId: Math.random().toString(36)
      });

      results.push({
        step: 'Firestore Write Test',
        success: true,
        details: { docId: testDoc.id }
      });

      // Test 4: Firestore Delete (cleanup)
      try {
        await deleteDoc(doc(db, 'test', testDoc.id));
        results.push({
          step: 'Firestore Delete Test',
          success: true
        });
      } catch (error) {
        results.push({
          step: 'Firestore Delete Test',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      results.push({
        step: 'Firestore Write Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Sign out
    await signOut(auth);
    results.push({
      step: 'Sign Out',
      success: true
    });

  } catch (error) {
    results.push({
      step: 'Anonymous Authentication',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
};

export const getFirebaseErrorAdvice = (error: string): string => {
  if (error.includes('400')) {
    return `
Firebase 400 errors are typically caused by:
1. Invalid API key or project configuration
2. Incorrect Firebase project settings
3. Network/proxy issues blocking Firebase
4. Firestore security rules blocking access
5. Invalid request format or missing required fields

Try:
- Check your Firebase project settings
- Verify API key permissions
- Test from a different network
- Check browser console for detailed error messages
    `;
  }
  
  if (error.includes('permission-denied')) {
    return `
Permission denied errors suggest:
1. User not authenticated properly
2. Firestore security rules blocking the operation
3. Insufficient user permissions

Try:
- Ensure user is signed in
- Check Firestore security rules
- Verify user has required permissions
    `;
  }

  if (error.includes('unavailable')) {
    return `
Service unavailable errors suggest:
1. Network connectivity issues
2. Firebase service temporarily down
3. Too many concurrent connections

Try:
- Check internet connection
- Retry after a few minutes
- Check Firebase status page
    `;
  }

  return 'Check Firebase documentation for specific error details.';
}; 