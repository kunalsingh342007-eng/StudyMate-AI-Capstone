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
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (dataUrl: string, mimeType: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updatePreferences: (data: Partial<FirestorePreferences>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isDemoMode = false;

  // Clean up any lingering demo state from previous sessions
  useEffect(() => {
    localStorage.removeItem('studymate_demo_mode_active');
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return StorageService.getUserProfile();
  });

  const [preferences, setPreferences] = useState<FirestorePreferences>(DEFAULT_FIRESTORE_PREFERENCES);

  // Initialize theme from localStorage fallback immediately to prevent flash
  const [themeState, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studymate_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return DEFAULT_FIRESTORE_PREFERENCES.theme || 'system';
  });

  // Keep AuthContext userProfile synchronized with user-scoped StorageService changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUserProfile(StorageService.getUserProfile());
    };
    window.addEventListener('studymate_storage_change', handleStorageChange);
    return () => window.removeEventListener('studymate_storage_change', handleStorageChange);
  }, []);

  // Synchronize profile, study plans, and preferences when a user signs in via Firebase
  const loadUserData = useCallback(async (user: User) => {
    StorageService.setActiveUser(user.uid);
    const localProfile = StorageService.getUserProfile();
    const localAvatar = StorageService.getProfileAvatar();
    const localPlans = StorageService.getSavedPlans();

    const baseProfile: UserProfile = {
      ...localProfile,
      id: user.uid,
      name:
        (localProfile.id === user.uid && localProfile.name && localProfile.name !== 'Student'
          ? localProfile.name
          : user.displayName || user.email?.split('@')[0]) || 'Student',
      email: user.email || localProfile.email || '',
      avatarUrl: localProfile.avatarRemoved
        ? undefined
        : localAvatar || localProfile.avatarUrl || user.photoURL || undefined,
      onboardingCompleted: Boolean(localProfile.onboardingCompleted || localPlans.length > 0),
      onboardingStep: typeof localProfile.onboardingStep === 'number' ? localProfile.onboardingStep : 0,
      subjects: Array.isArray(localProfile.subjects) ? localProfile.subjects : [],
      weakTopics: Array.isArray(localProfile.weakTopics) ? localProfile.weakTopics : [],
      preferredStudyDays: Array.isArray(localProfile.preferredStudyDays) ? localProfile.preferredStudyDays : [],
    };

    setUserProfile(baseProfile);
    StorageService.saveUserProfile(baseProfile);

    try {
      const [remoteProfile, remoteAvatar, remotePlans, userPrefs] = await Promise.all([
        FirestoreService.getUserProfile(user.uid),
        FirestoreService.getUserAvatar(user.uid),
        FirestoreService.getStudyPlans(user.uid),
        FirestoreService.getUserPreferences(user.uid),
      ]);

      // Sync study plans between Firestore and user-scoped localStorage
      if (remotePlans.length > 0) {
        StorageService.replaceSavedPlans(remotePlans);
      } else if (localPlans.length > 0) {
        await Promise.all(
          localPlans.map((p) => FirestoreService.saveStudyPlan(user.uid, p).catch(() => {}))
        );
      }

      const hasAnyPlans = remotePlans.length > 0 || localPlans.length > 0;

      if (!remoteProfile) {
        const cleanInitialProfile: UserProfile = {
          ...baseProfile,
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Student',
          email: user.email || '',
          avatarUrl: baseProfile.avatarRemoved
            ? undefined
            : remoteAvatar || localAvatar || user.photoURL || undefined,
          streakDays: 0,
          totalStudyMinutes: 0,
          quizzesCompleted: 0,
          onboardingCompleted: hasAnyPlans || Boolean(baseProfile.onboardingCompleted),
          onboardingStep: baseProfile.onboardingStep || 0,
        };
        if (remoteAvatar && !cleanInitialProfile.avatarRemoved) {
          StorageService.saveProfileAvatar(remoteAvatar);
        }
        setUserProfile(cleanInitialProfile);
        StorageService.saveUserProfile(cleanInitialProfile);
        await FirestoreService.saveUserProfile(user.uid, cleanInitialProfile).catch(() => {});
      } else {
        const isRemoved = Boolean(remoteProfile.avatarRemoved);
        const resolvedAvatar = isRemoved
          ? undefined
          : remoteAvatar || localAvatar || remoteProfile.avatarUrl || user.photoURL || undefined;

        if (remoteAvatar && !isRemoved) {
          StorageService.saveProfileAvatar(remoteAvatar);
        } else if (isRemoved) {
          StorageService.removeProfileAvatar();
        }

        const mergedProfile: UserProfile = {
          ...baseProfile,
          ...remoteProfile,
          id: user.uid,
          email: remoteProfile.email || user.email || '',
          avatarUrl: resolvedAvatar,
          avatarRemoved: isRemoved,
          onboardingCompleted: Boolean(
            remoteProfile.onboardingCompleted || baseProfile.onboardingCompleted || hasAnyPlans
          ),
        };
        setUserProfile(mergedProfile);
        StorageService.saveUserProfile(mergedProfile);
      }

      if (userPrefs) {
        setPreferences(userPrefs);
        if (userPrefs.theme) {
          setThemeState(userPrefs.theme);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('studymate_theme', userPrefs.theme);
          }
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Note on Firestore sync:', err);
    }
  }, []);

  // Listen to Firebase auth state observer
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      StorageService.setActiveUser(user ? user.uid : null);
      setCurrentUser(user);
      if (user) {
        await loadUserData(user);
      } else {
        setUserProfile(StorageService.getUserProfile());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // Centralized immediate theme applicator
  const applyResolvedTheme = useCallback((targetTheme: 'light' | 'dark' | 'system') => {
    let isDark = false;
    if (targetTheme === 'dark') {
      isDark = true;
    } else if (targetTheme === 'system') {
      isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Immediate theme switch handler
  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studymate_theme', newTheme);
    }
    applyResolvedTheme(newTheme);

    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    if (currentUser?.uid) {
      FirestoreService.saveUserPreferences(currentUser.uid, { theme: newTheme }).catch(() => {});
    }
  }, [currentUser, applyResolvedTheme]);

  // Listen to system OS preference changes
  useEffect(() => {
    applyResolvedTheme(themeState);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeState === 'system') {
        applyResolvedTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeState, applyResolvedTheme]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      await loadUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await AuthService.loginWithGoogle();
      await loadUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterUserData) => {
    setLoading(true);
    try {
      const user = await AuthService.register(data);
      StorageService.setActiveUser(user.uid);

      const initialProfile: Partial<UserProfile> = {
        id: user.uid,
        name: data.displayName || 'Student',
        email: data.email,
        academicLevel: data.academicLevel || '',
        institution: data.institution || '',
        targetExam: data.targetExam || '',
        dailyGoalHours: 0,
        streakDays: 0,
        totalStudyMinutes: 0,
        quizzesCompleted: 0,
        onboardingCompleted: false,
        onboardingStep: 0,
        subjects: [],
        weakTopics: [],
        preferredStudyDays: [],
      };
      StorageService.saveUserProfile(initialProfile);
      await FirestoreService.saveUserProfile(user.uid, initialProfile).catch(() => {});
      await loadUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      StorageService.setActiveUser(null);
      setCurrentUser(null);
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
    // Demo mode removed - no-op
  };

  const exitDemoMode = () => {
    // Demo mode removed - no-op
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const cleanPatch: Partial<UserProfile> = {};
    (Object.keys(data) as (keyof UserProfile)[]).forEach((key) => {
      if (data[key] !== undefined) {
        (cleanPatch as Record<string, unknown>)[key] = data[key];
      }
    });

    const updated = StorageService.saveUserProfile(cleanPatch);
    setUserProfile(updated);

    if (currentUser?.uid) {
      await FirestoreService.saveUserProfile(currentUser.uid, cleanPatch);
    }
  };

  const uploadAvatar = async (dataUrl: string, mimeType: string) => {
    StorageService.saveProfileAvatar(dataUrl);
    setUserProfile(StorageService.getUserProfile());

    if (currentUser?.uid) {
      await Promise.all([
        FirestoreService.saveUserAvatar(currentUser.uid, dataUrl, mimeType),
        FirestoreService.saveUserProfile(currentUser.uid, { avatarRemoved: false }),
      ]);
    }
  };

  const removeAvatar = async () => {
    StorageService.removeProfileAvatar();
    setUserProfile(StorageService.getUserProfile());

    if (currentUser?.uid) {
      await Promise.all([
        FirestoreService.deleteUserAvatar(currentUser.uid),
        FirestoreService.saveUserProfile(currentUser.uid, { avatarRemoved: true, avatarUrl: '' }),
      ]);
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
    setUserProfile(StorageService.getUserProfile());
  };

  const isAuthenticated = useMemo(() => {
    return !!currentUser;
  }, [currentUser]);

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    preferences,
    loading,
    isDemoMode,
    isFirebaseConfigured,
    isAuthenticated,
    theme: themeState,
    setTheme,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    enterDemoMode,
    exitDemoMode,
    updateProfile,
    uploadAvatar,
    removeAvatar,
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
