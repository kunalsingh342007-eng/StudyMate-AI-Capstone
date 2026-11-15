import http from 'http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import handler from '../../api/index';
import { createExpressApp } from '../../server/app';
import { aiEndpointsLimiter } from '../../server/rateLimiter';
import { serverQuizStore } from '../../server/quizStore';
import {
  setGeminiTestClient,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
} from '../../server/gemini';

function startTestServer(requestHandler: http.RequestListener) {
  return new Promise<{ server: http.Server; baseUrl: string }>((resolve) => {
    const server = http.createServer(requestHandler);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 3000;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function closeTestServer(server: http.Server | null) {
  return new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });
}

describe('Vercel Serverless Entrypoint & Diagnostics', () => {
  let server: http.Server | null = null;
  let baseUrl = '';
  const origApiKey = process.env.GEMINI_API_KEY;

  beforeEach(async () => {
    aiEndpointsLimiter.reset();
    serverQuizStore.clear();
    setGeminiTestClient(undefined);
    const started = await startTestServer((req, res) => handler(req, res));
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    setGeminiTestClient(undefined);
    if (origApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = origApiKey;
    }
    await closeTestServer(server);
    server = null;
  });

  it('serves GET /api/health and normalized Vercel rewrite /api?__path=health', async () => {
    const directRes = await fetch(`${baseUrl}/api/health`);
    expect(directRes.status).toBe(200);
    const directData = await directRes.json();
    expect(directData.status).toBe('healthy');
    expect(directData.checks?.backend).toBe('ok');
    expect(directData.requestId).toBeDefined();
    expect(directRes.headers.get('x-request-id')).toBeTruthy();

    const rewriteRes = await fetch(`${baseUrl}/api?__path=health`);
    expect(rewriteRes.status).toBe(200);
    const rewriteData = await rewriteRes.json();
    expect(rewriteData.status).toBe('healthy');
    expect(rewriteData.checks?.backend).toBe('ok');
  });

  it('serves GET /api/status and /api?__path=status without calling external APIs by default', async () => {
    delete process.env.GEMINI_API_KEY;
    setGeminiTestClient(null);

    const res = await fetch(`${baseUrl}/api?__path=status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isConfigured).toBe(false);
    expect(data.status).toBe('missing_api_key');
    expect(data.provider).toBe('Google Gemini');
    expect(data.model).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('supports GET /api/status?live=true when key is missing (503) and when Gemini responds (200)', async () => {
    delete process.env.GEMINI_API_KEY;
    setGeminiTestClient(null);

    const failRes = await fetch(`${baseUrl}/api?__path=status&live=true`);
    expect(failRes.status).toBe(503);
    const failData = await failRes.json();
    expect(failData.status).toBe('error');
    expect(failData.liveCheck?.ok).toBe(false);
    expect(failData.liveCheck?.code).toBe('GEMINI_MISSING_API_KEY');

    setGeminiTestClient({
      models: {
        generateContent: async () => ({ text: JSON.stringify({ ok: true }) }),
      },
    });

    const okRes = await fetch(`${baseUrl}/api?__path=status&live=true`);
    expect(okRes.status).toBe(200);
    const okData = await okRes.json();
    expect(okData.isConfigured).toBe(true);
    expect(okData.status).toBe('ready');
    expect(okData.liveCheck?.ok).toBe(true);
  });
});

describe('Gemini Service Error Handling & Real SDK Contract', () => {
  let server: http.Server | null = null;
  let baseUrl = '';
  const origApiKey = process.env.GEMINI_API_KEY;
  const origTimeout = process.env.GEMINI_TIMEOUT_MS;

  beforeEach(async () => {
    aiEndpointsLimiter.reset();
    serverQuizStore.clear();
    const app = createExpressApp();
    const started = await startTestServer(app);
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    setGeminiTestClient(undefined);
    if (origApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = origApiKey;
    }
    if (origTimeout === undefined) {
      delete process.env.GEMINI_TIMEOUT_MS;
    } else {
      process.env.GEMINI_TIMEOUT_MS = origTimeout;
    }
    await closeTestServer(server);
    server = null;
  });

  it('returns explicit 503 GEMINI_MISSING_API_KEY across all AI endpoints instead of silent demo fallback', async () => {
    delete process.env.GEMINI_API_KEY;
    setGeminiTestClient(null);

    const endpoints: Array<{ path: string; body: any }> = [
      {
        path: '/api/study-plan',
        body: {
          subject: 'Physics',
          examDate: '2026-12-01',
          dailyHours: 2,
          level: 'Intermediate',
          topics: ['Kinematics', 'Dynamics'],
        },
      },
      {
        path: '/api/explain',
        body: { topic: 'Thermodynamics', level: 'Beginner' },
      },
      {
        path: '/api/quiz',
        body: { subject: 'Physics', topic: 'Optics', difficulty: 'Intermediate', questionCount: 3 },
      },
      {
        path: '/api/adapt-plan',
        body: {
          currentPlan: {
            id: 'plan-1',
            subject: 'Physics',
            examDate: '2026-12-01',
            dailyHours: 2,
            level: 'Intermediate',
            tasks: [
              {
                id: 't-1',
                date: '2026-11-20',
                day: 'Day 1',
                topic: 'Optics',
                subtopic: 'Snell Law',
                durationMinutes: 60,
                priority: 'High',
                difficulty: 'Intermediate',
                learningObjective: 'Derive refraction index',
                revisionTask: 'Summarize equations',
                practiceRecommendation: 'Solve 5 problems',
                status: 'missed',
              },
            ],
          },
          missedTaskId: 't-1',
        },
      },
      {
        path: '/api/explain-mistake',
        body: {
          topic: 'Optics',
          question: 'Which law governs refraction?',
          selectedAnswer: 'Ohm Law',
          correctAnswer: 'Snell Law',
        },
      },
      {
        path: '/api/parse-syllabus',
        body: {
          rawText: 'Week 1: Kinematics, Vectors, Projectile Motion, Newton Laws, Work and Energy',
        },
      },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body),
      });
      expect(res.status, `Expected 503 for ${ep.path}`).toBe(503);
      const data = await res.json();
      expect(data.code).toBe('GEMINI_MISSING_API_KEY');
      expect(data.category).toBe('missing_api_key');
      expect(data.requestId).toBeDefined();
      expect(data.isDemoFallback).toBeUndefined();
    }
  });

  it('executes all 6 AI endpoints with mocked Gemini structured JSON and sets isDemoFallback: false', async () => {
    setGeminiTestClient({
      models: {
        generateContent: async ({ contents }) => {
          if (contents.includes('study plan') || contents.includes('Subject:') && contents.includes('Target Exam Date:')) {
            return {
              text: JSON.stringify({
                tasks: [
                  {
                    id: 'task-ai-1',
                    date: '2026-11-20',
                    day: 'Day 1',
                    topic: 'Graph Algorithms',
                    subtopic: 'Dijkstra Shortest Path',
                    durationMinutes: 60,
                    priority: 'High',
                    difficulty: 'Intermediate',
                    learningObjective: 'Implement priority-queue relaxation cleanly.',
                    revisionTask: 'Trace 2 weighted graphs by hand.',
                    practiceRecommendation: 'Solve 3 shortest-path problems.',
                    status: 'pending',
                  },
                ],
                totalDays: 1,
                totalStudyHours: 1,
                assumptions: ['Assumes basic priority queue familiarity'],
              }),
            };
          }

          if (contents.includes('simpleExplanation') || contents.includes('Teach this topic:')) {
            return {
              text: JSON.stringify({
                simpleExplanation: 'Dijkstra finds shortest paths greedily from a source in non-negative graphs.',
                realWorldAnalogy: 'Like GPS updating fastest ETA routes intersection by intersection.',
                stepByStepExplanation: [
                  { stepNumber: 1, title: 'Initialize', description: 'Set source distance to 0 and others to infinity.' },
                ],
                example: {
                  title: '3-Node Graph',
                  codeOrFormula: 'dist[v] = min(dist[v], dist[u] + w(u,v))',
                  explanation: 'Edge relaxation updates shorter discovered distances.',
                },
                commonMistakes: [
                  {
                    mistake: 'Using Dijkstra with negative edge weights',
                    whyItHappens: 'Greedy finality assumes path costs never decrease later.',
                    howToAvoid: 'Use Bellman-Ford if negative edges exist.',
                  },
                ],
                quickRevisionNotes: ['Requires non-negative weights', 'Uses min-heap'],
                practiceQuestions: [
                  {
                    question: 'Why do negative edges break Dijkstra?',
                    hint: 'Think about popped vertices.',
                    answer: 'Popped nodes are marked final too early.',
                  },
                ],
              }),
            };
          }

          if (contents.includes('Generate a') && contents.includes('multiple-choice')) {
            return {
              text: JSON.stringify({
                questions: [
                  {
                    id: 'ai-q1',
                    question: 'What data structure optimizes Dijkstra extract-min?',
                    options: ['Min-Heap', 'Stack', 'Queue', 'Trie'],
                    correctAnswer: 'Min-Heap',
                    explanation: 'A binary min-heap provides O(log V) extract-min and push.',
                  },
                  {
                    id: 'ai-q2',
                    question: 'Which graph property breaks standard Dijkstra?',
                    options: ['Negative edge weights', 'Cycles', 'Sparse edges', 'Directed edges'],
                    correctAnswer: 'Negative edge weights',
                    explanation: 'Negative weights violate greedy non-decreasing path lengths.',
                  },
                  {
                    id: 'ai-q3',
                    question: 'Initial distance to source node in Dijkstra?',
                    options: ['0', '1', 'Infinity', '-1'],
                    correctAnswer: '0',
                    explanation: 'Zero cost is needed to reach the source from itself.',
                  },
                ],
              }),
            };
          }

          if (contents.includes('missed') || contents.includes('Missed Task ID') || contents.includes('updatedTasks')) {
            return {
              text: JSON.stringify({
                updatedTasks: [
                  {
                    id: 't-rescheduled-1',
                    date: '2026-11-21',
                    day: 'Day 2',
                    topic: 'Optics',
                    subtopic: 'Snell Law Catch-Up',
                    durationMinutes: 60,
                    priority: 'High',
                    difficulty: 'Intermediate',
                    learningObjective: 'Catch up on missed refraction proofs',
                    revisionTask: 'Review index formulas',
                    practiceRecommendation: 'Work through 4 problems',
                    status: 'pending',
                  },
                ],
                redistributionSummary: 'Moved missed Optics task to Day 2 priority slot.',
                priorityOrder: ['Optics'],
                encouragementMessage: 'Stay consistent and knock out the priority block first.',
              }),
            };
          }

          if (contents.includes('whatWasMisunderstood') || contents.includes('Selected Wrong Answer')) {
            return {
              text: JSON.stringify({
                whatWasMisunderstood: 'Confused electrical resistance law with optical refraction law.',
                whySelectedWasWrong: 'Ohm Law relates voltage, current, and resistance.',
                whyCorrectWorks: 'Snell Law relates angles of incidence and refraction via refractive indices.',
                simpleExample: 'Light bending when entering water from air.',
                keyTakeaway: 'Use n1 sin(theta1) = n2 sin(theta2) for refraction.',
              }),
            };
          }

          return {
            text: JSON.stringify({
              subject: 'Algorithms',
              targetExamName: 'Midterm',
              topics: [
                {
                  name: 'Shortest Paths',
                  subtopics: ['BFS', 'Dijkstra'],
                  estimatedHours: 4,
                  difficulty: 'Intermediate',
                  keyObjectives: ['Analyze time complexity'],
                },
              ],
              totalEstimatedHours: 4,
            }),
          };
        },
      },
    });

    const planRes = await fetch(`${baseUrl}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Algorithms',
        examDate: '2026-12-15',
        dailyHours: 2,
        level: 'Intermediate',
        topics: ['Graph Algorithms'],
      }),
    });
    expect(planRes.status).toBe(200);
    const plan = await planRes.json();
    expect(plan.isDemoFallback).toBe(false);
    expect(plan.tasks[0].subtopic).toBe('Dijkstra Shortest Path');

    const explainRes = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Dijkstra', level: 'Intermediate' }),
    });
    expect(explainRes.status).toBe(200);
    const explained = await explainRes.json();
    expect(explained.isDemoFallback).toBe(false);
    expect(explained.simpleExplanation).toContain('Dijkstra');

    const quizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Algorithms',
        topic: 'Dijkstra',
        difficulty: 'Intermediate',
        questionCount: 3,
      }),
    });
    expect(quizRes.status).toBe(200);
    const quiz = await quizRes.json();
    expect(quiz.isDemoFallback).toBe(false);
    expect(quiz.sessionToken).toBeDefined();
    expect(quiz.questions[0].correctAnswer).toBeUndefined();

    // Verify stateless recovery when serverQuizStore is cleared (simulates Vercel cold instance)
    serverQuizStore.clear();
    const answerRes = await fetch(`${baseUrl}/api/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: quiz.id,
        questionId: quiz.questions[0].id,
        selectedAnswer: quiz.questions[0].options[0],
        sessionToken: quiz.sessionToken,
      }),
    });
    expect(answerRes.status).toBe(200);
    const answerData = await answerRes.json();
    expect(answerData.isCorrect).toBe(true);
    expect(answerData.correctAnswer).toBe('Min-Heap');

    const adaptRes = await fetch(`${baseUrl}/api/adapt-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPlan: {
          id: 'p1',
          subject: 'Optics',
          examDate: '2026-12-01',
          dailyHours: 2,
          level: 'Intermediate',
          tasks: [
            {
              id: 't1',
              date: '2026-11-20',
              day: 'Day 1',
              topic: 'Optics',
              subtopic: 'Snell Law',
              durationMinutes: 60,
              priority: 'High',
              difficulty: 'Intermediate',
              learningObjective: 'Derive law',
              revisionTask: 'Notes',
              practiceRecommendation: 'Problems',
              status: 'missed',
            },
          ],
        },
        missedTaskId: 't1',
      }),
    });
    expect(adaptRes.status).toBe(200);
    const adapted = await adaptRes.json();
    expect(adapted.isDemoFallback).toBe(false);

    const mistakeRes = await fetch(`${baseUrl}/api/explain-mistake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Optics',
        question: 'Which law governs refraction?',
        selectedAnswer: 'Ohm Law',
        correctAnswer: 'Snell Law',
      }),
    });
    expect(mistakeRes.status).toBe(200);
    const mistake = await mistakeRes.json();
    expect(mistake.keyTakeaway).toContain('n1 sin');

    const syllabusRes = await fetch(`${baseUrl}/api/parse-syllabus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: 'CS201 Algorithms: BFS, DFS, Dijkstra, Dynamic Programming, Greedy Algorithms.',
      }),
    });
    expect(syllabusRes.status).toBe(200);
    const syllabus = await syllabusRes.json();
    expect(syllabus.subject).toBe('Algorithms');
  });

  it('fails fast without retrying on 401/403 authentication errors and never leaks API keys', async () => {
    let calls = 0;
    setGeminiTestClient({
      models: {
        generateContent: async () => {
          calls += 1;
          const err: any = new Error('API_KEY_INVALID: key AIzaFakeSecretValue123 is invalid');
          err.status = 401;
          throw err;
        },
      },
    });

    const res = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Recursion', level: 'Beginner' }),
    });

    expect(res.status).toBe(503);
    expect(calls).toBe(1);
    const body = await res.json();
    expect(body.code).toBe('GEMINI_AUTH_ERROR');
    expect(body.category).toBe('authentication');
    expect(JSON.stringify(body)).not.toContain('AIzaFakeSecretValue123');
  });

  it('retries with fallback model on 404 unsupported model, and returns 502 if both fail', async () => {
    const modelsCalled: string[] = [];
    setGeminiTestClient({
      models: {
        generateContent: async ({ model }) => {
          modelsCalled.push(model);
          const err: any = new Error(`models/${model} is not found for API version v1beta`);
          err.status = 404;
          throw err;
        },
      },
    });

    const res = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Recursion', level: 'Beginner' }),
    });

    expect(res.status).toBe(502);
    expect(modelsCalled).toEqual([DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL]);
    const body = await res.json();
    expect(body.code).toBe('GEMINI_INVALID_MODEL');
  });

  it('maps 429 quota/rate-limit errors to HTTP 429 GEMINI_QUOTA_EXCEEDED', async () => {
    setGeminiTestClient({
      models: {
        generateContent: async () => {
          const err: any = new Error('RESOURCE_EXHAUSTED: Quota exceeded for quota metric');
          err.status = 429;
          throw err;
        },
      },
    });

    const res = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Matrices', level: 'Beginner' }),
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('GEMINI_QUOTA_EXCEEDED');
    expect(body.retryable).toBe(true);
  });

  it('maps slow hung responses to HTTP 504 GEMINI_TIMEOUT', async () => {
    process.env.GEMINI_TIMEOUT_MS = '100';
    setGeminiTestClient({
      models: {
        generateContent: async () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ text: '{}' }), 400);
          }),
      },
    });

    const res = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Matrices', level: 'Beginner' }),
    });

    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.code).toBe('GEMINI_TIMEOUT');
  });

  it('maps malformed JSON and Zod schema violations to HTTP 502 GEMINI_MALFORMED_RESPONSE without retrying', async () => {
    let calls = 0;
    setGeminiTestClient({
      models: {
        generateContent: async () => {
          calls += 1;
          return { text: 'Here is an invalid non-JSON answer { broken' };
        },
      },
    });

    const badJsonRes = await fetch(`${baseUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Matrices', level: 'Beginner' }),
    });

    expect(badJsonRes.status).toBe(502);
    expect(calls).toBe(1);
    const badJsonData = await badJsonRes.json();
    expect(badJsonData.code).toBe('GEMINI_MALFORMED_RESPONSE');

    // Also test valid JSON missing required schema fields
    setGeminiTestClient({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({ unrelatedField: true }),
        }),
      },
    });

    const badSchemaRes = await fetch(`${baseUrl}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Linear Algebra',
        examDate: '2026-12-01',
        dailyHours: 2,
        level: 'Intermediate',
        topics: ['Eigenvalues'],
      }),
    });
    expect(badSchemaRes.status).toBe(502);
    const badSchemaData = await badSchemaRes.json();
    expect(badSchemaData.code).toBe('GEMINI_MALFORMED_RESPONSE');
  });

  it('enforces stateless quiz ownership across cold instances via sealed sessionToken', async () => {
    setGeminiTestClient({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            questions: [
              {
                id: 'q1',
                question: 'Which symbol denotes set union?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                explanation: 'A is right because it matches definition.',
              },
              {
                id: 'q2',
                question: 'Which symbol denotes intersection?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'B',
                explanation: 'B is right because it matches definition.',
              },
              {
                id: 'q3',
                question: 'Which symbol denotes empty set?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'C',
                explanation: 'C is right because it matches definition.',
              },
            ],
          }),
        }),
      },
    });

    const quizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-alice',
      },
      body: JSON.stringify({
        subject: 'Math',
        topic: 'Set Theory',
        difficulty: 'Beginner',
        questionCount: 3,
      }),
    });
    expect(quizRes.status).toBe(200);
    const quiz = await quizRes.json();
    expect(quiz.sessionToken).toBeTruthy();

    // Simulate cold Vercel function instance (empty in-memory store)
    serverQuizStore.clear();

    // Attacker Bob attempts to submit Alice's quiz using her sessionToken
    const bobRes = await fetch(`${baseUrl}/api/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-bob',
      },
      body: JSON.stringify({
        quizId: quiz.id,
        userAnswers: { q1: 'A', q2: 'B', q3: 'C' },
        sessionToken: quiz.sessionToken,
      }),
    });
    expect(bobRes.status).toBe(403);

    // Alice submits using her sessionToken after cold start -> succeeds
    const aliceRes = await fetch(`${baseUrl}/api/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-alice',
      },
      body: JSON.stringify({
        quizId: quiz.id,
        userAnswers: { q1: 'A', q2: 'B', q3: 'C' },
        sessionToken: quiz.sessionToken,
      }),
    });
    expect(aliceRes.status).toBe(200);
    const score = await aliceRes.json();
    expect(score.score).toBe(3);
    expect(score.percentage).toBe(100);
  });
});
