import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from './userService';
import toast from 'react-hot-toast';

export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  nativeLanguage: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

class AuthService {
  private authStateCallbacks: ((authState: AuthState) => void)[] = [];
  private currentAuthState: AuthState = {
    user: null,
    loading: true,
    error: null
  };

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentAuthState = {
        user,
        loading: false,
        error: null
      };
      this.notifyCallbacks();
    }, (error) => {
      this.currentAuthState = {
        user: null,
        loading: false,
        error: error.message
      };
      this.notifyCallbacks();
    });
  }

  private notifyCallbacks() {
    this.authStateCallbacks.forEach(callback => callback(this.currentAuthState));
  }

  public onAuthStateChange(callback: (authState: AuthState) => void) {
    this.authStateCallbacks.push(callback);
    // Immediately call with current state
    callback(this.currentAuthState);
    
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  private getFirebaseErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  async signUp(userData: UserRegistrationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Create user profile in Firestore
      await userService.createUserProfile(userCredential.user.uid, {
        name: userData.name,
        email: userData.email,
        nativeLanguage: userData.nativeLanguage,
        englishLevel: userData.englishLevel,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Account created successfully! Welcome to WordWise AI!');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = this.getFirebaseErrorMessage(authError);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = this.getFirebaseErrorMessage(authError);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = this.getFirebaseErrorMessage(authError);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  getCurrentUser(): User | null {
    return this.currentAuthState.user;
  }

  isAuthenticated(): boolean {
    return this.currentAuthState.user !== null;
  }

  isLoading(): boolean {
    return this.currentAuthState.loading;
  }

  getAuthError(): string | null {
    return this.currentAuthState.error;
  }
}

export const authService = new AuthService(); 