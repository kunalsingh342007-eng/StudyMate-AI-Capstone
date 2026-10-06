import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MasteryEngine } from '../services/learning/masteryEngine';
import { createExpressApp } from '../../server/app';
import { serverQuizStore } from '../../server/quizStore';
import { ServerQuiz } from '../types';

describe('Phase 2: Study Intelligence & Mastery Engine Tests', () => {
  describe('MasteryEngine.calculateMasteryScore', () => {
    it('accurately computes deterministic score and clamps between 0 and 100', () => {
      // 100% accuracy with positive study bonus and positive confidence
      const perfect = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 10,
        recentTrend: [100, 100],
        studyMinutes: 120,
        confidenceRatings: [{ level: 'High', isCorrect: true }],
      });

      expect(perfect.score).toBeLessThanOrEqual(100);
      expect(perfect.score).toBeGreaterThanOrEqual(80);
      expect(perfect.level).toBe('Mastered');

      // 0% accuracy
      const zero = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 0,
        recentTrend: [0, 0],
        studyMinutes: 0,
        confidenceRatings: [{ level: 'High', isCorrect: false }], // penalty for overconfidence
      });

      expect(zero.score).toBe(0);
      expect(zero.level).toBe('Weak');
    });

    it('penalizes overconfidence when high confidence coincides with incorrect answers', () => {
      // Baseline 50% without confidence ratings
      const baseline = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 5,
        recentTrend: [50],
        studyMinutes: 0,
      });

      // Same accuracy, but student marked High confidence on wrong answers (misconceptions)
      const overconfident = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 5,
        recentTrend: [50],
        studyMinutes: 0,
        confidenceRatings: [
          { level: 'High', isCorrect: false },
          { level: 'High', isCorrect: false },
        ],
      });

      expect(overconfident.score).toBeLessThan(baseline.score);
    });

    it('rewards solid mastery when high confidence coincides with correct answers', () => {
      const baseline = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 8,
        recentTrend: [80],
        studyMinutes: 0,
      });

      const confirmedMastery = MasteryEngine.calculateMasteryScore({
        totalQuestions: 10,
        correctQuestions: 8,
        recentTrend: [80],
        studyMinutes: 0,
        confidenceRatings: [
          { level: 'High', isCorrect: true },
          { level: 'High', isCorrect: true },
        ],
      });

      expect(confirmedMastery.score).toBeGreaterThanOrEqual(baseline.score);
    });
  });

  describe('MasteryEngine.evaluateConfidenceAlignment', () => {
    it('flags Misconceptions when confidence is High but answer is wrong', () => {
      const alignment = MasteryEngine.evaluateConfidenceAlignment('High', false);
      expect(alignment).toBe('Misconception');
    });

    it('flags Lucky Guess when confidence is Low but answer is correct', () => {
      const alignment = MasteryEngine.evaluateConfidenceAlignment('Low', true);
      expect(alignment).toBe('Lucky Guess');
    });

    it('flags Strong Mastery when confidence is High and answer is correct', () => {
      const alignment = MasteryEngine.evaluateConfidenceAlignment('High', true);
      expect(alignment).toBe('Strong Mastery');
    });

    it('flags Foundational Gap when confidence is Low or Medium and answer is incorrect', () => {
      const alignmentLow = MasteryEngine.evaluateConfidenceAlignment('Low', false);
      expect(alignmentLow).toBe('Foundational Gap');

      const alignmentMed = MasteryEngine.evaluateConfidenceAlignment('Medium', false);
      expect(alignmentMed).toBe('Foundational Gap');
    });
  });

  describe('MasteryEngine.detectWeakAreas', () => {
    it('ranks weak areas by urgency considering score and unresolved mistakes', () => {
      const masteries = {
        'Graph Traversal': {
          topic: 'Graph Traversal',
          score: 32,
          level: 'Weak' as const,
          totalQuestions: 10,
          correctQuestions: 3,
          accuracy: 30,
          lastTestedAt: new Date().toISOString(),
          attemptsCount: 2,
        },
        'Binary Search': {
          topic: 'Binary Search',
          score: 85,
          level: 'Mastered' as const,
          totalQuestions: 10,
          correctQuestions: 9,
          accuracy: 90,
          lastTestedAt: new Date().toISOString(),
          attemptsCount: 2,
        },
      };

      const mistakes = [
        {
          id: 'm1',
          quizId: 'q1',
          questionId: 'q1-1',
          topic: 'Graph Traversal',
          questionText: 'What is DFS cycle detection time?',
          selectedAnswer: 'O(1)',
          correctAnswer: 'O(V+E)',
          explanation: 'DFS visits all vertices and edges.',
          mistakeCategory: 'Conceptual' as const,
          confidence: 'High' as const,
          timestamp: new Date().toISOString(),
          resolved: false,
        },
      ];

      const weakAreas = MasteryEngine.detectWeakAreas(masteries, mistakes, 7);

      expect(weakAreas.length).toBe(1);
      expect(weakAreas[0].topic).toBe('Graph Traversal');
      expect(weakAreas[0].priority).toBe('High');
      expect(weakAreas[0].mastery).toBe(32);
      expect(weakAreas[0].mistakeCount).toBe(1);
    });
  });

  describe('MasteryEngine.calculateNextReview (Leitner System)', () => {
    it('resets interval to 1 day on poor performance', () => {
      const next = MasteryEngine.calculateNextReview(3, 'poor');
      expect(next.intervalDays).toBe(1);
    });

    it('progresses intervals on good performance', () => {
      const step0 = MasteryEngine.calculateNextReview(0, 'good');
      expect(step0.intervalDays).toBe(1);

      const step1 = MasteryEngine.calculateNextReview(1, 'good');
      expect(step1.intervalDays).toBe(3);

      const step2 = MasteryEngine.calculateNextReview(2, 'good');
      expect(step2.intervalDays).toBe(7);
    });
  });

  describe('Server API: Confidence Evaluation & Mistake Diagnosis Endpoints', () => {
    let server: any;
    let baseUrl: string;

    beforeEach(async () => {
      const app = createExpressApp();
      await new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const address = server.address();
          const port = typeof address === 'object' && address ? address.port : 3000;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    afterEach(async () => {
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
      }
    });

    it('attaches confidence and alignment to reviewQuestions during /api/quiz/submit', async () => {
      const testQuiz: ServerQuiz = {
        id: 'quiz-conf-test',
        subject: 'Algorithms',
        topic: 'Sorting',
        difficulty: 'Intermediate',
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'q1',
            question: 'What is merge sort worst case?',
            options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(1)'],
            correctAnswer: 'O(N log N)',
            explanation: 'Merge sort always divides in half and merges linearly.',
          },
          {
            id: 'q2',
            question: 'Is quicksort stable?',
            options: ['Yes', 'No', 'Sometimes', 'Never'],
            correctAnswer: 'No',
            explanation: 'Standard quicksort partitioning swaps across equal keys.',
          },
        ],
      };

      serverQuizStore.saveQuiz(testQuiz);

      // Student gets Q1 wrong with High confidence (Misconception!)
      // Student gets Q2 right with High confidence (Strong Mastery!)
      const payload = {
        quizId: 'quiz-conf-test',
        userAnswers: {
          q1: 'O(N^2)',
          q2: 'No',
        },
        confidenceMap: {
          q1: 'High',
          q2: 'High',
        },
      };

      const res = await fetch(`${baseUrl}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.score).toBe(1);
      expect(json.totalQuestions).toBe(2);
      expect(json.reviewQuestions.length).toBe(2);

      // Verify question 1 is flagged as Misconception
      const q1Review = json.reviewQuestions.find((r: any) => r.id === 'q1');
      expect(q1Review.isCorrect).toBe(false);
      expect(q1Review.confidence).toBe('High');
      expect(q1Review.alignment).toBe('Misconception');

      // Verify question 2 is flagged as Strong Mastery
      const q2Review = json.reviewQuestions.find((r: any) => r.id === 'q2');
      expect(q2Review.isCorrect).toBe(true);
      expect(q2Review.confidence).toBe('High');
      expect(q2Review.alignment).toBe('Strong Mastery');

      // Verify overall insights
      expect(json.confidenceInsights.misconceptionsCount).toBe(1);
      expect(json.confidenceInsights.strongMasteryCount).toBe(1);
    });

    it('POST /api/explain-mistake returns 6-part pedagogical diagnosis', async () => {
      const res = await fetch(`${baseUrl}/api/explain-mistake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Recursion',
          question: 'What is the base case in factorial calculation?',
          selectedAnswer: 'n > 10',
          correctAnswer: 'n <= 1',
          difficulty: 'Intermediate',
          confidence: 'High',
          mistakeCategory: 'Conceptual',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.whatWasMisunderstood).toBeDefined();
      expect(json.whySelectedWasWrong).toBeDefined();
      expect(json.whyCorrectWorks).toBeDefined();
      expect(json.simpleExample).toBeDefined();
      expect(json.keyTakeaway).toBeDefined();
      expect(json.followUpQuestion).toBeDefined();
      expect(json.followUpQuestion.question).toBeDefined();
      expect(json.followUpQuestion.options.length).toBeGreaterThanOrEqual(2);
    });
  });
});
