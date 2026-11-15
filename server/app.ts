import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import {
  generateStudyPlan,
  generateExplanation,
  generateQuiz,
  adaptPlan,
  getAIStatus,
  explainMistake,
  parseSyllabus,
  testGeminiConnectivity,
  GeminiServiceError,
} from './gemini.js';
import { serverQuizStore, toClientQuiz } from './quizStore.js';
import { aiEndpointsLimiter } from './rateLimiter.js';
import {
  validateStudyPlanInput,
  validateExplainInput,
  validateQuizInput,
  validateQuizAnswerInput,
  validateQuizSubmitInput,
  validateAdaptPlanInput,
  validateExplainMistakeInput,
  validateParseSyllabusInput,
} from './validators.js';
import { ConfidenceLevel } from '../src/types/index.js';
import { authenticateToken } from './authMiddleware.js';

function getRequestId(req: Request): string {
  const existing = (req as any).requestId;
  if (typeof existing === 'string' && existing.length > 0) return existing;
  const headerId = req.headers['x-request-id'];
  const id = typeof headerId === 'string' && headerId.trim() ? headerId.trim().slice(0, 64) : crypto.randomUUID();
  (req as any).requestId = id;
  return id;
}

function logServerError(params: {
  requestId: string;
  route: string;
  operation: string;
  category: string;
  statusCode: number;
  context?: Record<string, string | number | boolean | undefined>;
}) {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'studymate-api',
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
      route: params.route,
      operation: params.operation,
      errorCategory: params.category,
      statusCode: params.statusCode,
      ...(params.context ? { context: params.context } : {}),
    })
  );
}

function sendAIErrorResponse(
  req: Request,
  res: Response,
  route: string,
  operation: string,
  error: any,
  fallbackMessage: string
) {
  const requestId = getRequestId(req);

  if (error instanceof GeminiServiceError) {
    logServerError({
      requestId,
      route,
      operation,
      category: error.category,
      statusCode: error.statusCode,
      context: { code: error.code, retryable: error.retryable },
    });
    return res.status(error.statusCode).json({
      error: error.userMessage,
      code: error.code,
      category: error.category,
      retryable: error.retryable,
      requestId,
    });
  }

  logServerError({
    requestId,
    route,
    operation,
    category: 'internal_error',
    statusCode: 500,
    context: { errorName: error?.name || 'Error' },
  });

  return res.status(500).json({
    error: fallbackMessage,
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
  });
}

export function createExpressApp() {
  const app = express();

  // Attach request ID header for safe diagnostics tracing
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = getRequestId(req);
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Parse JSON payloads with reasonable size limits
  app.use(express.json({ limit: '2mb' }));

  // Safe JSON parse error handler for malformed incoming payloads
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
      return res.status(400).json({
        error: 'Malformed JSON payload received in request.',
        code: 'INVALID_JSON',
        requestId: getRequestId(req),
      });
    }
    next(err);
  });

  // Attach verified user identity from Bearer token if provided
  app.use(authenticateToken);

  // Health check endpoint (fast, zero external network calls)
  app.get('/api/health', (req: Request, res: Response) => {
    const aiStatus = getAIStatus();
    res.json({
      status: 'healthy',
      app: 'StudyMate AI',
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-express',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      checks: {
        backend: 'ok',
        geminiConfigured: aiStatus.isConfigured,
        model: aiStatus.model,
      },
      requestId: getRequestId(req),
    });
  });

  // AI Service & Model status endpoint (supports ?live=true for rate-limited connectivity verification)
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const status = getAIStatus();
      const wantsLiveCheck = req.query.live === 'true' || req.query.check === 'live';

      if (!wantsLiveCheck) {
        return res.json(status);
      }

      // Rate-limit explicit live connectivity checks to prevent API abuse
      return aiEndpointsLimiter.middleware()(req, res, async () => {
        const liveCheck = await testGeminiConnectivity();
        return res.status(liveCheck.ok ? 200 : 503).json({
          ...status,
          status: liveCheck.ok ? 'ready' : 'error',
          message: liveCheck.message,
          liveCheck,
          requestId: getRequestId(req),
        });
      });
    } catch (err: any) {
      logServerError({
        requestId: getRequestId(req),
        route: '/api/status',
        operation: 'get_ai_status',
        category: 'status_check_error',
        statusCode: 500,
        context: { errorName: err?.name || 'Error' },
      });
      res.status(500).json({
        error: 'Failed to determine AI system status.',
        requestId: getRequestId(req),
      });
    }
  });

  // 1. Study Plan Generation Endpoint (Rate-limited, validated)
  app.post('/api/study-plan', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateStudyPlanInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid study plan request data.',
          requestId: getRequestId(req),
        });
      }

      const plan = await generateStudyPlan(validation.data);
      res.json(plan);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/study-plan',
        'generate_study_plan',
        error,
        'We could not generate your study plan right now. Please try again.'
      );
    }
  });

  // 2. Topic Explanation Endpoint (Rate-limited, validated)
  app.post('/api/explain', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateExplainInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid topic explanation request data.',
          requestId: getRequestId(req),
        });
      }

      const explanation = await generateExplanation(validation.data);
      res.json(explanation);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/explain',
        'generate_explanation',
        error,
        'We could not explain this topic right now. Please try again.'
      );
    }
  });

  // 3. AI Quiz Generation Endpoint (Rate-limited, validated, answer-shielded)
  app.post('/api/quiz', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateQuizInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid quiz generation request data.',
          requestId: getRequestId(req),
        });
      }

      const serverQuiz = await generateQuiz(validation.data);
      serverQuizStore.saveQuiz(serverQuiz, req.user?.uid);

      const clientQuiz = toClientQuiz(serverQuiz, req.user?.uid);
      res.json(clientQuiz);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/quiz',
        'generate_quiz',
        error,
        'We could not generate your quiz right now. Please try again.'
      );
    }
  });

  // 4. Quiz Single Question Answer Evaluation Endpoint (Server-authoritative validation)
  app.post('/api/quiz/answer', async (req: Request, res: Response) => {
    try {
      const validation = validateQuizAnswerInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid answer payload.',
          requestId: getRequestId(req),
        });
      }

      const { quizId, questionId, selectedAnswer, sessionToken } = validation.data;

      const resolved = serverQuizStore.resolveQuiz(quizId, req.user?.uid, sessionToken);
      if (resolved.forbidden) {
        return res.status(403).json({
          error: 'You do not have permission to submit answers to this quiz session.',
          requestId: getRequestId(req),
        });
      }

      const quiz = resolved.quiz;
      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz session not found or expired. Please generate a new quiz to continue.',
          requestId: getRequestId(req),
        });
      }

      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) {
        return res.status(400).json({
          error: 'The requested question was not found in this quiz.',
          requestId: getRequestId(req),
        });
      }

      const matchedOption = question.options.find(
        (opt) => opt.toLowerCase() === selectedAnswer.toLowerCase()
      );

      if (!matchedOption) {
        return res.status(400).json({
          error: 'Selected answer must be one of the available options for this question.',
          requestId: getRequestId(req),
        });
      }

      const isCorrect = matchedOption === question.correctAnswer;

      res.json({
        quizId: quiz.id,
        questionId: question.id,
        isCorrect,
        selectedAnswer: matchedOption,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    } catch (error: any) {
      logServerError({
        requestId: getRequestId(req),
        route: '/api/quiz/answer',
        operation: 'evaluate_quiz_answer',
        category: 'internal_error',
        statusCode: 500,
        context: { errorName: error?.name || 'Error' },
      });
      res.status(500).json({
        error: 'We could not evaluate this answer right now. Please try again.',
        requestId: getRequestId(req),
      });
    }
  });

  // 5. Quiz Complete Assessment Submission & Scoring Endpoint (Server-authoritative scoring)
  app.post('/api/quiz/submit', async (req: Request, res: Response) => {
    try {
      const validation = validateQuizSubmitInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid quiz submission payload.',
          requestId: getRequestId(req),
        });
      }

      const { quizId, userAnswers, confidenceMap, sessionToken } = validation.data;

      const resolved = serverQuizStore.resolveQuiz(quizId, req.user?.uid, sessionToken);
      if (resolved.forbidden) {
        return res.status(403).json({
          error: 'You do not have permission to evaluate or submit this quiz session.',
          requestId: getRequestId(req),
        });
      }

      const quiz = resolved.quiz;
      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz session not found or expired. Please generate a new quiz to continue.',
          requestId: getRequestId(req),
        });
      }

      let score = 0;
      const total = quiz.questions.length;
      const reviewQuestions = [];
      let misconceptionsCount = 0;
      let strongMasteryCount = 0;
      let unconfidentCount = 0;

      for (const q of quiz.questions) {
        const rawSelected = userAnswers[q.id];
        let matchedOption: string | null = null;
        let isCorrect = false;

        if (typeof rawSelected === 'string' && rawSelected.trim()) {
          matchedOption =
            q.options.find((opt) => opt.toLowerCase() === rawSelected.trim().toLowerCase()) || null;
          if (matchedOption && matchedOption === q.correctAnswer) {
            isCorrect = true;
            score += 1;
          }
        }

        const userConfidence: ConfidenceLevel = confidenceMap?.[q.id] || 'Medium';

        let alignment: 'Misconception' | 'Lucky Guess' | 'Strong Mastery' | 'Foundational Gap' = 'Foundational Gap';
        if (userConfidence === 'High' && !isCorrect) {
          alignment = 'Misconception';
          misconceptionsCount++;
        } else if (userConfidence === 'Low' && isCorrect) {
          alignment = 'Lucky Guess';
          unconfidentCount++;
        } else if (userConfidence === 'High' && isCorrect) {
          alignment = 'Strong Mastery';
          strongMasteryCount++;
        } else {
          alignment = 'Foundational Gap';
          if (userConfidence === 'Low') unconfidentCount++;
        }

        reviewQuestions.push({
          id: q.id,
          question: q.question,
          options: [...q.options],
          selectedAnswer: matchedOption || 'No answer selected',
          isCorrect,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          confidence: userConfidence,
          alignment,
        });
      }

      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      let recommendation = '';
      if (percentage === 100) {
        recommendation = `Flawless score! You have solid mastery of ${quiz.topic}. Try advancing to ${
          quiz.difficulty === 'Advanced' ? 'higher-level competitive problems' : 'Advanced difficulty'
        }.`;
      } else if (misconceptionsCount > 0) {
        recommendation = `Attention: ${misconceptionsCount} potential misconception(s) detected where high confidence coincided with an incorrect answer. Clarify the conceptual boundary before moving forward.`;
      } else if (percentage >= 75) {
        recommendation = `Strong conceptual foundation! Review the explanations for your missed questions and attempt a 5-minute active recall recap.`;
      } else if (percentage >= 50) {
        recommendation = `Good effort. We detected knowledge gaps in ${quiz.topic}. Use the Explain Topic module to review step-by-step mechanisms and analogies before retaking.`;
      } else {
        recommendation = `Foundational revision recommended. Study the full topic breakdown in the Explainer module, focus on common mistakes, and retry in 24 hours.`;
      }

      const overallAlignment =
        misconceptionsCount > 0
          ? `${misconceptionsCount} misconception(s) to address`
          : strongMasteryCount >= Math.ceil(total / 2)
          ? 'High confidence strongly aligned with correct knowledge'
          : 'Calibration balanced';

      res.json({
        quizId: quiz.id,
        subject: quiz.subject,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        score,
        totalQuestions: total,
        percentage,
        userAnswers,
        completedAt: new Date().toISOString(),
        improvementRecommendation: recommendation,
        reviewQuestions,
        confidenceInsights: {
          misconceptionsCount,
          strongMasteryCount,
          unconfidentCount,
          overallAlignment,
        },
      });
    } catch (error: any) {
      logServerError({
        requestId: getRequestId(req),
        route: '/api/quiz/submit',
        operation: 'submit_quiz',
        category: 'internal_error',
        statusCode: 500,
        context: { errorName: error?.name || 'Error' },
      });
      res.status(500).json({
        error: 'We could not score your quiz right now. Please try again.',
        requestId: getRequestId(req),
      });
    }
  });

  // 6. AI Mistake Explanation Endpoint (Rate-limited, validated)
  app.post('/api/explain-mistake', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateExplainMistakeInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid mistake diagnosis request data.',
          requestId: getRequestId(req),
        });
      }

      const explanation = await explainMistake(validation.data);
      res.json(explanation);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/explain-mistake',
        'explain_mistake',
        error,
        'We could not analyze this mistake right now. Please try again.'
      );
    }
  });

  // 7. Syllabus Parsing Endpoint (Rate-limited, validated)
  app.post('/api/parse-syllabus', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateParseSyllabusInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid syllabus parsing request data.',
          requestId: getRequestId(req),
        });
      }

      const parsed = await parseSyllabus(validation.data.rawText, validation.data.targetExamName);
      res.json(parsed);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/parse-syllabus',
        'parse_syllabus',
        error,
        'We could not parse your syllabus right now. Please try again.'
      );
    }
  });

  // 8. Adaptive Plan Adjustment Endpoint (Rate-limited, validated)
  app.post('/api/adapt-plan', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateAdaptPlanInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({
          error: validation.error || 'Invalid adaptive plan request data.',
          requestId: getRequestId(req),
        });
      }

      const adapted = await adaptPlan(validation.data);
      res.json(adapted);
    } catch (error: any) {
      sendAIErrorResponse(
        req,
        res,
        '/api/adapt-plan',
        'adapt_plan',
        error,
        'We could not adjust your plan right now. Please try again.'
      );
    }
  });

  // Catch-all unhandled server error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = getRequestId(req);
    logServerError({
      requestId,
      route: req.path || '/api',
      operation: 'unhandled_express_error',
      category: 'unhandled_error',
      statusCode: 500,
      context: { errorName: err?.name || 'Error' },
    });
    if (!res.headersSent) {
      res.status(500).json({
        error: 'An internal server error occurred. Please try again.',
        code: 'INTERNAL_SERVER_ERROR',
        requestId,
      });
    }
  });

  return app;
}
