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
});
