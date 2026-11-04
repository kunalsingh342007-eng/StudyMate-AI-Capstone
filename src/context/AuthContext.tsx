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

  // Synchronize profile and preferences when a user signs in via Firebase
  const loadUserData = useCallback(async (user: User) => {
    // 1. Immediately create and set local user profile so UI is instant and doesn't get stuck
    const fallbackProfile: UserProfile = {
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

    setUserProfile(fallbackProfile);
    StorageService.saveUserProfile(fallbackProfile);

    // 2. Fetch or save to Cloud Firestore if available
    try {
      let profile = await FirestoreService.getUserProfile(user.uid);
      if (!profile) {
        profile = fallbackProfile;
        await FirestoreService.saveUserProfile(user.uid, profile).catch(() => {});
      } else {
        setUserProfile(profile);
        StorageService.saveUserProfile(profile);
      }

      // Load Firestore user preferences
      const userPrefs = await FirestoreService.getUserPreferences(user.uid);
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

      // Save initial profile in Firestore (non-fatal if Firestore rules are pending)
      const initialProfile: Partial<UserProfile> = {
        name: data.displayName || 'Student',
        email: data.email,
        academicLevel: data.academicLevel || 'Undergraduate Senior',
        institution: data.institution || '',
        targetExam: data.targetExam || 'Semester Finals',
        dailyGoalHours: 3,
      };
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
