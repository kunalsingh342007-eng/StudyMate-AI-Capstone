import express, { Request, Response, NextFunction } from 'express';
import {
  generateStudyPlan,
  generateExplanation,
  generateQuiz,
  adaptPlan,
  getAIStatus,
  explainMistake,
  parseSyllabus,
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

export function createExpressApp() {
  const app = express();

  // Parse JSON payloads with reasonable size limits
  app.use(express.json({ limit: '2mb' }));

  // Safe JSON parse error handler for malformed incoming payloads
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
      return res.status(400).json({ error: 'Malformed JSON payload received in request.' });
    }
    next(err);
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'StudyMate AI',
      timestamp: new Date().toISOString(),
    });
  });

  // AI Service & Model status endpoint
  app.get('/api/status', (req: Request, res: Response) => {
    try {
      const status = getAIStatus();
      res.json(status);
    } catch {
      res.status(500).json({ error: 'Failed to determine AI system status.' });
    }
  });

  // 1. Study Plan Generation Endpoint (Rate-limited, validated)
  app.post('/api/study-plan', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateStudyPlanInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid study plan request data.' });
      }

      const plan = await generateStudyPlan(validation.data);
      res.json(plan);
    } catch (error: any) {
      console.error('[API /api/study-plan error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not generate your study plan right now. Please try again.',
      });
    }
  });

  // 2. Topic Explanation Endpoint (Rate-limited, validated)
  app.post('/api/explain', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateExplainInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid topic explanation request data.' });
      }

      const explanation = await generateExplanation(validation.data);
      res.json(explanation);
    } catch (error: any) {
      console.error('[API /api/explain error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not explain this topic right now. Please try again.',
      });
    }
  });

  // 3. AI Quiz Generation Endpoint (Rate-limited, validated, answer-shielded)
  // CRITICAL: Returns ONLY ClientQuiz { id, question, options }.
  // Correct answers and explanations are strictly kept server-side in serverQuizStore.
  app.post('/api/quiz', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateQuizInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid quiz generation request data.' });
      }

      const serverQuiz = await generateQuiz(validation.data);
      serverQuizStore.saveQuiz(serverQuiz);

      // Return strictly shielded client quiz representation
      const clientQuiz = toClientQuiz(serverQuiz);
      res.json(clientQuiz);
    } catch (error: any) {
      console.error('[API /api/quiz error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not generate your quiz right now. Please try again.',
      });
    }
  });

  // 4. Quiz Single Question Answer Evaluation Endpoint (Server-authoritative validation)
  app.post('/api/quiz/answer', async (req: Request, res: Response) => {
    try {
      const validation = validateQuizAnswerInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid answer payload.' });
      }

      const { quizId, questionId, selectedAnswer } = validation.data;
      const quiz = serverQuizStore.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz session not found or expired. Please generate a new quiz to continue.',
        });
      }

      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) {
        return res.status(400).json({
          error: 'The requested question was not found in this quiz.',
        });
      }

      // Verify selected answer matches one of the question's actual options
      const matchedOption = question.options.find(
        (opt) => opt.toLowerCase() === selectedAnswer.toLowerCase()
      );

      if (!matchedOption) {
        return res.status(400).json({
          error: 'Selected answer must be one of the available options for this question.',
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
      console.error('[API /api/quiz/answer error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not evaluate this answer right now. Please try again.',
      });
    }
  });

  // 5. Quiz Complete Assessment Submission & Scoring Endpoint (Server-authoritative scoring)
  app.post('/api/quiz/submit', async (req: Request, res: Response) => {
    try {
      const validation = validateQuizSubmitInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid quiz submission payload.' });
      }

      const { quizId, userAnswers, confidenceMap } = validation.data;
      const quiz = serverQuizStore.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz session not found or expired. Please generate a new quiz to continue.',
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

        // Calculate alignment
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
      console.error('[API /api/quiz/submit error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not score your quiz right now. Please try again.',
      });
    }
  });

  // 6. AI Mistake Explanation Endpoint (Rate-limited, validated)
  app.post('/api/explain-mistake', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateExplainMistakeInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid mistake diagnosis request data.' });
      }

      const explanation = await explainMistake(validation.data);
      res.json(explanation);
    } catch (error: any) {
      console.error('[API /api/explain-mistake error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not analyze this mistake right now. Please try again.',
      });
    }
  });

  // 7. Syllabus Parsing Endpoint (Rate-limited, validated)
  app.post('/api/parse-syllabus', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateParseSyllabusInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid syllabus parsing request data.' });
      }

      const parsed = await parseSyllabus(validation.data.rawText, validation.data.targetExamName);
      res.json(parsed);
    } catch (error: any) {
      console.error('[API /api/parse-syllabus error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not parse your syllabus right now. Please try again.',
      });
    }
  });

  // 8. Adaptive Plan Adjustment Endpoint (Rate-limited, validated)
  app.post('/api/adapt-plan', aiEndpointsLimiter.middleware(), async (req: Request, res: Response) => {
    try {
      const validation = validateAdaptPlanInput(req.body);
      if (!validation.success || !validation.data) {
        return res.status(400).json({ error: validation.error || 'Invalid adaptive plan request data.' });
      }

      const adapted = await adaptPlan(validation.data);
      res.json(adapted);
    } catch (error: any) {
      console.error('[API /api/adapt-plan error]:', error?.message || error);
      res.status(500).json({
        error: 'We could not adjust your plan right now. Please try again.',
      });
    }
  });

  // Catch-all unhandled server error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Unhandled Express Error]:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'An internal server error occurred. Please try again.',
      });
    }
  });

  return app;
}
