import { GoogleGenAI } from '@google/genai';
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

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  // During tests, avoid slow network timeouts and use fast deterministic responses
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export function getSelectedModel(): string {
  if (getGeminiClient()) {
    return 'gemini-3.8-flash';
  }
  return 'offline-template-engine';
}

export function getAIStatus(): AIStatus {
  const hasGemini = !!getGeminiClient();

  if (hasGemini) {
    return {
      isConfigured: true,
      provider: 'Google Gemini',
      model: 'gemini-3.8-flash',
      status: 'ready',
      message: 'StudyMate AI is powered by Google Gemini (gemini-3.8-flash).',
    };
  }

  return {
    isConfigured: false,
    provider: 'StudyMate Demo Engine',
    model: 'offline-pedagogical-template',
    status: 'missing_api_key',
    message: 'Operating in demo mode with schema-compliant educational templates. Connect GEMINI_API_KEY for dynamic inference.',
  };
}

function extractJSON(text: string): any {
  let cleaned = text.trim();
  // Remove markdown JSON code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  // If there are surrounding characters, locate the outer { ... } or [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

async function generateWithGemini(systemInstruction: string, prompt: string): Promise<any> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  // Model fallback cascade in case of high demand spikes
  // Using valid supported Gemini models per guidelines
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return extractJSON(text);
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      const errCode = err?.status || err?.code || (err?.error && err?.error?.code);
      if (errCode === 503 || errCode === 429 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('ResourceExhausted')) {
        console.warn(`[StudyMate Server] Model ${model} under temporary load, switching to next model...`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      continue;
    }
  }

  throw lastError || new Error('Failed to generate response using Gemini models');
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
    // Match against options
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
    throw new Error(`Insufficient valid questions generated by AI: got ${validated.length}, minimum required is ${minCount}`);
  }

  return validated;
}

export async function generateStudyPlan(req: StudyPlanRequest): Promise<StudyPlan> {
  const userPrompt = buildStudyPlanUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(STUDY_PLANNER_SYSTEM_PROMPT, userPrompt);
      const validated = StudyPlanOutputSchema.parse(parsedJson);

      if (!validated.tasks || validated.tasks.length === 0) {
        throw new Error('AI output did not contain any study tasks');
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
        tasks: validated.tasks.map((t, idx) => ({
          ...t,
          id: t.id || `task-${idx + 1}`,
          status: 'pending' as const,
        })),
        totalDays: validated.totalDays > 0 ? validated.totalDays : Math.ceil(validated.tasks.length / 2),
        totalStudyHours: validated.totalStudyHours > 0 ? validated.totalStudyHours : Math.round((validated.tasks.reduce((sum, t) => sum + (t.durationMinutes || 60), 0) / 60) * 10) / 10,
        assumptions: Array.isArray(validated.assumptions) && validated.assumptions.length > 0
          ? validated.assumptions
          : ['Paced according to available daily hours', 'Dedicated revision intervals incorporated'],
        isDemoFallback: false,
      };
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API error, falling back to structured template:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoStudyPlan(req);
}

export async function generateExplanation(req: ExplainRequest): Promise<TopicExplanation> {
  const userPrompt = buildExplainUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(TOPIC_EXPLAINER_SYSTEM_PROMPT, userPrompt);
      const validated = TopicExplanationSchema.parse(parsedJson);

      if (!validated.simpleExplanation || !validated.realWorldAnalogy || !Array.isArray(validated.stepByStepExplanation)) {
        throw new Error('AI explanation output missing required conceptual layers');
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
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API explanation error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoExplanation(req);
}

export async function generateQuiz(req: QuizRequest): Promise<ServerQuiz> {
  const userPrompt = buildQuizUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(QUIZ_SYSTEM_PROMPT, userPrompt);
      const validated = QuizOutputSchema.parse(parsedJson);

      // Apply rigorous deterministic verification
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

      // Store in authoritative server store
      serverQuizStore.saveQuiz(serverQuiz);

      return serverQuiz;
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API quiz error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  const demoQuiz = generateDemoQuiz(req);
  serverQuizStore.saveQuiz(demoQuiz);
  return demoQuiz;
}

export async function adaptPlan(req: AdaptPlanRequest): Promise<AdaptedPlanResponse> {
  const userPrompt = buildAdaptPlanUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(ADAPT_PLAN_SYSTEM_PROMPT, userPrompt);
      const validated = AdaptedPlanResponseSchema.parse(parsedJson);

      if (!validated.updatedTasks || validated.updatedTasks.length === 0) {
        throw new Error('Adapted plan produced empty tasks array');
      }

      return {
        updatedTasks: validated.updatedTasks,
        redistributionSummary: validated.redistributionSummary,
        priorityOrder: validated.priorityOrder,
        encouragementMessage: validated.encouragementMessage,
        isDemoFallback: false,
      };
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API adaptive plan error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoAdaptedPlan(req);
}

export async function explainMistake(req: ExplainMistakeRequest): Promise<MistakeExplanation> {
  const userPrompt = buildMistakeExplainUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(MISTAKE_EXPLAINER_SYSTEM_PROMPT, userPrompt);
      const validated = MistakeExplanationSchema.parse(parsedJson);

      return {
        whatWasMisunderstood: validated.whatWasMisunderstood,
        whySelectedWasWrong: validated.whySelectedWasWrong,
        whyCorrectWorks: validated.whyCorrectWorks,
        simpleExample: validated.simpleExample,
        keyTakeaway: validated.keyTakeaway,
        followUpQuestion: validated.followUpQuestion,
      };
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API mistake diagnosis error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoMistakeExplanation(req);
}

export async function parseSyllabus(rawText: string, targetExamName?: string): Promise<ParsedSyllabus> {
  const userPrompt = buildSyllabusParseUserPrompt(rawText, targetExamName);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(SYLLABUS_PARSER_SYSTEM_PROMPT, userPrompt);
      const validated = ParsedSyllabusSchema.parse(parsedJson);

      return {
        subject: validated.subject,
        targetExamName: validated.targetExamName,
        topics: validated.topics,
        totalEstimatedHours: validated.totalEstimatedHours,
      };
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API syllabus parse error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoParsedSyllabus(rawText, targetExamName);
}


