import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { PlannerPage } from '../pages/PlannerPage';
import { ExplainPage } from '../pages/ExplainPage';
import { QuizPage } from '../pages/QuizPage';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { ToastProvider } from '../context/ToastContext';
import { StorageService } from '../services/storage/storageService';
import { MasteryEngine } from '../services/learning/masteryEngine';
import { ApiClient } from '../services/api/apiClient';
import { StudyPlan } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    userProfile: StorageService.getUserProfile(),
    preferences: StorageService.getPreferences(),
    loading: false,
    updateProfile: vi.fn().mockResolvedValue(undefined),
    updatePreferences: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    logout: vi.fn(),
    sendVerificationEmail: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
};

describe('User-First Onboarding, Empty States, Review Flow & Data Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.setActiveUser(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows truthful empty workspace and zero hardcoded CS defaults for a brand new user', () => {
    StorageService.setActiveUser('brand-new-user-1');

    // MasteryEngine returns empty array when no plan or masteries exist
    expect(MasteryEngine.buildKnowledgeTree(null, {})).toEqual([]);

    // Progress starts at 0 streak, 0 hours, no fabricated dates
    const initialProgress = StorageService.getProgress();
    expect(initialProgress.streakDays).toBe(0);
    expect(initialProgress.completedTasksCount).toBe(0);
    expect(initialProgress.totalHoursStudied).toBe(0);

    // Dashboard shows onboarding CTA first, and exploring workspace reveals truthful empty states
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('button', { name: /Create My Study Plan/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Explore empty workspace first/i }));

    expect(screen.getByText('No tasks yet')).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Create Task/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('Your study plan starts here')).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Build Schedule/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('0 Days')).toBeDefined();
    expect(screen.getByText('Not set')).toBeDefined();
    expect(screen.getByText(/Recommendations appear only when there is enough/i)).toBeDefined();
  });

  it('ExplainPage and QuizPage initialize blank without hardcoded Recursion or Data Structures defaults', () => {
    StorageService.setActiveUser('non-cs-user');

    const { unmount } = render(
      <BrowserRouter>
        <ToastProvider>
          <ExplainPage />
        </ToastProvider>
      </BrowserRouter>
    );
    const explainInput = screen.getByLabelText(/Concept or Question/i) as HTMLInputElement;
    expect(explainInput.value).toBe('');
    expect(screen.queryByText('Recursion & Call Stacks')).toBeNull();
    unmount();

    render(
      <BrowserRouter>
        <ToastProvider>
          <QuizPage />
        </ToastProvider>
      </BrowserRouter>
    );
    const quizSubjectInput = screen.getByLabelText(/^Subject$/i) as HTMLInputElement;
    const quizTopicInput = screen.getByLabelText(/^Topic/i) as HTMLInputElement;
    expect(quizSubjectInput.value).toBe('');
    expect(quizTopicInput.value).toBe('');
  });

  it('completes progressive onboarding with skippable optional steps, saves partial progress, and requires draft acceptance before saving', async () => {
    StorageService.setActiveUser('onboarding-user');

    const mockGeneratedPlan: StudyPlan = {
      id: 'ai-plan-bio-1',
      subject: 'Molecular Biology',
      examDate: '2026-08-20',
      dailyHours: 2,
      level: 'Intermediate',
      topics: ['Cell Signaling', 'DNA Replication'],
      weakTopics: [],
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      totalDays: 10,
      totalStudyHours: 10,
      assumptions: ['Generated from Molecular Biology inputs'],
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'bio-t1',
          day: 'Monday',
          date: '2026-08-01',
          topic: 'Cell Signaling',
          subtopic: 'Receptor tyrosine kinases',
          durationMinutes: 60,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Trace phosphorylation cascades',
          revisionTask: 'Draw signaling pathway diagram',
          practiceRecommendation: 'Answer 4 pathway questions',
          status: 'pending',
        },
      ],
    };

    const generateSpy = vi
      .spyOn(ApiClient, 'generateStudyPlan')
      .mockResolvedValueOnce(mockGeneratedPlan);

    const onSaveProfileProgress = vi.fn();
    const onCompletePlan = vi.fn();

    render(
      <OnboardingFlow
        firstName="Asha"
        userProfile={StorageService.getUserProfile()}
        onSaveProfileProgress={onSaveProfileProgress}
        onCompletePlan={onCompletePlan}
        onSkipToWorkspace={vi.fn()}
      />
    );

    // Welcome screen
    fireEvent.click(screen.getByRole('button', { name: /Create My Study Plan/i }));

    // Step 1 validation: empty subject blocked
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/at least one subject/i);

    // Enter Step 1 subjects
    fireEvent.change(screen.getByLabelText(/Subjects or Topics/i), {
      target: { value: 'Molecular Biology, Biochemistry' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    expect(onSaveProfileProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        subjects: ['Molecular Biology', 'Biochemistry'],
        onboardingStep: 2,
      })
    );

    // Step 2: target date & goal
    fireEvent.change(screen.getByLabelText(/Exam or Target Date/i), {
      target: { value: '2026-08-20' },
    });
    fireEvent.change(screen.getByLabelText(/Learning Goal/i), {
      target: { value: 'Score 90% on Biochemistry Midterm' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Step 3: daily hours
    fireEvent.change(screen.getByLabelText(/Daily Available Study Hours/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Step 4: skip optional weak topics
    fireEvent.click(screen.getByRole('button', { name: /Skip for now/i }));

    // Step 5: skip optional timetable -> triggers AI plan generation
    fireEvent.click(screen.getByRole('button', { name: /Skip & Generate Plan/i }));

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledTimes(1);
    });

    // Verify AI request received actual user inputs
    expect(generateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Molecular Biology & 1 more',
        topics: ['Molecular Biology', 'Biochemistry'],
        examDate: '2026-08-20',
        dailyHours: 2,
        learningGoal: 'Score 90% on Biochemistry Midterm',
      })
    );

    // PlanReviewPanel shown BEFORE saving
    expect(screen.getByText(/Review Your Proposed Study Plan/i)).toBeDefined();
    expect(onCompletePlan).not.toHaveBeenCalled();

    // Edit plan subject on review screen and accept
    const reviewSubjectInput = screen.getByLabelText(/Plan Subject \/ Focus/i);
    fireEvent.change(reviewSubjectInput, { target: { value: 'Molecular Biology Honors' } });
    fireEvent.click(screen.getByRole('button', { name: /Accept & Save Plan/i }));

    expect(onCompletePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Molecular Biology Honors',
      }),
      expect.objectContaining({
        onboardingCompleted: true,
        subjects: ['Molecular Biology', 'Biochemistry'],
      })
    );
  });

  it('handles AI failure honestly and provides transparent manual schedule creation and single-task creation', async () => {
    StorageService.setActiveUser('manual-fallback-user');

    vi.spyOn(ApiClient, 'generateStudyPlan').mockRejectedValueOnce(
      new Error('AI service is temporarily unavailable: missing API key.')
    );

    renderWithProviders(<PlannerPage />);

    // Form starts blank (no OS defaults)
    const subjectInput = screen.getByLabelText(/Subject or Course Name/i) as HTMLInputElement;
    expect(subjectInput.value).toBe('');

    fireEvent.change(subjectInput, { target: { value: 'European History' } });
    fireEvent.change(screen.getByLabelText(/Syllabus Topics or Units/i), {
      target: { value: 'Industrial Revolution, Treaty of Versailles' },
    });
    fireEvent.change(screen.getByLabelText(/Target Exam or Goal Date/i), {
      target: { value: '2026-09-10' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Draft Schedule/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => /unavailable/i.test(el.textContent || ''))).toBe(true);
    });

    // Ensure NO fabricated schedule was saved
    expect(StorageService.getActivePlan()).toBeNull();
    expect(StorageService.getSavedPlans()).toHaveLength(0);

    // Switch to Manual Schedule Builder from failure banner
    fireEvent.click(screen.getByRole('button', { name: /Create Schedule Manually/i }));
    expect(screen.getByText(/Build Your Schedule Directly/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Save Manual Schedule/i }));

    const savedPlan = StorageService.getActivePlan();
    expect(savedPlan).not.toBeNull();
    expect(savedPlan?.subject).toBe('European History');
    expect(savedPlan?.isManual).toBe(true);
    expect(savedPlan?.tasks).toHaveLength(2);

    // Create an additional single task via CreateTaskModal
    fireEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    fireEvent.change(screen.getByLabelText(/Task or Topic Name/i), {
      target: { value: '1920s Economic Reconstruction' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add Task$/i }));

    expect(StorageService.getActivePlan()?.tasks).toHaveLength(3);
  });

  it('skips onboarding for returning users who already have saved plans or onboardingCompleted', () => {
    StorageService.setActiveUser('returning-user-1');
    StorageService.setActivePlan({
      id: 'ret-plan-1',
      subject: 'Macroeconomics',
      examDate: '2026-07-22',
      dailyHours: 2,
      level: 'Intermediate',
      topics: ['Monetary Policy'],
      weakTopics: [],
      preferredDays: ['Monday'],
      totalDays: 1,
      totalStudyHours: 1,
      assumptions: [],
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'ret-t1',
          day: 'Monday',
          date: '2026-07-01',
          topic: 'Monetary Policy',
          subtopic: 'IS-LM Curve',
          durationMinutes: 60,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Analyze interest rate effects',
          revisionTask: 'Plot equilibrium shifts',
          practiceRecommendation: 'Solve 3 macro problems',
          status: 'pending',
        },
      ],
    });
    StorageService.saveUserProfile({
      name: 'Maya Lin',
      onboardingCompleted: true,
      subjects: ['Macroeconomics'],
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.queryByRole('button', { name: /Create My Study Plan/i })).toBeNull();
    expect(screen.getAllByText(/Macroeconomics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Monetary Policy/i).length).toBeGreaterThan(0);
  });

  it('isolates profiles, study plans, progress, and notes across different authenticated accounts', () => {
    StorageService.setActiveUser('user-alpha');
    StorageService.saveUserProfile({
      name: 'Alpha Student',
      subjects: ['Physics'],
      onboardingCompleted: true,
      timetable: 'Labs Tue/Thu 2pm-5pm',
    });
    StorageService.addTaskToActivePlan({
      subjectName: 'Physics',
      topic: 'Electromagnetism',
      durationMinutes: 60,
    });
    StorageService.saveNote({
      id: 'alpha-note-1',
      title: 'Maxwell Equations',
      subject: 'Physics',
      content: 'Gauss, Faraday, Ampere',
      tags: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    StorageService.setActiveUser('user-beta');
    expect(StorageService.getUserProfile().subjects).toEqual([]);
    expect(StorageService.getUserProfile().onboardingCompleted).toBe(false);
    expect(StorageService.getUserProfile().timetable).toBe('');
    expect(StorageService.getActivePlan()).toBeNull();
    expect(StorageService.getSavedPlans()).toEqual([]);
    expect(StorageService.getNotes()).toEqual([]);
    expect(StorageService.getProgress().streakDays).toBe(0);

    // Switch back to user-alpha and confirm full restoration
    StorageService.setActiveUser('user-alpha');
    expect(StorageService.getUserProfile().subjects).toEqual(['Physics']);
    expect(StorageService.getUserProfile().timetable).toBe('Labs Tue/Thu 2pm-5pm');
    expect(StorageService.getActivePlan()?.subject).toBe('Physics');
    expect(StorageService.getNotes()).toHaveLength(1);
  });
});
