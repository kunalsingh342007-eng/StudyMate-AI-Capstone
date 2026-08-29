import { describe, it, expect } from 'vitest';
import {
  StudyPlanOutputSchema,
  TopicExplanationSchema,
  QuizOutputSchema,
  AdaptedPlanResponseSchema,
} from '../lib/schemas';

describe('Zod Validation Schemas', () => {
  it('validates a correct StudyPlan output schema', () => {
    const validPlan = {
      tasks: [
        {
          id: 'task-1',
          day: 'Day 1',
          date: '2026-05-01',
          topic: 'Recursion',
          subtopic: 'Base cases & Call stack',
          durationMinutes: 90,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Master call stack unwinding and recursion tree construction.',
          revisionTask: 'Recite base case conditions without looking at notes.',
          practiceRecommendation: 'Solve Fibonacci and Subsets on LeetCode.',
          status: 'pending',
        },
      ],
      totalDays: 1,
      totalStudyHours: 1.5,
      assumptions: ['Assumes basic familiarity with C++ syntax.'],
    };

    const parsed = StudyPlanOutputSchema.safeParse(validPlan);
    expect(parsed.success).toBe(true);
  });

  it('validates a 7-section Topic Explanation schema', () => {
    const validExplanation = {
      simpleExplanation: 'Recursion is when a function calls itself to solve a smaller subproblem.',
      realWorldAnalogy: 'Like Russian nesting dolls (Matryoshka).',
      stepByStepExplanation: [
        {
          stepNumber: 1,
          title: 'Define Base Case',
          description: 'The condition that halts further recursive calls.',
        },
        {
          stepNumber: 2,
          title: 'Recursive Step',
          description: 'Invoking the function with smaller parameters.',
        },
      ],
      example: {
        title: 'Factorial Calculation in C++',
        codeOrFormula: 'int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }',
        explanation: 'Multiplies n by the factorial of n-1 until n hits 1.',
      },
      commonMistakes: [
        {
          mistake: 'Missing base case',
          whyItHappens: 'Forgetting to check the stopping condition.',
          howToAvoid: 'Always declare the if condition first.',
        },
      ],
      quickRevisionNotes: [
        'Base cases are mandatory to prevent stack overflow.',
        'Each call consumes stack memory frame.',
      ],
      practiceQuestions: [
        {
          question: 'What error occurs if recursion never terminates?',
          hint: 'Think about memory allocated for functions.',
          answer: 'Stack Overflow error.',
        },
      ],
    };

    const parsed = TopicExplanationSchema.safeParse(validExplanation);
    expect(parsed.success).toBe(true);
  });

  it('validates a Quiz response with 4 options and hidden answer structure', () => {
    const validQuiz = {
      questions: [
        {
          id: 'q1',
          question: 'What is the time complexity of naive recursive Fibonacci?',
          options: ['O(1)', 'O(n)', 'O(2^n)', 'O(log n)'],
          correctAnswer: 'O(2^n)',
          explanation: 'Each call branches into two recursive calls, creating a binary tree of depth n.',
        },
      ],
    };

    const parsed = QuizOutputSchema.safeParse(validQuiz);
    expect(parsed.success).toBe(true);
  });

  it('validates an Adaptive Schedule response', () => {
    const validAdaptive = {
      updatedTasks: [
        {
          id: 'task-1',
          day: 'Day 1',
          date: '2026-05-01',
          topic: 'Recursion',
          subtopic: 'Base cases',
          durationMinutes: 90,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Master call stack unwinding.',
          revisionTask: 'Recite base case rules.',
          practiceRecommendation: 'Solve 2 problems.',
          status: 'pending',
        },
      ],
      redistributionSummary: 'Reallocated missed recursion drill into Saturday recovery block.',
      priorityOrder: ['Recursion', 'Dynamic Programming'],
      encouragementMessage: 'You are on track! Stay consistent.',
    };

    const parsed = AdaptedPlanResponseSchema.safeParse(validAdaptive);
    expect(parsed.success).toBe(true);
  });
});
