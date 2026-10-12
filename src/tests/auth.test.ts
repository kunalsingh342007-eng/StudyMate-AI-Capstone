import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/firebase/authService';
import {
  DEFAULT_FIRESTORE_PREFERENCES,
  FirestorePreferences,
} from '../services/firebase/firestoreService';

describe('Firebase Authentication Service & Error Mapping', () => {
  it('maps auth/email-already-in-use to friendly instructional message', () => {
    const error = { code: 'auth/email-already-in-use', message: 'Email in use' };
    const friendly = AuthService.getFriendlyErrorMessage(error);
    expect(friendly).toContain('already exists');
    expect(friendly).toContain('sign in instead');
  });

  it('maps auth/wrong-password and auth/invalid-credential to helpful credential guidance', () => {
    const wrongPass = AuthService.getFriendlyErrorMessage({ code: 'auth/wrong-password' });
    const invalidCred = AuthService.getFriendlyErrorMessage({ code: 'auth/invalid-credential' });

    expect(wrongPass).toContain('Incorrect email or password');
    expect(invalidCred).toContain('Incorrect email or password');
  });

  it('maps auth/weak-password to minimum length guidance', () => {
    const friendly = AuthService.getFriendlyErrorMessage({ code: 'auth/weak-password' });
    expect(friendly).toContain('at least 6 characters');
  });

  it('maps auth/too-many-requests to rate limit notification', () => {
    const friendly = AuthService.getFriendlyErrorMessage({ code: 'auth/too-many-requests' });
    expect(friendly).toContain('Too many unsuccessful attempts');
  });

  it('maps auth/network-request-failed to network connection advice', () => {
    const friendly = AuthService.getFriendlyErrorMessage({ code: 'auth/network-request-failed' });
    expect(friendly).toContain('Network connection issue');
  });
});

describe('Firestore User Preferences & Data Model Validation', () => {
  it('provides safe default preferences adhering strictly to the data model', () => {
    const prefs: FirestorePreferences = { ...DEFAULT_FIRESTORE_PREFERENCES };

    expect(prefs.theme).toBe('light');
    expect(prefs.dailyStudyGoalMinutes).toBe(180);
    expect(prefs.defaultStudyDurationMinutes).toBe(45);
    expect(prefs.studyRemindersEnabled).toBe(true);
    expect(prefs.examRemindersEnabled).toBe(true);
    expect(prefs.interfaceLanguage).toBe('English');
    expect(prefs.preferredStudyDays).toContain('Mon');
  });

  it('strictly validates allowed themes in preferences', () => {
    const validThemes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    expect(validThemes).toContain(DEFAULT_FIRESTORE_PREFERENCES.theme);
  });
});

describe('Zero-Trust Security Boundary Logic', () => {
  // Simulate Firestore security rule evaluation logic:
  // allow read, write: if request.auth != null && request.auth.uid == userId;
  function evaluateUserDocRule(
    requestAuth: { uid: string } | null,
    targetUserId: string,
    operation: 'read' | 'write'
  ): boolean {
    if (!requestAuth) return false; // unauthenticated rejected
    if (requestAuth.uid !== targetUserId) return false; // cross-user access rejected
    return true; // authorized owner allowed
  }

  it('denies unauthenticated read/write to users/{uid}', () => {
    const allowed = evaluateUserDocRule(null, 'user-123', 'read');
    expect(allowed).toBe(false);
  });

  it('denies cross-user unauthorized access when auth.uid does not match target document', () => {
    const attackerAuth = { uid: 'attacker-456' };
    const victimUserId = 'victim-123';

    const canRead = evaluateUserDocRule(attackerAuth, victimUserId, 'read');
    const canWrite = evaluateUserDocRule(attackerAuth, victimUserId, 'write');

    expect(canRead).toBe(false);
    expect(canWrite).toBe(false);
  });

  it('permits authorized owner access to their own document', () => {
    const validUserAuth = { uid: 'student-789' };
    const ownUserId = 'student-789';

    const canRead = evaluateUserDocRule(validUserAuth, ownUserId, 'read');
    const canWrite = evaluateUserDocRule(validUserAuth, ownUserId, 'write');

    expect(canRead).toBe(true);
    expect(canWrite).toBe(true);
  });
});
