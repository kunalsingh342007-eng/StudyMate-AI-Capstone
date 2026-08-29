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
} from './prompts.js';
import {
  StudyPlanOutputSchema,
  TopicExplanationSchema,
  QuizOutputSchema,
  AdaptedPlanResponseSchema,
} from '../src/lib/schemas.js';
import {
  StudyPlanRequest,
  StudyPlan,
  ExplainRequest,
  TopicExplanation,
  QuizRequest,
  Quiz,
  AdaptPlanRequest,
  AdaptedPlanResponse,
  AIStatus,
} from '../src/types/index.js';
import {
  generateDemoStudyPlan,
  generateDemoExplanation,
  generateDemoQuiz,
  generateDemoAdaptedPlan,
} from './demoFallback.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
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
    return 'gemini-3.7-flash';
  }
  return 'offline-template-engine';
}

export function getAIStatus(): AIStatus {
  const hasGemini = !!getGeminiClient();

  if (hasGemini) {
    return {
      isConfigured: true,
      provider: 'Google Gemini',
      model: 'gemini-3.7-flash',
      status: 'ready',
      message: 'StudyMate AI is powered by Google Gemini (gemini-3.7-flash).',
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
  const modelsToTry = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
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

export async function generateStudyPlan(req: StudyPlanRequest): Promise<StudyPlan> {
  const userPrompt = buildStudyPlanUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(STUDY_PLANNER_SYSTEM_PROMPT, userPrompt);
      const validated = StudyPlanOutputSchema.parse(parsedJson);

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
        totalDays: validated.totalDays,
        totalStudyHours: validated.totalStudyHours,
        assumptions: validated.assumptions,
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

export async function generateQuiz(req: QuizRequest): Promise<Quiz> {
  const userPrompt = buildQuizUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(QUIZ_SYSTEM_PROMPT, userPrompt);
      const validated = QuizOutputSchema.parse(parsedJson);

      return {
        id: `quiz-${Date.now()}`,
        subject: req.subject,
        topic: req.topic,
        difficulty: req.difficulty,
        createdAt: new Date().toISOString(),
        questions: validated.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q-${idx + 1}`,
        })),
        isDemoFallback: false,
      };
    } catch (geminiErr: any) {
      console.warn('[StudyMate Server] Gemini API quiz error, falling back:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Structured fallback
  return generateDemoQuiz(req);
}

export async function adaptPlan(req: AdaptPlanRequest): Promise<AdaptedPlanResponse> {
  const userPrompt = buildAdaptPlanUserPrompt(req);

  // 1. Try Gemini API directly
  if (getGeminiClient()) {
    try {
      const parsedJson = await generateWithGemini(ADAPT_PLAN_SYSTEM_PROMPT, userPrompt);
      const validated = AdaptedPlanResponseSchema.parse(parsedJson);

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
