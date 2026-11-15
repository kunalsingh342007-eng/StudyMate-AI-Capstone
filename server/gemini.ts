import { GoogleGenAI } from '@google/genai';
import { ZodError } from 'zod';
import {
  STUDY_PLANNER_SYSTEM_PROMPT,
  buildStudyPlanUserPrompt,
  TOPIC_EXPLAINER_SYSTEM_PROMPT,
  buildExplainUserPrompt,
  QUIZ_SYSTEM_PROMPT,
  buildQuizUserPrompt,
  ADAPT_PLAN_SYSTEM_PROMPT,
  buildAdaptPlanUserPrompt,
  MISTAKE_EXPLAINER_SYSTEM_PROMPT,
  buildMistakeExplainUserPrompt,
  SYLLABUS_PARSER_SYSTEM_PROMPT,
  buildSyllabusParseUserPrompt,
} from './prompts.js';
import {
  StudyPlanOutputSchema,
  TopicExplanationSchema,
  QuizOutputSchema,
  AdaptedPlanResponseSchema,
  MistakeExplanationSchema,
  ParsedSyllabusSchema,
} from '../src/lib/schemas.js';
import {
  StudyPlanRequest,
  StudyPlan,
  ExplainRequest,
  TopicExplanation,
  QuizRequest,
  ServerQuiz,
  ServerQuizQuestion,
  AdaptPlanRequest,
  AdaptedPlanResponse,
  ExplainMistakeRequest,
  MistakeExplanation,
  ParsedSyllabus,
  AIStatus,
} from '../src/types/index.js';
import {
  generateDemoStudyPlan,
  generateDemoExplanation,
  generateDemoQuiz,
  generateDemoAdaptedPlan,
  generateDemoMistakeExplanation,
  generateDemoParsedSyllabus,
} from './demoFallback.js';
import { serverQuizStore } from './quizStore.js';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_GEMINI_TIMEOUT_MS = 25000;

export type GeminiErrorCategory =
  | 'missing_api_key'
  | 'authentication'
  | 'invalid_model'
  | 'quota_exceeded'
  | 'timeout'
  | 'malformed_response'
  | 'provider_error';

export class GeminiServiceError extends Error {
  public readonly code: string;
  public readonly category: GeminiErrorCategory;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(params: {
    message: string;
    userMessage: string;
    code: string;
    category: GeminiErrorCategory;
    statusCode: number;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'GeminiServiceError';
    this.userMessage = params.userMessage;
    this.code = params.code;
    this.category = params.category;
    this.statusCode = params.statusCode;
    this.retryable = params.retryable ?? false;
  }
}

export interface GeminiClientLike {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      config?: {
        systemInstruction?: string;
        responseMimeType?: string;
      };
    }) => Promise<{ text?: string }>;
  };
}

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;
let testClientOverride: GeminiClientLike | null | undefined = undefined;

export function setGeminiTestClient(client: GeminiClientLike | null | undefined): void {
  testClientOverride = client;
}

function isAutomatedTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
}

export function getConfiguredModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  return envModel && envModel.length > 0 ? envModel : DEFAULT_GEMINI_MODEL;
}

function getTimeoutMs(): number {
  const parsed = Number(process.env.GEMINI_TIMEOUT_MS);
  if (!isNaN(parsed) && parsed >= 100 && parsed <= 120000) {
    return parsed;
  }
  return DEFAULT_GEMINI_TIMEOUT_MS;
}

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function getGeminiClient(): GeminiClientLike | null {
  if (testClientOverride !== undefined) {
    return testClientOverride;
  }

  // During Vitest suite runs without an explicit mock client, allow deterministic test fixtures
  if (isAutomatedTestRuntime()) {
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }

  return cachedClient;
}

export function getSelectedModel(): string {
  if (getApiKey() || testClientOverride) {
    return getConfiguredModel();
  }
  return 'unconfigured';
}

export function getAIStatus(): AIStatus {
  const hasKey = Boolean(getApiKey()) || Boolean(testClientOverride);
  const model = getConfiguredModel();

  if (hasKey) {
    return {
      isConfigured: true,
      provider: 'Google Gemini',
      model,
      status: 'ready',
      message: `StudyMate AI is configured with Google Gemini (${model}).`,
    };
  }

  return {
    isConfigured: false,
    provider: 'Google Gemini',
    model,
    status: 'missing_api_key',
    message:
      'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in your environment variables to enable AI features.',
  };
}

export function classifyGeminiError(err: any): GeminiServiceError {
  if (err instanceof GeminiServiceError) {
    return err;
  }

  const rawMsg = String(err?.message || err || '');
  const lowerMsg = rawMsg.toLowerCase();
  const status = Number(err?.status || err?.statusCode || err?.code || err?.error?.code || 0);
  const apiStatus = String(err?.error?.status || err?.statusText || '').toUpperCase();

  if (
    err?.name === 'AbortError' ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('etimedout') ||
    status === 504 ||
    status === 408
  ) {
    return new GeminiServiceError({
      message: `Gemini request timed out: ${rawMsg}`,
      userMessage: 'The AI service took too long to respond. Please try again.',
      code: 'GEMINI_TIMEOUT',
      category: 'timeout',
      statusCode: 504,
      retryable: true,
    });
  }

  if (
    status === 401 ||
    status === 403 ||
    apiStatus === 'PERMISSION_DENIED' ||
    apiStatus === 'UNAUTHENTICATED' ||
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('invalid api key') ||
    lowerMsg.includes('permission denied')
  ) {
    return new GeminiServiceError({
      message: `Gemini authentication failure (${status || apiStatus || 'auth'}): ${rawMsg}`,
      userMessage:
        'AI service authentication failed on the server. Please verify the server GEMINI_API_KEY configuration.',
      code: 'GEMINI_AUTH_ERROR',
      category: 'authentication',
      statusCode: 503,
      retryable: false,
    });
  }

  if (
    status === 404 ||
    apiStatus === 'NOT_FOUND' ||
    (lowerMsg.includes('model') && (lowerMsg.includes('not found') || lowerMsg.includes('not supported')))
  ) {
    return new GeminiServiceError({
      message: `Gemini model unavailable (${status || '404'}): ${rawMsg}`,
      userMessage: 'The configured AI model is unavailable. Please try again or check server model configuration.',
      code: 'GEMINI_INVALID_MODEL',
      category: 'invalid_model',
      statusCode: 502,
      retryable: false,
    });
  }

  if (
    status === 429 ||
    apiStatus === 'RESOURCE_EXHAUSTED' ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate limit')
  ) {
    return new GeminiServiceError({
      message: `Gemini quota or rate limit exceeded: ${rawMsg}`,
      userMessage: 'AI service quota or rate limit reached. Please wait a moment and try again.',
      code: 'GEMINI_QUOTA_EXCEEDED',
      category: 'quota_exceeded',
      statusCode: 429,
      retryable: true,
    });
  }

  if (
    err instanceof SyntaxError ||
    err instanceof ZodError ||
    lowerMsg.includes('json') ||
    lowerMsg.includes('empty response') ||
    lowerMsg.includes('missing required') ||
    lowerMsg.includes('insufficient valid questions')
  ) {
    return new GeminiServiceError({
      message: `Malformed AI output: ${rawMsg}`,
      userMessage: 'The AI returned an incomplete or invalid response format. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
      retryable: false,
    });
  }

  return new GeminiServiceError({
    message: `Gemini provider error (${status || 'unknown'}): ${rawMsg}`,
    userMessage: 'The AI service is temporarily unavailable. Please try again shortly.',
    code: 'GEMINI_PROVIDER_ERROR',
    category: 'provider_error',
    statusCode: 502,
    retryable: true,
  });
}

function extractJSON(text: string): any {
  const cleanedRaw = text.trim();
  if (!cleanedRaw) {
    throw new GeminiServiceError({
      message: 'Gemini returned an empty response body.',
      userMessage: 'The AI returned an empty response. Please try again.',
      code: 'GEMINI_EMPTY_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
      retryable: false,
    });
  }

  let cleaned = cleanedRaw;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseErr: any) {
    throw new GeminiServiceError({
      message: `Failed to parse Gemini JSON output: ${parseErr?.message || parseErr}`,
      userMessage: 'The AI returned an unreadable response format. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
      retryable: false,
    });
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new GeminiServiceError({
              message: `${label} timed out after ${timeoutMs}ms`,
              userMessage: 'The AI service took too long to respond. Please try again.',
              code: 'GEMINI_TIMEOUT',
              category: 'timeout',
              statusCode: 504,
              retryable: true,
            })
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function generateWithGemini(systemInstruction: string, prompt: string): Promise<any> {
  const client = getGeminiClient();
  if (!client) {
    throw new GeminiServiceError({
      message: 'GEMINI_API_KEY is not configured on the server.',
      userMessage: 'AI service is not configured on the server. Please configure GEMINI_API_KEY.',
      code: 'GEMINI_MISSING_API_KEY',
      category: 'missing_api_key',
      statusCode: 503,
      retryable: false,
    });
  }

  const primaryModel = getConfiguredModel();
  const modelsToTry =
    primaryModel === FALLBACK_GEMINI_MODEL
      ? [primaryModel]
      : [primaryModel, FALLBACK_GEMINI_MODEL];
  const timeoutMs = getTimeoutMs();

  let lastClassifiedError: GeminiServiceError | null = null;

  for (let idx = 0; idx < modelsToTry.length; idx++) {
    const model = modelsToTry[idx];
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
        timeoutMs,
        `Gemini generateContent (${model})`
      );

      const text = response?.text;
      if (!text || text.trim().length === 0) {
        throw new GeminiServiceError({
          message: `Empty response from Gemini model ${model}`,
          userMessage: 'The AI returned an empty response. Please try again.',
          code: 'GEMINI_EMPTY_RESPONSE',
          category: 'malformed_response',
          statusCode: 502,
          retryable: false,
        });
      }

      return extractJSON(text);
    } catch (err: any) {
      const classified = classifyGeminiError(err);
      lastClassifiedError = classified;

      // Never retry on authentication or malformed response errors
      if (classified.category === 'authentication' || classified.category === 'malformed_response') {
        throw classified;
      }

      const hasNextModel = idx < modelsToTry.length - 1;
      if (hasNextModel && (classified.retryable || classified.category === 'invalid_model')) {
        console.warn(
          `[StudyMate Gemini] Model "${model}" failed (${classified.category}), trying fallback "${modelsToTry[idx + 1]}".`
        );
        continue;
      }

      throw classified;
    }
  }

  throw (
    lastClassifiedError ||
    new GeminiServiceError({
      message: 'Failed to generate response using Gemini models.',
      userMessage: 'The AI service failed to generate a response. Please try again.',
      code: 'GEMINI_PROVIDER_ERROR',
      category: 'provider_error',
      statusCode: 502,
      retryable: true,
    })
  );
}

export async function testGeminiConnectivity(): Promise<{
  ok: boolean;
  model: string;
  latencyMs: number;
  category?: GeminiErrorCategory;
  code?: string;
  message: string;
}> {
  const model = getConfiguredModel();
  const client = getGeminiClient();

  if (!client) {
    return {
      ok: false,
      model,
      latencyMs: 0,
      category: 'missing_api_key',
      code: 'GEMINI_MISSING_API_KEY',
      message: 'GEMINI_API_KEY is not configured in the server environment.',
    };
  }

  const start = Date.now();
  try {
    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: 'Respond with valid JSON: {"ok":true}',
        config: {
          responseMimeType: 'application/json',
        },
      }),
      Math.min(getTimeoutMs(), 10000),
      'Gemini connectivity check'
    );
    const parsed = extractJSON(response?.text || '');
    return {
      ok: Boolean(parsed),
      model,
      latencyMs: Date.now() - start,
      message: `Successfully connected to Google Gemini (${model}).`,
    };
  } catch (err: any) {
    const classified = classifyGeminiError(err);
    return {
      ok: false,
      model,
      latencyMs: Date.now() - start,
      category: classified.category,
      code: classified.code,
      message: classified.userMessage,
    };
  }
}

/**
 * Deterministic business rule validation for AI-generated quiz questions
 */
function validateAndSanitizeQuizQuestions(rawQuestions: any[], minCount: number): ServerQuizQuestion[] {
  if (!Array.isArray(rawQuestions)) return [];

  const validated: ServerQuizQuestion[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q !== 'object') continue;

    const questionText = typeof q.question === 'string' ? q.question.trim() : '';
    if (questionText.length < 5) continue;

    if (!Array.isArray(q.options) || q.options.length !== 4) continue;

    const options = q.options.map((opt: any) => (typeof opt === 'string' ? opt.trim() : '')).filter(Boolean);
    if (options.length !== 4) continue;

    // Check distinct options
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== 4) continue;

    const rawCorrect = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
    const exactMatch = options.find((opt: string) => opt.toLowerCase() === rawCorrect.toLowerCase());
    if (!exactMatch) continue;

    const explanation =
      typeof q.explanation === 'string' && q.explanation.trim().length >= 10
        ? q.explanation.trim()
        : `The correct answer is ${exactMatch}. Review the core conceptual mechanics for this topic.`;

    let id = typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `q-${i + 1}`;
    if (seenIds.has(id)) {
      id = `q-${i + 1}-${Date.now()}`;
    }
    seenIds.add(id);

    validated.push({
      id,
      question: questionText,
      options,
      correctAnswer: exactMatch,
      explanation,
    });
  }

  if (validated.length < minCount) {
    throw new GeminiServiceError({
      message: `Insufficient valid questions generated by AI: got ${validated.length}, minimum required is ${minCount}`,
      userMessage: 'The AI returned fewer valid questions than requested. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
      retryable: true,
    });
  }

  return validated;
}

function shouldUseAutomatedTestFixture(): boolean {
  return isAutomatedTestRuntime() && testClientOverride === undefined;
}

export async function generateStudyPlan(req: StudyPlanRequest): Promise<StudyPlan> {
  if (shouldUseAutomatedTestFixture()) {
    return generateDemoStudyPlan(req);
  }

  const userPrompt = buildStudyPlanUserPrompt(req);
  const parsedJson = await generateWithGemini(STUDY_PLANNER_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = StudyPlanOutputSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  if (!validated.tasks || validated.tasks.length === 0) {
    throw new GeminiServiceError({
      message: 'AI output did not contain any study tasks',
      userMessage: 'The AI generated an empty study schedule. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
    });
  }

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    subject: req.subject,
    examDate: req.examDate,
    dailyHours: req.dailyHours,
    level: req.level,
    topics: req.topics,
    weakTopics: req.weakTopics,
    preferredDays: req.preferredDays,
    tasks: validated.tasks.map((t, idx) => {
      const dailyMax = Math.round(req.dailyHours * 60);
      const clampedDuration = Math.min(dailyMax, Math.max(25, t.durationMinutes || 60));
      return {
        ...t,
        id: t.id || `task-${idx + 1}`,
        durationMinutes: clampedDuration,
        status: 'pending' as const,
      };
    }),
    totalDays: validated.totalDays > 0 ? validated.totalDays : Math.ceil(validated.tasks.length / 2),
    totalStudyHours:
      validated.totalStudyHours > 0
        ? validated.totalStudyHours
        : Math.round((validated.tasks.reduce((sum, t) => sum + (t.durationMinutes || 60), 0) / 60) * 10) / 10,
    assumptions:
      Array.isArray(validated.assumptions) && validated.assumptions.length > 0
        ? validated.assumptions
        : ['Paced according to available daily hours', 'Dedicated revision intervals incorporated'],
    isDemoFallback: false,
  };
}

export async function generateExplanation(req: ExplainRequest): Promise<TopicExplanation> {
  if (shouldUseAutomatedTestFixture()) {
    return generateDemoExplanation(req);
  }

  const userPrompt = buildExplainUserPrompt(req);
  const parsedJson = await generateWithGemini(TOPIC_EXPLAINER_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = TopicExplanationSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  if (!validated.simpleExplanation || !validated.realWorldAnalogy || !Array.isArray(validated.stepByStepExplanation)) {
    throw new GeminiServiceError({
      message: 'AI explanation output missing required conceptual layers',
      userMessage: 'The AI returned an incomplete topic explanation. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
    });
  }

  return {
    id: `explain-${Date.now()}`,
    topic: req.topic,
    level: req.level,
    simpleExplanation: validated.simpleExplanation,
    realWorldAnalogy: validated.realWorldAnalogy,
    stepByStepExplanation: validated.stepByStepExplanation,
    example: validated.example,
    commonMistakes: validated.commonMistakes,
    quickRevisionNotes: validated.quickRevisionNotes,
    practiceQuestions: validated.practiceQuestions,
    isDemoFallback: false,
  };
}

export async function generateQuiz(req: QuizRequest): Promise<ServerQuiz> {
  if (shouldUseAutomatedTestFixture()) {
    const demoQuiz = generateDemoQuiz(req);
    serverQuizStore.saveQuiz(demoQuiz);
    return demoQuiz;
  }

  const userPrompt = buildQuizUserPrompt(req);
  const parsedJson = await generateWithGemini(QUIZ_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = QuizOutputSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  const minRequired = Math.min(req.questionCount, 3);
  const sanitizedQuestions = validateAndSanitizeQuizQuestions(validated.questions, minRequired);

  const serverQuiz: ServerQuiz = {
    id: `quiz-${Date.now()}`,
    subject: req.subject,
    topic: req.topic,
    difficulty: req.difficulty,
    createdAt: new Date().toISOString(),
    questions: sanitizedQuestions,
    isDemoFallback: false,
  };

  serverQuizStore.saveQuiz(serverQuiz);
  return serverQuiz;
}

export async function adaptPlan(req: AdaptPlanRequest): Promise<AdaptedPlanResponse> {
  if (shouldUseAutomatedTestFixture()) {
    return generateDemoAdaptedPlan(req);
  }

  const userPrompt = buildAdaptPlanUserPrompt(req);
  const parsedJson = await generateWithGemini(ADAPT_PLAN_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = AdaptedPlanResponseSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  if (!validated.updatedTasks || validated.updatedTasks.length === 0) {
    throw new GeminiServiceError({
      message: 'Adapted plan produced empty tasks array',
      userMessage: 'The AI returned an empty adapted schedule. Please try again.',
      code: 'GEMINI_MALFORMED_RESPONSE',
      category: 'malformed_response',
      statusCode: 502,
    });
  }

  return {
    updatedTasks: validated.updatedTasks,
    redistributionSummary: validated.redistributionSummary,
    priorityOrder: validated.priorityOrder,
    encouragementMessage: validated.encouragementMessage,
    isDemoFallback: false,
  };
}

export async function explainMistake(req: ExplainMistakeRequest): Promise<MistakeExplanation> {
  if (shouldUseAutomatedTestFixture()) {
    return generateDemoMistakeExplanation(req);
  }

  const userPrompt = buildMistakeExplainUserPrompt(req);
  const parsedJson = await generateWithGemini(MISTAKE_EXPLAINER_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = MistakeExplanationSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  return {
    whatWasMisunderstood: validated.whatWasMisunderstood,
    whySelectedWasWrong: validated.whySelectedWasWrong,
    whyCorrectWorks: validated.whyCorrectWorks,
    simpleExample: validated.simpleExample,
    keyTakeaway: validated.keyTakeaway,
    followUpQuestion: validated.followUpQuestion,
  };
}

export async function parseSyllabus(rawText: string, targetExamName?: string): Promise<ParsedSyllabus> {
  if (shouldUseAutomatedTestFixture()) {
    return generateDemoParsedSyllabus(rawText, targetExamName);
  }

  const userPrompt = buildSyllabusParseUserPrompt(rawText, targetExamName);
  const parsedJson = await generateWithGemini(SYLLABUS_PARSER_SYSTEM_PROMPT, userPrompt);

  let validated;
  try {
    validated = ParsedSyllabusSchema.parse(parsedJson);
  } catch (err: any) {
    throw classifyGeminiError(err);
  }

  return {
    subject: validated.subject,
    targetExamName: validated.targetExamName,
    topics: validated.topics,
    totalEstimatedHours: validated.totalEstimatedHours,
  };
}


