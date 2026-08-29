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
} from '../../types';

class ApiError extends Error {
  constructor(public message: string, public status?: number, public retryable: boolean = true) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 45000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
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

export const ApiClient = {
  async getStatus(): Promise<AIStatus> {
    try {
      const res = await fetchWithTimeout('/api/status', { method: 'GET' }, 10000);
      if (!res.ok) {
        return {
          isConfigured: false,
          provider: 'Anthropic Claude',
          model: 'claude-3-5-sonnet-20241022',
          status: 'error',
          message: 'Server status check returned an error.',
        };
      }
      return await res.json();
    } catch {
      return {
        isConfigured: false,
        provider: 'Anthropic Claude',
        model: 'claude-3-5-sonnet-20241022',
        status: 'error',
        message: 'Could not reach server status endpoint. Operating in offline demo mode.',
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
      const err = await res.json().catch(() => ({ error: 'Failed to generate study plan' }));
      throw new ApiError(err.error || 'We could not generate your study plan right now. Please try again.', res.status);
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
      const err = await res.json().catch(() => ({ error: 'Failed to explain topic' }));
      throw new ApiError(err.error || 'We could not explain this topic right now. Please try again.', res.status);
    }

    return await res.json();
  },

  async generateQuiz(req: QuizRequest): Promise<Quiz> {
    const res = await fetchWithTimeout('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate quiz' }));
      throw new ApiError(err.error || 'We could not generate your quiz right now. Please try again.', res.status);
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
      const err = await res.json().catch(() => ({ error: 'Failed to adapt study plan' }));
      throw new ApiError(err.error || 'We could not adapt your study plan right now. Please try again.', res.status);
    }

    return await res.json();
  },
};
