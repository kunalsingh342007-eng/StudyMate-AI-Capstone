import {
  StudyPlanRequest,
  StudyPlan,
  ExplainRequest,
  TopicExplanation,
  QuizRequest,
  ClientQuiz,
  QuizAnswerRequest,
  QuizAnswerResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
  AdaptPlanRequest,
  AdaptedPlanResponse,
  ExplainMistakeRequest,
  MistakeExplanation,
  ParseSyllabusRequest,
  ParsedSyllabus,
  AIStatus,
} from '../../types';

import { auth } from '../firebase/firebase';

class ApiError extends Error {
  constructor(public message: string, public status?: number, public retryable: boolean = true) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined' && auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // Continue gracefully if token cannot be fetched
    }
  }
  return {};
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 45000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeaders = await getAuthHeader();
    const headers = {
      ...authHeaders,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError('The request timed out while generating your response. Please try again.', 408, true);
    }
    throw new ApiError(
      'Unable to connect to the StudyMate server. Please check your connection and try again.',
      0,
      true
    );
  }
}

const quizSessionTokens = new Map<string, string>();

async function parseErrorResponse(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const err = await res.json();
      if (err?.error && typeof err.error === 'string') {
        return err.error;
      }
    } else {
      const text = await res.text();
      if (text && text.trim().length > 0 && !text.trim().startsWith('<')) {
        return text.trim().slice(0, 200);
      }
    }
  } catch {
    // Fall back to default message
  }
  return fallbackMessage;
}

export const ApiClient = {
  async getStatus(checkLive = false): Promise<AIStatus> {
    try {
      const endpoint = checkLive ? '/api/status?live=true' : '/api/status';
      const res = await fetchWithTimeout(endpoint, { method: 'GET' }, 12000);
      if (!res.ok) {
        const msg = await parseErrorResponse(res, 'Server status check returned an error.');
        return {
          isConfigured: false,
          provider: 'Google Gemini',
          model: 'gemini-4-hydrogen',
          status: 'error',
          message: msg,
        };
      }
      return await res.json();
    } catch {
      return {
        isConfigured: false,
        provider: 'Google Gemini',
        model: 'gemini-4-hydrogen',
        status: 'error',
        message: 'Could not reach server status endpoint.',
      };
    }
  },

  async generateStudyPlan(req: StudyPlanRequest): Promise<StudyPlan> {
    const res = await fetchWithTimeout('/api/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not generate your study plan right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async explainTopic(req: ExplainRequest): Promise<TopicExplanation> {
    const res = await fetchWithTimeout('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not explain this topic right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async generateQuiz(req: QuizRequest): Promise<ClientQuiz> {
    const res = await fetchWithTimeout('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not generate your quiz right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    const quiz: ClientQuiz = await res.json();
    if (quiz?.id && quiz?.sessionToken) {
      quizSessionTokens.set(quiz.id, quiz.sessionToken);
    }
    return quiz;
  },

  async answerQuizQuestion(req: QuizAnswerRequest): Promise<QuizAnswerResponse> {
    const sessionToken = req.sessionToken || quizSessionTokens.get(req.quizId);
    const res = await fetchWithTimeout('/api/quiz/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionToken ? { ...req, sessionToken } : req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'Could not verify your answer. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async submitQuiz(req: QuizSubmitRequest): Promise<QuizSubmitResponse> {
    const sessionToken = req.sessionToken || quizSessionTokens.get(req.quizId);
    const res = await fetchWithTimeout('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionToken ? { ...req, sessionToken } : req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'Could not score your quiz. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async adaptPlan(req: AdaptPlanRequest): Promise<AdaptedPlanResponse> {
    const res = await fetchWithTimeout('/api/adapt-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not adapt your study plan right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async explainMistake(req: ExplainMistakeRequest): Promise<MistakeExplanation> {
    const res = await fetchWithTimeout('/api/explain-mistake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not analyze this mistake right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },

  async parseSyllabus(req: ParseSyllabusRequest): Promise<ParsedSyllabus> {
    const res = await fetchWithTimeout('/api/parse-syllabus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const msg = await parseErrorResponse(res, 'We could not parse your syllabus right now. Please try again.');
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  },
};

