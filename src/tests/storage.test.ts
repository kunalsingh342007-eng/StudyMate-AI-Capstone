import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage/storageService';
import { StudyPlan, QuizResult } from '../types';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves active study plan', () => {
    const mockPlan: StudyPlan = {
      id: 'plan-101',
      subject: 'Data Structures',
      examDate: '2026-06-15',
      dailyHours: 2,
      level: 'Intermediate',
      topics: ['Linked Lists', 'Binary Trees'],
      weakTopics: ['Trees'],
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      totalDays: 14,
      totalStudyHours: 28,
      assumptions: ['Standard DSA scope'],
      tasks: [
        {
          id: 't-1',
          day: 'Day 1',
          date: '2026-05-01',
          topic: 'Linked Lists',
          subtopic: 'Singly vs Doubly',
          durationMinutes: 60,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Understand node pointers',
          revisionTask: 'Recite pointer updates',
          practiceRecommendation: 'Implement reverse linked list',
          status: 'pending',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    StorageService.setActivePlan(mockPlan);
    const retrieved = StorageService.getActivePlan();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('plan-101');
    expect(retrieved?.subject).toBe('Data Structures');
  });

  it('updates task status and recalculates progress', () => {
    const mockPlan: StudyPlan = {
      id: 'plan-102',
      subject: 'Algorithms',
      examDate: '2026-06-15',
      dailyHours: 2,
      level: 'Intermediate',
      topics: ['Binary Search'],
      weakTopics: [],
      preferredDays: ['Monday', 'Tuesday'],
      totalDays: 7,
      totalStudyHours: 14,
      assumptions: [],
      tasks: [
        {
          id: 't-1',
          day: 'Day 1',
          date: '2026-05-01',
          topic: 'Binary Search',
          subtopic: 'Upper/Lower bounds',
          durationMinutes: 60,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Implement binary search',
          revisionTask: 'Recite boundary conditions',
          practiceRecommendation: 'Solve 2 problems',
          status: 'pending',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    StorageService.setActivePlan(mockPlan);
    StorageService.updateTaskStatus('t-1', 'completed');

    const updatedPlan = StorageService.getActivePlan();
    expect(updatedPlan?.tasks[0].status).toBe('completed');

    const progress = StorageService.getProgress();
    expect(progress.completedTasksCount).toBe(1);
    expect(progress.streakDays).toBeGreaterThanOrEqual(1);
  });

  it('records quiz result and computes average scores', () => {
    const result1: QuizResult = {
      id: 'res-1',
      quizId: 'q-1',
      subject: 'CS',
      topic: 'Recursion',
      difficulty: 'Intermediate',
      score: 4,
      totalQuestions: 4,
      percentage: 100,
      userAnswers: { q1: 'A' },
      completedAt: new Date().toISOString(),
      improvementRecommendation: 'Great job!',
    };

    StorageService.saveQuizResult(result1);
    const history = StorageService.getQuizHistory();
    expect(history.length).toBe(1);

    const progress = StorageService.getProgress();
    expect(progress.quizzesTaken).toBe(1);
    expect(progress.averageQuizScore).toBe(100);
    expect(progress.masteredTopics).toContain('Recursion');
  });

  it('exports and restores data JSON cleanly', () => {
    const mockPlan: StudyPlan = {
      id: 'plan-backup',
      subject: 'Physics',
      examDate: '2026-06-20',
      dailyHours: 3,
      level: 'Advanced',
      topics: ['Thermodynamics'],
      weakTopics: [],
      preferredDays: ['Monday', 'Tuesday'],
      totalDays: 5,
      totalStudyHours: 15,
      assumptions: [],
      tasks: [],
      createdAt: new Date().toISOString(),
    };

    StorageService.setActivePlan(mockPlan);
    const exportedJson = StorageService.exportDataJson();
    expect(exportedJson).toContain('Physics');

    localStorage.clear();
    expect(StorageService.getActivePlan()).toBeNull();

    const success = StorageService.importDataJson(exportedJson);
    expect(success).toBe(true);
    expect(StorageService.getActivePlan()?.subject).toBe('Physics');
  });

  describe('User Account Data Isolation (Priority P0)', () => {
    it('isolates user study plans and notes between Account A and Account B', () => {
      // 1. Account A logs in and saves a plan
      StorageService.setActiveUser('user-alice-123');
      const alicePlan: StudyPlan = {
        id: 'plan-alice',
        subject: 'Algorithms (Alice)',
        examDate: '2026-06-01',
        dailyHours: 2,
        level: 'Advanced',
        topics: ['Dynamic Programming'],
        weakTopics: [],
        preferredDays: ['Monday'],
        totalDays: 5,
        totalStudyHours: 10,
        assumptions: [],
        tasks: [],
        createdAt: new Date().toISOString(),
      };
      StorageService.setActivePlan(alicePlan);
      expect(StorageService.getActivePlan()?.subject).toBe('Algorithms (Alice)');

      // 2. Account B logs in -> Alice's plan must NOT be visible
      StorageService.setActiveUser('user-bob-456');
      expect(StorageService.getActivePlan()).toBeNull();

      // 3. Bob saves his own plan
      const bobPlan: StudyPlan = {
        id: 'plan-bob',
        subject: 'Operating Systems (Bob)',
        examDate: '2026-07-01',
        dailyHours: 3,
        level: 'Intermediate',
        topics: ['Virtual Memory'],
        weakTopics: [],
        preferredDays: ['Tuesday'],
        totalDays: 7,
        totalStudyHours: 21,
        assumptions: [],
        tasks: [],
        createdAt: new Date().toISOString(),
      };
      StorageService.setActivePlan(bobPlan);
      expect(StorageService.getActivePlan()?.subject).toBe('Operating Systems (Bob)');

      // 4. Alice logs back in -> Alice's plan is restored, Bob's is not visible
      StorageService.setActiveUser('user-alice-123');
      expect(StorageService.getActivePlan()?.subject).toBe('Algorithms (Alice)');

      // 5. User logs out (null user) -> neither Alice's nor Bob's plan is visible
      StorageService.setActiveUser(null);
      expect(StorageService.getActivePlan()).toBeNull();
    });

    it('does NOT automatically seed fake sample plans for an authenticated user', () => {
      StorageService.setActiveUser('fresh-student-uid-777');
      expect(StorageService.getActivePlan()).toBeNull();

      // Calling seedSampleDataIfEmpty() should do nothing for an authenticated student
      StorageService.seedSampleDataIfEmpty();
      expect(StorageService.getActivePlan()).toBeNull();
      expect(StorageService.getQuizHistory().length).toBe(0);
      expect(Object.keys(StorageService.getMasteries()).length).toBe(0);
    });

    it('safely migrates legacy browser data to active user without data loss', () => {
      // Setup legacy un-scoped data in localStorage
      localStorage.setItem('studymate_active_plan', JSON.stringify({ id: 'legacy-p1', subject: 'Legacy Maths' }));

      expect(StorageService.hasLegacyData()).toBe(true);

      // Migrate to target user
      const migrated = StorageService.migrateLegacyDataToActiveUser('target-user-888');
      expect(migrated).toBe(true);

      // Verify target user now has the plan
      StorageService.setActiveUser('target-user-888');
      expect(StorageService.getActivePlan()?.subject).toBe('Legacy Maths');
    });
  });
});
