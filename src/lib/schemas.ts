import { z } from 'zod';

export const StudyLevelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export const TaskPrioritySchema = z.enum(['High', 'Medium', 'Low']);
export const TaskStatusSchema = z.enum(['pending', 'completed', 'missed']);

export const StudyTaskSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  date: z.string(),
  day: z.string(),
  topic: z.string(),
  subtopic: z.string(),
  durationMinutes: z.number().min(10).max(480),
  priority: TaskPrioritySchema,
  difficulty: StudyLevelSchema,
  learningObjective: z.string(),
  revisionTask: z.string(),
  practiceRecommendation: z.string(),
  status: TaskStatusSchema.default('pending'),
  notes: z.string().optional(),
  completedAt: z.string().optional(),
  missedReason: z.string().optional(),
});

export const StudyPlanOutputSchema = z.object({
  tasks: z.array(StudyTaskSchema),
  totalDays: z.number(),
  totalStudyHours: z.number(),
  assumptions: z.array(z.string()),
});

export const StepByStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  description: z.string(),
});

export const CommonMistakeSchema = z.object({
  mistake: z.string(),
  whyItHappens: z.string(),
  howToAvoid: z.string(),
});

export const PracticeQuestionSchema = z.object({
  question: z.string(),
  hint: z.string(),
  answer: z.string(),
});

export const TopicExplanationSchema = z.object({
  simpleExplanation: z.string(),
  realWorldAnalogy: z.string(),
  stepByStepExplanation: z.array(StepByStepSchema),
  example: z.object({
    title: z.string(),
    codeOrFormula: z.string().optional().default(''),
    explanation: z.string(),
  }),
  commonMistakes: z.array(CommonMistakeSchema),
  quickRevisionNotes: z.array(z.string()),
  practiceQuestions: z.array(PracticeQuestionSchema),
});

export const QuizQuestionSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const QuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

export const AdaptedPlanResponseSchema = z.object({
  updatedTasks: z.array(StudyTaskSchema),
  redistributionSummary: z.string(),
  priorityOrder: z.array(z.string()),
  encouragementMessage: z.string(),
});
