import express from 'express';
import {
  generateStudyPlan,
  generateExplanation,
  generateQuiz,
  adaptPlan,
  getAIStatus,
} from './gemini.js';

export function createExpressApp() {
  const app = express();

  // Parse JSON payloads with reasonable size limits
  app.use(express.json({ limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'StudyMate AI',
      timestamp: new Date().toISOString(),
    });
  });

  // AI Service & Model status endpoint
  app.get('/api/status', (req, res) => {
    try {
      const status = getAIStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to determine AI status' });
    }
  });

  // 1. Study Plan Generation Endpoint
  app.post('/api/study-plan', async (req, res) => {
    try {
      const { subject, topics, examDate, dailyHours, level, weakTopics, preferredDays } = req.body;

      if (!subject || !examDate || !dailyHours) {
        return res.status(400).json({
          error: 'Missing required parameters: subject, examDate, and dailyHours are mandatory.',
        });
      }

      const plan = await generateStudyPlan({
        subject: String(subject).trim(),
        topics: Array.isArray(topics) ? topics : (typeof topics === 'string' ? topics.split(',').map(s => s.trim()).filter(Boolean) : []),
        examDate: String(examDate),
        dailyHours: Math.min(Math.max(Number(dailyHours) || 2, 0.5), 14),
        level: ['Beginner', 'Intermediate', 'Advanced'].includes(level) ? level : 'Intermediate',
        weakTopics: Array.isArray(weakTopics) ? weakTopics : (typeof weakTopics === 'string' ? weakTopics.split(',').map(s => s.trim()).filter(Boolean) : []),
        preferredDays: Array.isArray(preferredDays) && preferredDays.length > 0 ? preferredDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      });

      res.json(plan);
    } catch (error: any) {
      console.error('[API /api/study-plan error]:', error);
      res.status(500).json({
        error: 'We could not generate your study plan right now. Please try again.',
      });
    }
  });

  // 2. Topic Explanation Endpoint
  app.post('/api/explain', async (req, res) => {
    try {
      const { topic, level, subjectContext } = req.body;

      if (!topic || String(topic).trim().length === 0) {
        return res.status(400).json({ error: 'Topic is required.' });
      }

      const explanation = await generateExplanation({
        topic: String(topic).trim(),
        level: ['Beginner', 'Intermediate', 'Advanced'].includes(level) ? level : 'Intermediate',
        subjectContext: subjectContext ? String(subjectContext).trim() : undefined,
      });

      res.json(explanation);
    } catch (error: any) {
      console.error('[API /api/explain error]:', error);
      res.status(500).json({
        error: 'We could not explain this topic right now. Please try again.',
      });
    }
  });

  // 3. AI Quiz Generation Endpoint
  app.post('/api/quiz', async (req, res) => {
    try {
      const { subject, topic, difficulty, questionCount } = req.body;

      if (!topic || String(topic).trim().length === 0) {
        return res.status(400).json({ error: 'Topic is required for quiz generation.' });
      }

      const quiz = await generateQuiz({
        subject: subject ? String(subject).trim() : 'General Studies',
        topic: String(topic).trim(),
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty) ? difficulty : 'Intermediate',
        questionCount: Math.min(Math.max(Number(questionCount) || 4, 3), 10),
      });

      res.json(quiz);
    } catch (error: any) {
      console.error('[API /api/quiz error]:', error);
      res.status(500).json({
        error: 'We could not generate your quiz right now. Please try again.',
      });
    }
  });

  // 4. Adaptive Plan Adjustment Endpoint
  app.post('/api/adapt-plan', async (req, res) => {
    try {
      const { planId, currentPlan, missedTaskId, missedReason, extraTimeAvailableMinutes } = req.body;

      if (!currentPlan || !missedTaskId) {
        return res.status(400).json({
          error: 'Current study plan and missedTaskId are required for adaptive rescheduling.',
        });
      }

      const adapted = await adaptPlan({
        planId: String(planId || currentPlan.id),
        currentPlan,
        missedTaskId: String(missedTaskId),
        missedReason: String(missedReason || 'Schedule conflict'),
        extraTimeAvailableMinutes: Number(extraTimeAvailableMinutes) || 0,
      });

      res.json(adapted);
    } catch (error: any) {
      console.error('[API /api/adapt-plan error]:', error);
      res.status(500).json({
        error: 'We could not adjust your plan right now. Please try again.',
      });
    }
  });

  return app;
}
