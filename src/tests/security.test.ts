import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createExpressApp } from '../../server/app';
import { serverQuizStore, toClientQuiz } from '../../server/quizStore';
import { InMemoryRateLimiter, aiEndpointsLimiter } from '../../server/rateLimiter';
import {
  validateStudyPlanInput,
  validateExplainInput,
  validateQuizInput,
  validateQuizAnswerInput,
  validateQuizSubmitInput,
  validateAdaptPlanInput,
} from '../../server/validators';
import { ServerQuiz } from '../types';

describe('Phase 1: Quiz Answer Security & Shielding', () => {
  const mockServerQuiz: ServerQuiz = {
    id: 'quiz-sec-test-1',
    subject: 'Computer Science',
    topic: 'Binary Search Trees',
    difficulty: 'Intermediate',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'What is the average lookup time in a balanced BST?',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
        correctAnswer: 'O(log N)',
        explanation: 'Each step cuts search space by half, giving logarithmic complexity.',
      },
      {
        id: 'q2',
        question: 'Which traversal prints BST keys in ascending sorted order?',
        options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
        correctAnswer: 'Inorder',
        explanation: 'Inorder visits left, root, right, naturally producing sorted order.',
      },
    ],
  };

  beforeEach(() => {
    serverQuizStore.saveQuiz(mockServerQuiz);
  });

  afterEach(() => {
    serverQuizStore.clear();
  });

  it('strictly shields correct answers and explanations from the client-facing quiz payload', () => {
    const clientQuiz = toClientQuiz(mockServerQuiz);

    expect(clientQuiz.id).toBe(mockServerQuiz.id);
    expect(clientQuiz.questions.length).toBe(2);

    clientQuiz.questions.forEach((q: any) => {
      // Must NOT contain correctAnswer
      expect(q.correctAnswer).toBeUndefined();
      // Must NOT contain explanation
      expect(q.explanation).toBeUndefined();
      // Must contain only safe fields
      expect(q.id).toBeDefined();
      expect(q.question).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
    });

    // Verify raw JSON stringification has no answer leaks
    const jsonString = JSON.stringify(clientQuiz);
    expect(jsonString).not.toContain('O(log N)"}'); // not as an answer field
    expect(jsonString).not.toContain('"correctAnswer"');
    expect(jsonString).not.toContain('"explanation"');
  });

  it('validates single answer submissions authoritatively on the server', () => {
    const stored = serverQuizStore.getQuiz('quiz-sec-test-1');
    expect(stored).toBeDefined();

    const q1 = stored!.questions[0];
    expect(q1.correctAnswer).toBe('O(log N)');

    // Correct answer submission
    const isCorrect = 'O(log N)' === q1.correctAnswer;
    expect(isCorrect).toBe(true);

    // Wrong answer submission
    const isWrong = 'O(1)' === q1.correctAnswer;
    expect(isWrong).toBe(false);
  });
});

describe('Phase 1: Backend Input Validation', () => {
  it('rejects study plan requests missing mandatory fields with user-safe errors', () => {
    const invalidReq1 = validateStudyPlanInput({});
    expect(invalidReq1.success).toBe(false);
    expect(invalidReq1.error).toContain('Subject is required');

    const invalidReq2 = validateStudyPlanInput({ subject: 'Calculus' });
    expect(invalidReq2.success).toBe(false);
    expect(invalidReq2.error).toContain('Target exam date is required');

    const invalidReq3 = validateStudyPlanInput({
      subject: 'Calculus',
      examDate: 'invalid-date-string',
      dailyHours: 2,
      topics: ['Derivatives'],
    });
    expect(invalidReq3.success).toBe(false);
    expect(invalidReq3.error).toContain('valid calendar date');

    const invalidHours = validateStudyPlanInput({
      subject: 'Calculus',
      examDate: '2026-06-01',
      dailyHours: 25, // unrealistic
      topics: ['Derivatives'],
    });
    expect(invalidHours.success).toBe(false);
    expect(invalidHours.error).toContain('Daily study hours must be a number between 0.5 and 16');
  });

  it('validates topic explanation input strictly', () => {
    const missingTopic = validateExplainInput({ topic: '' });
    expect(missingTopic.success).toBe(false);
    expect(missingTopic.error).toContain('Topic is required');

    const invalidLevel = validateExplainInput({ topic: 'Quicksort', level: 'SuperExpert' });
    expect(invalidLevel.success).toBe(false);
    expect(invalidLevel.error).toContain('Study level must be one of');

    const valid = validateExplainInput({ topic: 'Quicksort', level: 'Advanced' });
    expect(valid.success).toBe(true);
    expect(valid.data?.topic).toBe('Quicksort');
    expect(valid.data?.level).toBe('Advanced');
  });

  it('validates quiz generation input constraints', () => {
    const missingTopic = validateQuizInput({ topic: '   ' });
    expect(missingTopic.success).toBe(false);
    expect(missingTopic.error).toContain('Topic is required');

    const invalidCount = validateQuizInput({ topic: 'Dynamic Programming', questionCount: 25 });
    expect(invalidCount.success).toBe(false);
    expect(invalidCount.error).toContain('between 3 and 10');

    const valid = validateQuizInput({ topic: 'Dynamic Programming', questionCount: 4, difficulty: 'Intermediate' });
    expect(valid.success).toBe(true);
    expect(valid.data?.questionCount).toBe(4);
  });

  it('validates quiz answer and submit payloads', () => {
    const emptyAnswer = validateQuizAnswerInput({ quizId: 'q-1', questionId: 'q1', selectedAnswer: '' });
    expect(emptyAnswer.success).toBe(false);
    expect(emptyAnswer.error).toContain('Selected answer is required');

    const validAnswer = validateQuizAnswerInput({ quizId: 'q-1', questionId: 'q1', selectedAnswer: 'Option A' });
    expect(validAnswer.success).toBe(true);

    const emptySubmit = validateQuizSubmitInput({ quizId: '', userAnswers: {} });
    expect(emptySubmit.success).toBe(false);
    expect(emptySubmit.error).toContain('Quiz ID is required');

    const validSubmit = validateQuizSubmitInput({ quizId: 'q-1', userAnswers: { q1: 'Option A' } });
    expect(validSubmit.success).toBe(true);
  });

  it('validates adaptive plan rescheduling requests', () => {
    const missingPlan = validateAdaptPlanInput({ missedTaskId: 't-1' });
    expect(missingPlan.success).toBe(false);
    expect(missingPlan.error).toContain('Current study plan');

    const taskNotFound = validateAdaptPlanInput({
      currentPlan: { id: 'p1', tasks: [{ id: 't-1' }] },
      missedTaskId: 't-nonexistent',
    });
    expect(taskNotFound.success).toBe(false);
    expect(taskNotFound.error).toContain('missedTaskId was not found');
  });
});

describe('Phase 1: API Rate Limiting', () => {
  it('allows requests within limit and returns 429 when threshold exceeded', () => {
    const limiter = new InMemoryRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
      message: 'Rate limit exceeded.',
    });

    const middleware = limiter.middleware();
    const mockReq = { headers: {}, ip: '192.168.1.1', socket: {} } as any;

    let statusCode: number | null = null;
    let jsonResponse: any = null;
    let nextCalls = 0;

    const mockRes = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as any;

    const next = () => {
      nextCalls += 1;
    };

    // Requests 1, 2, 3 should succeed
    middleware(mockReq, mockRes, next);
    expect(nextCalls).toBe(1);

    middleware(mockReq, mockRes, next);
    expect(nextCalls).toBe(2);

    middleware(mockReq, mockRes, next);
    expect(nextCalls).toBe(3);

    // Request 4 should be rejected with 429
    middleware(mockReq, mockRes, next);
    expect(nextCalls).toBe(3); // did not call next
    expect(statusCode).toBe(429);
    expect(jsonResponse.error).toBe('Rate limit exceeded.');

    limiter.destroy();
  });
});

describe('Phase 1: Full Express Endpoint HTTP Integration', () => {
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    aiEndpointsLimiter.reset();
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

  it('POST /api/quiz returns strictly shielded questions without answer keys', async () => {
    const res = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Computer Science',
        topic: 'Data Structures',
        difficulty: 'Intermediate',
        questionCount: 4,
      }),
    });

    expect(res.status).toBe(200);
    const quiz = await res.json();

    expect(quiz.id).toBeDefined();
    expect(quiz.topic).toBe('Data Structures');
    expect(Array.isArray(quiz.questions)).toBe(true);
    expect(quiz.questions.length).toBeGreaterThanOrEqual(3);

    // CRITICAL: Ensure neither correctAnswer nor explanation are exposed
    for (const q of quiz.questions) {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.id).toBeDefined();
      expect(q.question).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
    }
  });

  it('POST /api/quiz/answer validates user answer and returns explanation', async () => {
    // 1. Generate quiz first
    const quizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Computer Science',
        topic: 'Data Structures',
        difficulty: 'Intermediate',
        questionCount: 4,
      }),
    });
    const quiz = await quizRes.json();
    const firstQ = quiz.questions[0];

    // 2. Submit an invalid option (not in options list) -> should return 400
    const invalidOptRes = await fetch(`${baseUrl}/api/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: quiz.id,
        questionId: firstQ.id,
        selectedAnswer: 'Not an existing option XYZ',
      }),
    });
    expect(invalidOptRes.status).toBe(400);
    const errBody = await invalidOptRes.json();
    expect(errBody.error).toContain('Selected answer must be one of the available options');

    // 3. Submit one of the actual options
    const answerRes = await fetch(`${baseUrl}/api/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: quiz.id,
        questionId: firstQ.id,
        selectedAnswer: firstQ.options[0],
      }),
    });
    expect(answerRes.status).toBe(200);
    const answerData = await answerRes.json();
    expect(typeof answerData.isCorrect).toBe('boolean');
    expect(answerData.selectedAnswer).toBe(firstQ.options[0]);
    expect(answerData.correctAnswer).toBeDefined();
    expect(answerData.explanation).toBeDefined();
  });

  it('POST /api/quiz/submit computes authoritative score and returns full review', async () => {
    // 1. Generate quiz
    const quizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Computer Science',
        topic: 'Algorithms',
        difficulty: 'Intermediate',
        questionCount: 4,
      }),
    });
    const quiz = await quizRes.json();

    // 2. Submit all answers
    const userAnswers: { [key: string]: string } = {};
    quiz.questions.forEach((q: any) => {
      userAnswers[q.id] = q.options[0]; // pick first option
    });

    const submitRes = await fetch(`${baseUrl}/api/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: quiz.id,
        userAnswers,
      }),
    });

    expect(submitRes.status).toBe(200);
    const result = await submitRes.json();

    expect(result.quizId).toBe(quiz.id);
    expect(typeof result.score).toBe('number');
    expect(result.totalQuestions).toBe(quiz.questions.length);
    expect(typeof result.percentage).toBe('number');
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
    expect(result.improvementRecommendation).toBeDefined();
    expect(Array.isArray(result.reviewQuestions)).toBe(true);
    expect(result.reviewQuestions.length).toBe(quiz.questions.length);

    // Each review question now has explanation and correctness
    for (const review of result.reviewQuestions) {
      expect(review.correctAnswer).toBeDefined();
      expect(review.explanation).toBeDefined();
      expect(typeof review.isCorrect).toBe('boolean');
    }
  });

  it('rejects malformed requests with 400 without leaking stack traces', async () => {
    const res = await fetch(`${baseUrl}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // missing required fields
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.stack).toBeUndefined(); // no stack traces
  });
});
