import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserData {
  id: string;
  email: string;
  name: string;
  nativeLanguage: string;
  englishLevel: string;
  createdAt: any;
  lastLoginAt?: any;
  emailVerified: boolean;
}

// Custom error messages for better UX
const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'An error occurred during authentication.';
  }
};

export const signUp = async (
  email: string,
  password: string,
  name: string,
  nativeLanguage: string,
  englishLevel: string
): Promise<UserData> => {
  try {
    console.log('🔑 Creating new user account...');
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    const userData: UserData = {
      id: user.uid,
      email: user.email!,
      name,
      nativeLanguage,
      englishLevel,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified,
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    
    console.log('✅ User account created successfully');
    return {
      ...userData,
      createdAt: new Date() // Return a proper Date object for the frontend
    };
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔑 Signing in user...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }

    console.log('✅ User signed in successfully');
    return user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log('🔑 Signing in with Google...');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if this is a new user and create profile if needed
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create new user profile for Google sign-in
      const userData: UserData = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'User',
        nativeLanguage: 'Unknown',
        englishLevel: 'intermediate',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        emailVerified: user.emailVerified,
      };
      
      await setDoc(userDocRef, userData);
    } else {
      // Update last login time
      await setDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }

    console.log('✅ Google sign in successful');
    return user;
  } catch (error: any) {
    console.error('❌ Google sign in error:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const logOut = async (): Promise<void> => {
  try {
    console.log('🔑 Signing out user...');
    await signOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserProfile = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, updates, { merge: true });
    console.log('✅ User profile updated successfully');
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
}; 