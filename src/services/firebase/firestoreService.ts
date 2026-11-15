import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { StudyPlan, UserProfile } from '../../types';

export interface FirestorePreferences {
  theme: 'light' | 'dark' | 'system';
  dailyStudyGoalMinutes: number;
  preferredStudyDays: string;
  defaultStudyDurationMinutes: number;
  interfaceLanguage: string;
  studyRemindersEnabled: boolean;
  examRemindersEnabled: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
  updatedAt?: any;
}

export const DEFAULT_FIRESTORE_PREFERENCES: FirestorePreferences = {
  theme: 'light',
  dailyStudyGoalMinutes: 180,
  preferredStudyDays: 'Mon, Tue, Wed, Thu, Fri, Sat',
  defaultStudyDurationMinutes: 45,
  interfaceLanguage: 'English',
  studyRemindersEnabled: true,
  examRemindersEnabled: true,
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function formatFirestoreError(error: unknown, operationType: OperationType, path: string): string {
  const user = auth?.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
    },
    operationType,
    path,
  };
  return JSON.stringify(errInfo);
}

/**
 * Strip undefined keys recursively because Firestore rejects `undefined` property values.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

export class FirestoreService {
  /**
   * Validate server-side Firestore connection.
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
   * Get student profile document from users/{uid} without injecting fabricated study defaults.
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db || !isFirebaseConfigured || !uid) return null;

    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          id: uid,
          name: data.displayName || data.name || 'Student',
          preferredName: data.preferredName || '',
          email: data.email || '',
          avatarUrl: data.photoURL || undefined,
          avatarRemoved: Boolean(data.avatarRemoved),
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          academicLevel: data.academicLevel || '',
          institution: data.institution || '',
          degree: data.degree || '',
          branch: data.branch || '',
          currentYear: data.currentYear || '',
          currentSemester: data.currentSemester || '',
          admissionYear: typeof data.admissionYear === 'number' ? data.admissionYear : undefined,
          expectedGraduationYear:
            typeof data.expectedGraduationYear === 'number' ? data.expectedGraduationYear : undefined,
          careerInterest: data.careerInterest || '',
          targetExam: data.targetExam || '',
          targetExamDate: data.targetExamDate || '',
          upcomingExams: Array.isArray(data.upcomingExams) ? data.upcomingExams : [],
          bio: data.bio || '',
          dailyGoalHours: typeof data.dailyGoalHours === 'number' ? data.dailyGoalHours : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          totalStudyMinutes: typeof data.totalStudyMinutes === 'number' ? data.totalStudyMinutes : 0,
          quizzesCompleted: typeof data.quizzesCompleted === 'number' ? data.quizzesCompleted : 0,
          onboardingCompleted: Boolean(data.onboardingCompleted),
          onboardingStep: typeof data.onboardingStep === 'number' ? data.onboardingStep : 0,
          subjects: Array.isArray(data.subjects) ? data.subjects : [],
          learningGoal: data.learningGoal || '',
          weakTopics: Array.isArray(data.weakTopics) ? data.weakTopics : [],
          timetable: data.timetable || '',
          preferredStudyDays: Array.isArray(data.preferredStudyDays) ? data.preferredStudyDays : [],
          preferredStudyTime: data.preferredStudyTime || '',
          secondaryEducation: data.secondaryEducation || undefined,
          higherSecondaryEducation: data.higherSecondaryEducation || undefined,
          semesterResults: Array.isArray(data.semesterResults) ? data.semesterResults : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          experiences: Array.isArray(data.experiences) ? data.experiences : [],
          socialLinks: data.socialLinks || {},
        };
      }
      return null;
    } catch (error) {
      console.warn('[Firestore] Error fetching user profile:', formatFirestoreError(error, OperationType.GET, path));
      return null;
    }
  }

  /**
   * Create or update student profile document in users/{uid}.
   */
  static async saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;

    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const payload: Record<string, any> = {
        id: uid,
        updatedAt: serverTimestamp(),
      };

      if (profile.name !== undefined) payload.displayName = profile.name;
      if (profile.preferredName !== undefined) payload.preferredName = profile.preferredName;
      if (profile.email !== undefined) payload.email = profile.email;
      if (profile.avatarRemoved !== undefined) payload.avatarRemoved = profile.avatarRemoved;
      // Store external URLs (like Google photoURL) on main doc; uploaded base64 avatars live in users/{uid}/profile/avatar
      if (profile.avatarUrl !== undefined && !profile.avatarUrl.startsWith('data:')) {
        payload.photoURL = profile.avatarUrl;
      } else if (profile.avatarRemoved === true) {
        payload.photoURL = '';
      }
      if (profile.city !== undefined) payload.city = profile.city;
      if (profile.state !== undefined) payload.state = profile.state;
      if (profile.country !== undefined) payload.country = profile.country;
      if (profile.academicLevel !== undefined) payload.academicLevel = profile.academicLevel;
      if (profile.institution !== undefined) payload.institution = profile.institution;
      if (profile.degree !== undefined) payload.degree = profile.degree;
      if (profile.branch !== undefined) payload.branch = profile.branch;
      if (profile.currentYear !== undefined) payload.currentYear = profile.currentYear;
      if (profile.currentSemester !== undefined) payload.currentSemester = profile.currentSemester;
      if (profile.admissionYear !== undefined) payload.admissionYear = profile.admissionYear;
      if (profile.expectedGraduationYear !== undefined) {
        payload.expectedGraduationYear = profile.expectedGraduationYear;
      }
      if (profile.careerInterest !== undefined) payload.careerInterest = profile.careerInterest;
      if (profile.targetExam !== undefined) payload.targetExam = profile.targetExam;
      if (profile.targetExamDate !== undefined) payload.targetExamDate = profile.targetExamDate;
      if (profile.upcomingExams !== undefined) payload.upcomingExams = profile.upcomingExams;
      if (profile.bio !== undefined) payload.bio = profile.bio;
      if (profile.dailyGoalHours !== undefined) payload.dailyGoalHours = profile.dailyGoalHours;
      if (profile.streakDays !== undefined) payload.streakDays = profile.streakDays;
      if (profile.totalStudyMinutes !== undefined) payload.totalStudyMinutes = profile.totalStudyMinutes;
      if (profile.quizzesCompleted !== undefined) payload.quizzesCompleted = profile.quizzesCompleted;
      if (profile.onboardingCompleted !== undefined) payload.onboardingCompleted = profile.onboardingCompleted;
      if (profile.onboardingStep !== undefined) payload.onboardingStep = profile.onboardingStep;
      if (profile.subjects !== undefined) payload.subjects = profile.subjects;
      if (profile.learningGoal !== undefined) payload.learningGoal = profile.learningGoal;
      if (profile.weakTopics !== undefined) payload.weakTopics = profile.weakTopics;
      if (profile.timetable !== undefined) payload.timetable = profile.timetable;
      if (profile.preferredStudyDays !== undefined) payload.preferredStudyDays = profile.preferredStudyDays;
      if (profile.preferredStudyTime !== undefined) payload.preferredStudyTime = profile.preferredStudyTime;
      if (profile.secondaryEducation !== undefined) payload.secondaryEducation = profile.secondaryEducation;
      if (profile.higherSecondaryEducation !== undefined) {
        payload.higherSecondaryEducation = profile.higherSecondaryEducation;
      }
      if (profile.semesterResults !== undefined) payload.semesterResults = profile.semesterResults;
      if (profile.goals !== undefined) payload.goals = profile.goals;
      if (profile.skills !== undefined) payload.skills = profile.skills;
      if (profile.projects !== undefined) payload.projects = profile.projects;
      if (profile.certifications !== undefined) payload.certifications = profile.certifications;
      if (profile.experiences !== undefined) payload.experiences = profile.experiences;
      if (profile.socialLinks !== undefined) payload.socialLinks = profile.socialLinks;

      await setDoc(docRef, stripUndefined(payload), { merge: true });
    } catch (error: any) {
      const formatted = formatFirestoreError(error, OperationType.WRITE, path);
      console.warn('[Firestore] Could not save profile:', formatted);
      throw error;
    }
  }

  /**
   * Read owner-only private profile avatar stored under users/{uid}/profile/avatar.
   */
  static async getUserAvatar(uid: string): Promise<string | null> {
    if (!db || !isFirebaseConfigured || !uid) return null;
    const path = `users/${uid}/profile/avatar`;
    try {
      const docRef = doc(db, 'users', uid, 'profile', 'avatar');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data?.dataUrl === 'string' && data.dataUrl.startsWith('data:image/')) {
          return data.dataUrl;
        }
      }
      return null;
    } catch (error) {
      console.warn('[Firestore] Error loading profile avatar:', formatFirestoreError(error, OperationType.GET, path));
      return null;
    }
  }

  /**
   * Save owner-only private profile avatar under users/{uid}/profile/avatar.
   */
  static async saveUserAvatar(uid: string, dataUrl: string, mimeType: string): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    const path = `users/${uid}/profile/avatar`;
    try {
      const docRef = doc(db, 'users', uid, 'profile', 'avatar');
      await setDoc(docRef, {
        dataUrl,
        mimeType,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.warn('[Firestore] Could not save profile avatar:', formatFirestoreError(error, OperationType.WRITE, path));
      throw error;
    }
  }

  /**
   * Delete owner-only private profile avatar under users/{uid}/profile/avatar.
   */
  static async deleteUserAvatar(uid: string): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    const path = `users/${uid}/profile/avatar`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'profile', 'avatar'));
    } catch (error: any) {
      console.warn('[Firestore] Could not delete profile avatar:', formatFirestoreError(error, OperationType.DELETE, path));
      throw error;
    }
  }

  /**
   * Fetch all persisted study plans for users/{uid}/studyPlans.
   */
  static async getStudyPlans(uid: string): Promise<StudyPlan[]> {
    if (!db || !isFirebaseConfigured || !uid) return [];

    const path = `users/${uid}/studyPlans`;
    try {
      const colRef = collection(db, 'users', uid, 'studyPlans');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const plans: StudyPlan[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && data.subject) {
          plans.push({
            id: String(data.id),
            createdAt: String(data.createdAt || new Date().toISOString()),
            subject: String(data.subject),
            examDate: String(data.examDate || ''),
            dailyHours: Number(data.dailyHours) || 1,
            level: data.level || 'Intermediate',
            topics: Array.isArray(data.topics) ? data.topics : [],
            weakTopics: Array.isArray(data.weakTopics) ? data.weakTopics : [],
            preferredDays: Array.isArray(data.preferredDays) ? data.preferredDays : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            totalDays: Number(data.totalDays) || 0,
            totalStudyHours: Number(data.totalStudyHours) || 0,
            assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
            learningGoal: data.learningGoal,
            timetable: data.timetable,
            isManual: Boolean(data.isManual),
          });
        }
      });
      return plans;
    } catch (error) {
      console.warn('[Firestore] Error loading study plans:', formatFirestoreError(error, OperationType.LIST, path));
      return [];
    }
  }

  /**
   * Save or update a study plan under users/{uid}/studyPlans/{plan.id}.
   */
  static async saveStudyPlan(uid: string, plan: StudyPlan): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid || !plan?.id) return;

    const path = `users/${uid}/studyPlans/${plan.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'studyPlans', plan.id);
      await setDoc(
        docRef,
        stripUndefined({
          ...plan,
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    } catch (error: any) {
      console.warn('[Firestore] Could not save study plan:', formatFirestoreError(error, OperationType.WRITE, path));
    }
  }

  /**
   * Delete a study plan from users/{uid}/studyPlans/{planId}.
   */
  static async deleteStudyPlan(uid: string, planId: string): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid || !planId) return;

    const path = `users/${uid}/studyPlans/${planId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'studyPlans', planId));
    } catch (error: any) {
      console.warn('[Firestore] Could not delete study plan:', formatFirestoreError(error, OperationType.DELETE, path));
    }
  }

  /**
   * Get user preferences from users/{uid}/settings/preferences.
   */
  static async getUserPreferences(uid: string): Promise<FirestorePreferences> {
    if (!db || !isFirebaseConfigured || !uid) {
      return { ...DEFAULT_FIRESTORE_PREFERENCES };
    }

    const path = `users/${uid}/settings/preferences`;
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

      await setDoc(docRef, {
        ...DEFAULT_FIRESTORE_PREFERENCES,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      return { ...DEFAULT_FIRESTORE_PREFERENCES };
    } catch (error) {
      console.warn('[Firestore] Error loading preferences:', formatFirestoreError(error, OperationType.GET, path));
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

    const path = `users/${uid}/settings/preferences`;
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'preferences');
      await setDoc(
        docRef,
        stripUndefined({
          ...preferences,
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    } catch (error: any) {
      console.warn('[Firestore] Note: Could not save preferences:', formatFirestoreError(error, OperationType.WRITE, path));
      if (error?.code !== 'permission-denied') {
        throw error;
      }
    }
  }
}
