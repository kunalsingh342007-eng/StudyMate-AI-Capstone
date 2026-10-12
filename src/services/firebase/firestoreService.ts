import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { UserProfile } from '../../types';

export interface FirestorePreferences {
  theme: 'light' | 'dark' | 'system';
  dailyStudyGoalMinutes: number;
  preferredStudyDays: string;
  defaultStudyDurationMinutes: number;
  interfaceLanguage: string;
  studyRemindersEnabled: boolean;
  examRemindersEnabled: boolean;
  updatedAt?: any;
}

export const DEFAULT_FIRESTORE_PREFERENCES: FirestorePreferences = {
  theme: 'light',
  dailyStudyGoalMinutes: 180, // 3 hours
  preferredStudyDays: 'Mon, Tue, Wed, Thu, Fri, Sat',
  defaultStudyDurationMinutes: 45,
  interfaceLanguage: 'English',
  studyRemindersEnabled: true,
  examRemindersEnabled: true,
};

export class FirestoreService {
  /**
   * Validate server-side Firestore connection as instructed by skill rules.
   */
  static async testConnection(): Promise<boolean> {
    if (!db || !isFirebaseConfigured) return false;
    try {
      await getDocFromServer(doc(db, 'system', 'connection_probe'));
      return true;
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('[Firestore] Client is offline or Firestore is temporarily unreachable.');
      }
      return false;
    }
  }

  /**
   * Get student profile document from users/{uid}.
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db || !isFirebaseConfigured || !uid) return null;

    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          id: uid,
          name: data.displayName || data.name || 'Student',
          email: data.email || '',
          avatarUrl: data.photoURL || undefined,
          academicLevel: data.academicLevel || 'Undergraduate Senior',
          institution: data.institution || '',
          targetExam: data.targetExam || 'Semester Finals',
          targetExamDate: data.targetExamDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          bio: data.bio || '',
          dailyGoalHours: data.dailyGoalHours || 3,
          streakDays: data.streakDays || 1,
          totalStudyMinutes: data.totalStudyMinutes || 0,
          quizzesCompleted: data.quizzesCompleted || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn('[Firestore] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Create or update student profile document in users/{uid}.
   */
  static async saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;

    try {
      const docRef = doc(db, 'users', uid);
      const payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (profile.name !== undefined) payload.displayName = profile.name;
      if (profile.email !== undefined) payload.email = profile.email;
      if (profile.avatarUrl !== undefined) payload.photoURL = profile.avatarUrl;
      if (profile.academicLevel !== undefined) payload.academicLevel = profile.academicLevel;
      if (profile.institution !== undefined) payload.institution = profile.institution;
      if (profile.targetExam !== undefined) payload.targetExam = profile.targetExam;
      if (profile.targetExamDate !== undefined) payload.targetExamDate = profile.targetExamDate;
      if (profile.bio !== undefined) payload.bio = profile.bio;
      if (profile.dailyGoalHours !== undefined) payload.dailyGoalHours = profile.dailyGoalHours;

      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      console.error('[Firestore] Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Get user preferences from users/{uid}/settings/preferences.
   */
  static async getUserPreferences(uid: string): Promise<FirestorePreferences> {
    if (!db || !isFirebaseConfigured || !uid) {
      return { ...DEFAULT_FIRESTORE_PREFERENCES };
    }

    try {
      const docRef = doc(db, 'users', uid, 'settings', 'preferences');
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          theme: data.theme || DEFAULT_FIRESTORE_PREFERENCES.theme,
          dailyStudyGoalMinutes: data.dailyStudyGoalMinutes ?? DEFAULT_FIRESTORE_PREFERENCES.dailyStudyGoalMinutes,
          preferredStudyDays: data.preferredStudyDays || DEFAULT_FIRESTORE_PREFERENCES.preferredStudyDays,
          defaultStudyDurationMinutes: data.defaultStudyDurationMinutes ?? DEFAULT_FIRESTORE_PREFERENCES.defaultStudyDurationMinutes,
          interfaceLanguage: data.interfaceLanguage || DEFAULT_FIRESTORE_PREFERENCES.interfaceLanguage,
          studyRemindersEnabled: data.studyRemindersEnabled ?? DEFAULT_FIRESTORE_PREFERENCES.studyRemindersEnabled,
          examRemindersEnabled: data.examRemindersEnabled ?? DEFAULT_FIRESTORE_PREFERENCES.examRemindersEnabled,
        };
      }

      // Initialize default preferences document if not existing yet
      await setDoc(docRef, {
        ...DEFAULT_FIRESTORE_PREFERENCES,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { ...DEFAULT_FIRESTORE_PREFERENCES };
    } catch (error) {
      console.warn('[Firestore] Error loading preferences; returning defaults:', error);
      return { ...DEFAULT_FIRESTORE_PREFERENCES };
    }
  }

  /**
   * Update user preferences in users/{uid}/settings/preferences.
   */
  static async saveUserPreferences(uid: string, preferences: Partial<FirestorePreferences>): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) {
      return;
    }

    try {
      const docRef = doc(db, 'users', uid, 'settings', 'preferences');
      await setDoc(
        docRef,
        {
          ...preferences,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[Firestore] Error saving user preferences:', error);
      throw error;
    }
  }
}
