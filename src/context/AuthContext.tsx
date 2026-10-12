import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/firebase';
import { AuthService, RegisterUserData } from '../services/firebase/authService';
import {
  FirestoreService,
  FirestorePreferences,
  DEFAULT_FIRESTORE_PREFERENCES,
} from '../services/firebase/firestoreService';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage/storageService';

interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile;
  preferences: FirestorePreferences;
  loading: boolean;
  isDemoMode: boolean;
  isFirebaseConfigured: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (data: Partial<FirestorePreferences>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const DEMO_STUDENT_PROFILE: UserProfile = {
  id: 'demo-student-alex',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  academicLevel: 'Undergraduate Senior',
  institution: 'School of Computer Science & Engineering',
  targetExam: 'Semester Finals / Tech Exam',
  targetExamDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
  bio: 'Computer Science senior focused on systems architecture, algorithm mastery, and operating systems.',
  dailyGoalHours: 3,
  streakDays: 7,
  totalStudyMinutes: 1590,
  quizzesCompleted: 14,
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STORAGE_KEY = 'studymate_demo_mode_active';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
      return DEMO_STUDENT_PROFILE;
    }
    return StorageService.getUserProfile();
  });

  const [preferences, setPreferences] = useState<FirestorePreferences>(DEFAULT_FIRESTORE_PREFERENCES);

  // Synchronize profile and preferences when a user signs in via Firebase
  const loadUserData = useCallback(async (user: User) => {
    try {
      let profile = await FirestoreService.getUserProfile(user.uid);
      if (!profile) {
        // Initialize user document for newly registered or first-time signed-in user
        profile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Student',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          academicLevel: 'Undergraduate Senior',
          institution: '',
          targetExam: 'Semester Finals',
          targetExamDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          bio: 'Student at StudyMate AI',
          dailyGoalHours: 3,
          streakDays: 1,
          totalStudyMinutes: 0,
          quizzesCompleted: 0,
        };
        await FirestoreService.saveUserProfile(user.uid, profile);
      }
      setUserProfile(profile);

      // Also persist to local StorageService for immediate sync across legacy components
      StorageService.saveUserProfile(profile);

      // Load Firestore user preferences
      const userPrefs = await FirestoreService.getUserPreferences(user.uid);
      setPreferences(userPrefs);
    } catch (err) {
      console.warn('[AuthContext] Error loading user Firestore data:', err);
    }
  }, []);

  // Listen to Firebase auth state observer
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoMode(false);
        localStorage.removeItem(DEMO_STORAGE_KEY);
        await loadUserData(user);
      } else {
        // When not signed into Firebase, check if demo mode was preserved
        if (localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
          setIsDemoMode(true);
          setUserProfile(DEMO_STUDENT_PROFILE);
        } else {
          setUserProfile(StorageService.getUserProfile());
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await loadUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterUserData) => {
    setLoading(true);
    try {
      const user = await AuthService.register(data);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);

      // Save initial profile in Firestore
      const initialProfile: Partial<UserProfile> = {
        name: data.displayName || 'Student',
        email: data.email,
        academicLevel: data.academicLevel || 'Undergraduate Senior',
        institution: data.institution || '',
        targetExam: data.targetExam || 'Semester Finals',
        dailyGoalHours: 3,
      };
      await FirestoreService.saveUserProfile(user.uid, initialProfile);
      await loadUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setCurrentUser(null);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setUserProfile(StorageService.getUserProfile());
      setPreferences(DEFAULT_FIRESTORE_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setUserProfile(DEMO_STUDENT_PROFILE);
    StorageService.saveUserProfile(DEMO_STUDENT_PROFILE);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUserProfile(StorageService.getUserProfile());
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    StorageService.saveUserProfile(updated);

    if (currentUser?.uid) {
      await FirestoreService.saveUserProfile(currentUser.uid, data);
    }
  };

  const updatePreferencesState = async (data: Partial<FirestorePreferences>) => {
    const updated = { ...preferences, ...data };
    setPreferences(updated);

    if (currentUser?.uid) {
      await FirestoreService.saveUserPreferences(currentUser.uid, data);
    }
  };

  const deleteAccount = async () => {
    await AuthService.deleteAccount();
    setCurrentUser(null);
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUserProfile(StorageService.getUserProfile());
  };

  const isAuthenticated = useMemo(() => {
    return !!currentUser || isDemoMode;
  }, [currentUser, isDemoMode]);

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    preferences,
    loading,
    isDemoMode,
    isFirebaseConfigured,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    enterDemoMode,
    exitDemoMode,
    updateProfile,
    updatePreferences: updatePreferencesState,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
