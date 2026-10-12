import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User,
  AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export interface RegisterUserData {
  email: string;
  password: string;
  displayName: string;
  academicLevel?: string;
  institution?: string;
  targetExam?: string;
}

export class AuthService {
  /**
   * Register a new user with email, password, and initial display name.
   */
  static async register(data: RegisterUserData): Promise<User> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured. Please check your environment configuration.');
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      if (data.displayName && credential.user) {
        await updateProfile(credential.user, {
          displayName: data.displayName.trim(),
        });
      }
      return credential.user;
    } catch (error: any) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  /**
   * Sign in an existing user with email and password.
   */
  static async login(email: string, password: string): Promise<User> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured. Please check your environment configuration.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return credential.user;
    } catch (error: any) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  /**
   * Sign out the currently authenticated user.
   */
  static async logout(): Promise<void> {
    if (!auth || !isFirebaseConfigured) {
      return;
    }

    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  /**
   * Send a password reset email to the specified address.
   */
  static async resetPassword(email: string): Promise<void> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured. Please check your environment configuration.');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address for password reset.');
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  /**
   * Safely delete the authenticated user's account.
   */
  static async deleteAccount(): Promise<void> {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in to delete.');
    }

    try {
      await deleteUser(auth.currentUser);
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        throw new Error('For security, deleting your account requires recent authentication. Please log out, sign in again, and retry.');
      }
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  /**
   * Convert Firebase auth error codes into friendly user messages.
   */
  static getFriendlyErrorMessage(error: any): string {
    const code = (error as AuthError)?.code || error?.message || '';

    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Your password is too weak. Please use at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please verify your credentials and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Access has been temporarily paused. Please wait or reset your password.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled in the Firebase Console. Please enable Email/Password provider.';
      case 'auth/requires-recent-login':
        return 'This sensitive operation requires a recent sign-in. Please log out and sign in again.';
      default:
        return error?.message || 'An unexpected authentication error occurred. Please try again.';
    }
  }
}
