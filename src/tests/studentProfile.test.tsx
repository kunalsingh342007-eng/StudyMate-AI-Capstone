import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../pages/ProfilePage';
import { ToastProvider } from '../context/ToastContext';
import { StorageService } from '../services/storage/storageService';
import { UserProfile } from '../types';
import {
  calculateBoardPercentage,
  calculateProfileCompletion,
  processProfileImageUpload,
  transitionGoalStatus,
  validateAcademicBoardRecord,
  validateAvatarFile,
  validateProfileYears,
  validateSemesterResult,
} from '../services/learning/profileUtils';

let mockCurrentUser: { uid: string; email: string; emailVerified: boolean } | null = null;
let mockUpdateProfileImpl: (data: Partial<UserProfile>) => Promise<void>;
let mockUploadAvatarImpl: (dataUrl: string, mimeType: string) => Promise<void>;
let mockRemoveAvatarImpl: () => Promise<void>;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    userProfile: StorageService.getUserProfile(),
    preferences: StorageService.getPreferences(),
    loading: false,
    updateProfile: (data: Partial<UserProfile>) => mockUpdateProfileImpl(data),
    uploadAvatar: (dataUrl: string, mimeType: string) => mockUploadAvatarImpl(dataUrl, mimeType),
    removeAvatar: () => mockRemoveAvatarImpl(),
    updatePreferences: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    enterDemoMode: vi.fn(),
    exitDemoMode: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}));

const renderProfilePage = (initialRoute = '/profile') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <ProfilePage />
      </ToastProvider>
    </MemoryRouter>
  );

describe('Student Profile Upgrade — Data Integrity, Persistence, Validation & Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.setActiveUser(null);
    mockCurrentUser = null;
    mockUpdateProfileImpl = async (data: Partial<UserProfile>) => {
      StorageService.saveUserProfile(data);
    };
    mockUploadAvatarImpl = async (dataUrl: string) => {
      StorageService.saveProfileAvatar(dataUrl);
    };
    mockRemoveAvatarImpl = async () => {
      StorageService.removeProfileAvatar();
    };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a brand new user with empty academic records, goals, skills, and 0% completion', () => {
    StorageService.setActiveUser('fresh-student-1');
    const emptyProfile = StorageService.getUserProfile();
    expect(calculateProfileCompletion(emptyProfile).percentage).toBe(0);

    renderProfilePage();
    expect(screen.getByText('0%')).toBeDefined();

    // Switch to Academics tab -> shows empty state
    fireEvent.click(screen.getByRole('tab', { name: /Academics/i }));
    expect(screen.getByText(/No academic records added yet/i)).toBeDefined();

    // Switch to Goals tab -> shows 0 completed and empty personal goals
    fireEvent.click(screen.getByRole('tab', { name: /Goals/i }));
    expect(screen.getByText(/No goals created yet/i)).toBeDefined();
    expect(screen.getByText('0 Completed')).toBeDefined();

    // Switch to Skills & Projects tab -> shows empty skills/projects
    fireEvent.click(screen.getByRole('tab', { name: /Skills & Projects/i }));
    expect(screen.getByText(/No skills added yet/i)).toBeDefined();
    expect(screen.getByText(/No projects added yet/i)).toBeDefined();
  });

  it('saves and edits personal, location, academic enrollment, and career details cleanly', async () => {
    StorageService.setActiveUser('student-edit-1');
    renderProfilePage();

    fireEvent.click(screen.getByRole('button', { name: /Edit Overview/i }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Riya Deshmukh' },
    });
    fireEvent.change(screen.getByLabelText(/Preferred Name/i), {
      target: { value: 'Riya' },
    });
    fireEvent.change(screen.getByLabelText(/College \/ University/i), {
      target: { value: 'IIT Bombay' },
    });
    fireEvent.change(screen.getByLabelText(/^Degree$/i), {
      target: { value: 'B.Tech' },
    });
    fireEvent.change(screen.getByLabelText(/Branch \/ Major/i), {
      target: { value: 'Computer Science' },
    });
    fireEvent.change(screen.getByLabelText(/Current Academic Year/i), {
      target: { value: '3rd Year' },
    });
    fireEvent.change(screen.getByLabelText(/Current Semester/i), {
      target: { value: 'Semester 6' },
    });
    fireEvent.change(screen.getByLabelText(/^City$/i), {
      target: { value: 'Mumbai' },
    });
    fireEvent.change(screen.getByLabelText(/State \/ Province/i), {
      target: { value: 'Maharashtra' },
    });
    fireEvent.change(screen.getByLabelText(/^Country$/i), {
      target: { value: 'India' },
    });
    fireEvent.change(screen.getByLabelText(/Admission Year/i), {
      target: { value: '2023' },
    });
    fireEvent.change(screen.getByLabelText(/Expected Graduation Year/i), {
      target: { value: '2027' },
    });
    fireEvent.change(screen.getByLabelText(/Career Interest/i), {
      target: { value: 'Distributed Systems' },
    });
    fireEvent.change(screen.getByLabelText(/Short Bio/i), {
      target: { value: 'Focusing on systems programming and compilers.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Overview/i }));

    await waitFor(() => {
      const saved = StorageService.getUserProfile();
      expect(saved.name).toBe('Riya Deshmukh');
      expect(saved.preferredName).toBe('Riya');
      expect(saved.institution).toBe('IIT Bombay');
      expect(saved.degree).toBe('B.Tech');
      expect(saved.city).toBe('Mumbai');
      expect(saved.admissionYear).toBe(2023);
      expect(saved.expectedGraduationYear).toBe(2027);
    });

    expect(screen.getAllByText(/Riya Deshmukh/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mumbai, Maharashtra, India/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Distributed Systems/i).length).toBeGreaterThan(0);
  });

  it('adds, edits, and deletes multiple semester records without overwriting Class 10 or Class 12 data', async () => {
    StorageService.setActiveUser('student-acad-1');
    renderProfilePage('/profile?tab=academics');

    // Add Class 10
    fireEvent.click(screen.getByRole('button', { name: /Add Class 10/i }));
    fireEvent.change(screen.getByLabelText(/^Board$/i), { target: { value: 'CBSE' } });
    fireEvent.change(screen.getByLabelText(/School Name/i), {
      target: { value: 'Kendriya Vidyalaya' },
    });
    fireEvent.change(screen.getByLabelText(/Passing Year/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/Marks Obtained/i), { target: { value: '462' } });
    fireEvent.change(screen.getByLabelText(/Maximum Marks/i), { target: { value: '500' } });

    // Auto-calculated percentage preview in input
    const pctInput = screen.getByLabelText(/Percentage/i) as HTMLInputElement;
    expect(pctInput.value).toBe('92.4');

    fireEvent.click(screen.getByRole('button', { name: /Save Academic Record/i }));

    await waitFor(() => {
      expect(StorageService.getUserProfile().secondaryEducation?.percentage).toBe(92.4);
    });

    // Add Semester 1 & Semester 2
    fireEvent.click(screen.getByRole('button', { name: /Add Semester/i }));
    fireEvent.change(screen.getByLabelText(/^Semester/i), { target: { value: 'Semester 1' } });
    fireEvent.change(screen.getByLabelText(/^SGPA/i), { target: { value: '8.8' } });
    fireEvent.change(screen.getByLabelText(/^CGPA/i), { target: { value: '8.8' } });
    fireEvent.change(screen.getByLabelText(/Credits Earned/i), { target: { value: '22' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Semester/i }));

    await waitFor(() => {
      expect(StorageService.getUserProfile().semesterResults).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Semester/i }));
    fireEvent.change(screen.getByLabelText(/^Semester/i), { target: { value: 'Semester 2' } });
    fireEvent.change(screen.getByLabelText(/^SGPA/i), { target: { value: '9.1' } });
    fireEvent.change(screen.getByLabelText(/^CGPA/i), { target: { value: '8.95' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Semester/i }));

    await waitFor(() => {
      expect(StorageService.getUserProfile().semesterResults).toHaveLength(2);
    });

    // Edit Semester 1
    fireEvent.click(screen.getByRole('button', { name: /Edit Semester 1/i }));
    fireEvent.change(screen.getByLabelText(/^SGPA/i), { target: { value: '8.9' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Semester/i }));

    await waitFor(() => {
      const sems = StorageService.getUserProfile().semesterResults || [];
      expect(sems.find((s) => s.semester === 'Semester 1')?.sgpa).toBe(8.9);
    });

    // Delete Semester 2 and confirm Class 10 remains untouched
    fireEvent.click(screen.getByRole('button', { name: /Delete Semester 2/i }));
    await waitFor(() => {
      const saved = StorageService.getUserProfile();
      expect(saved.semesterResults).toHaveLength(1);
      expect(saved.secondaryEducation?.board).toBe('CBSE');
      expect(saved.secondaryEducation?.percentage).toBe(92.4);
    });
  });

  it('validates percentage bounds, marks <= maximumMarks, SGPA/CGPA ranges, and graduation years', () => {
    expect(calculateBoardPercentage(462, 500)).toBe(92.4);
    expect(calculateBoardPercentage(510, 500)).toBeUndefined();
    expect(calculateBoardPercentage(-10, 500)).toBeUndefined();
    expect(calculateBoardPercentage(80, 0)).toBeUndefined();

    expect(
      validateAcademicBoardRecord({
        board: 'CBSE',
        school: 'ABC School',
        marksObtained: 520,
        maximumMarks: 500,
      })
    ).toContain('Marks obtained cannot exceed maximum marks.');

    expect(
      validateAcademicBoardRecord({
        board: 'CBSE',
        school: 'ABC School',
        marksObtained: -5,
        maximumMarks: 500,
      })
    ).toContain('Marks obtained cannot be negative.');

    expect(
      validateSemesterResult({
        semester: 'Semester 3',
        sgpa: 10.5,
        cgpa: -1,
      })
    ).toEqual(
      expect.arrayContaining([
        'SGPA must be between 0 and 10.',
        'CGPA must be between 0 and 10.',
      ])
    );

    expect(validateProfileYears(2025, 2023)).toContain(
      'Expected graduation year cannot be earlier than admission year.'
    );
  });

  it('supports creating, tracking steps without auto-completing, completing, reopening, and undoing goals', async () => {
    StorageService.setActiveUser('student-goals-1');
    renderProfilePage('/profile?tab=goals');

    fireEvent.click(screen.getByRole('button', { name: /Add Goal/i }));
    fireEvent.change(screen.getByLabelText(/Goal Title/i), {
      target: { value: 'Finish Graph Algorithms Module' },
    });
    fireEvent.change(screen.getByLabelText(/Total Steps/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/Completed Steps/i), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Goal/i }));

    await waitFor(() => {
      expect(StorageService.getUserProfile().goals).toHaveLength(1);
    });

    // Advance steps to 2/2 -> must NOT auto-complete without user confirmation
    fireEvent.click(
      screen.getByRole('button', { name: /Increase progress for Finish Graph Algorithms Module/i })
    );
    await waitFor(() => {
      expect(StorageService.getUserProfile().goals?.[0].completedSteps).toBe(1);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Increase progress for Finish Graph Algorithms Module/i })
    );
    await waitFor(() => {
      const g = StorageService.getUserProfile().goals?.[0];
      expect(g?.completedSteps).toBe(2);
      expect(g?.status).toBe('In Progress');
    });

    // Explicit completion confirmation moves goal to Completed section
    fireEvent.click(screen.getByRole('button', { name: /Confirm Completion/i }));
    await waitFor(() => {
      const g = StorageService.getUserProfile().goals?.[0];
      expect(g?.status).toBe('Completed');
      expect(g?.completedAt).toBeTruthy();
    });
    expect(screen.getByText('1 Completed')).toBeDefined();

    // Reopen goal moves it back out of Completed and clears completedAt
    fireEvent.click(screen.getByRole('button', { name: /Reopen/i }));
    await waitFor(() => {
      const g = StorageService.getUserProfile().goals?.[0];
      expect(g?.status).toBe('In Progress');
      expect(g?.completedAt).toBeUndefined();
    });

    // Pure transitionGoalStatus helper check
    const done = transitionGoalStatus(StorageService.getUserProfile().goals![0], 'Completed', {
      completedAt: '2026-10-01',
    });
    expect(done.completedAt).toBe('2026-10-01');
    const reopened = transitionGoalStatus(done, 'Paused');
    expect(reopened.completedAt).toBeUndefined();
  });

  it('validates profile picture file types/sizes and supports upload, preview, change, and removal', async () => {
    expect(validateAvatarFile({ type: 'application/pdf', size: 1024 }).valid).toBe(false);
    expect(
      validateAvatarFile({ type: 'image/jpeg', size: 3 * 1024 * 1024 }).valid
    ).toBe(false);
    expect(validateAvatarFile({ type: 'image/png', size: 1024 }).valid).toBe(true);

    const badFile = new File(['hello'], 'resume.pdf', { type: 'application/pdf' });
    await expect(processProfileImageUpload(badFile)).rejects.toThrow(/JPG, PNG, or WebP/i);

    StorageService.setActiveUser('student-avatar-1');
    StorageService.saveUserProfile({ name: 'Kunal Singh' });
    renderProfilePage();

    // Mock FileReader and Image for deterministic jsdom image upload
    const originalFileReader = window.FileReader;
    const originalImage = window.Image;
    class MockFileReader {
      result: string | null = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    class MockImage {
      width = 120;
      height = 120;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    (window as any).FileReader = MockFileReader;
    (window as any).Image = MockImage;

    const input = screen.getByLabelText(/Upload profile picture/i) as HTMLInputElement;
    const validPng = new File(['png-bytes'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [validPng] } });

    await waitFor(() => {
      const img = screen.getByAltText(/Kunal Singh profile/i) as HTMLImageElement;
      expect(img.src).toContain('data:image/png;base64');
    });

    // Remove photo restores initials and clears avatar
    fireEvent.click(screen.getByRole('button', { name: /Remove profile picture/i }));
    await waitFor(() => {
      expect(screen.queryByAltText(/Kunal Singh profile/i)).toBeNull();
      expect(StorageService.getProfileAvatar()).toBeNull();
      expect(StorageService.getUserProfile().avatarRemoved).toBe(true);
    });

    (window as any).FileReader = originalFileReader;
    (window as any).Image = originalImage;
  });

  it('persists profile across reloads and displays honest error state if cloud save fails', async () => {
    StorageService.setActiveUser('student-persist-1');
    StorageService.saveUserProfile({
      name: 'Neha Verma',
      degree: 'B.Sc',
      branch: 'Physics',
      skills: [{ id: 'sk-1', name: 'Python', category: 'Technical', proficiency: 'Advanced' }],
    });

    const { unmount } = renderProfilePage();
    expect(screen.getAllByText(/Neha Verma/i).length).toBeGreaterThan(0);
    unmount();

    // Simulate reload
    renderProfilePage('/profile?tab=portfolio');
    expect(screen.getByText('Python')).toBeDefined();

    // Simulate cloud save failure on Links save
    mockCurrentUser = { uid: 'student-persist-1', email: 'neha@example.edu', emailVerified: true };
    mockUpdateProfileImpl = async () => {
      throw new Error('Firestore permission denied');
    };

    fireEvent.click(screen.getByRole('button', { name: /Edit Links/i }));
    fireEvent.change(screen.getByLabelText(/GitHub URL/i), {
      target: { value: 'https://github.com/neha-physics' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Links/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(
        alerts.some((el) => /Firestore permission denied/i.test(el.textContent || ''))
      ).toBe(true);
    });
  });

  it('strictly isolates student profile details, academic history, goals, skills, and avatar between accounts', () => {
    StorageService.setActiveUser('account-one');
    StorageService.saveUserProfile({
      name: 'Account One',
      institution: 'University Alpha',
      secondaryEducation: {
        board: 'ICSE',
        school: 'St. Xavier',
        passingYear: 2019,
        marksObtained: 475,
        maximumMarks: 500,
        percentage: 95,
      },
      goals: [
        {
          id: 'g-one',
          title: 'Publish Research Paper',
          category: 'Academic',
          status: 'In Progress',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    });
    StorageService.saveProfileAvatar('data:image/png;base64,ACCOUNT_ONE_AVATAR');

    // Switch to account two -> completely clean
    StorageService.setActiveUser('account-two');
    const two = StorageService.getUserProfile();
    expect(two.name).toBe('Student');
    expect(two.institution).toBe('');
    expect(two.secondaryEducation).toBeUndefined();
    expect(two.goals).toEqual([]);
    expect(StorageService.getProfileAvatar()).toBeNull();

    // Switch back to account one -> all data intact
    StorageService.setActiveUser('account-one');
    const restored = StorageService.getUserProfile();
    expect(restored.institution).toBe('University Alpha');
    expect(restored.secondaryEducation?.percentage).toBe(95);
    expect(restored.goals).toHaveLength(1);
    expect(StorageService.getProfileAvatar()).toBe('data:image/png;base64,ACCOUNT_ONE_AVATAR');
  });
});
