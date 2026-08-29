import { z } from 'zod';

export type StudyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'pending' | 'completed' | 'missed';

export interface StudyTask {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // e.g. "Monday", "Day 1"
  topic: string;
  subtopic: string;
  durationMinutes: number;
  priority: TaskPriority;
  difficulty: StudyLevel;
  learningObjective: string;
  revisionTask: string;
  practiceRecommendation: string;
  status: TaskStatus;
  notes?: string;
  completedAt?: string;
  missedReason?: string;
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  subject: string;
  examDate: string;
  dailyHours: number;
  level: StudyLevel;
  topics: string[];
  weakTopics: string[];
  preferredDays: string[];
  tasks: StudyTask[];
  totalDays: number;
  totalStudyHours: number;
  assumptions: string[];
  isDemoFallback?: boolean;
}

export interface StudyPlanRequest {
  subject: string;
  topics: string[];
  examDate: string;
  dailyHours: number;
  level: StudyLevel;
  weakTopics: string[];
  preferredDays: string[];
}

export interface TopicExplanation {
  id: string;
  topic: string;
  level: StudyLevel;
  simpleExplanation: string;
  realWorldAnalogy: string;
  stepByStepExplanation: {
    stepNumber: number;
    title: string;
    description: string;
  }[];
  example: {
    title: string;
    codeOrFormula?: string;
    explanation: string;
  };
  commonMistakes: {
    mistake: string;
    whyItHappens: string;
    howToAvoid: string;
  }[];
  quickRevisionNotes: string[];
  practiceQuestions: {
    question: string;
    hint: string;
    answer: string;
  }[];
  isDemoFallback?: boolean;
}

export interface ExplainRequest {
  topic: string;
  level: StudyLevel;
  subjectContext?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // Must match one of options
  explanation: string;
}

export interface Quiz {
  id: string;
  subject: string;
  topic: string;
  difficulty: StudyLevel;
  questions: QuizQuestion[];
  createdAt: string;
  isDemoFallback?: boolean;
}

export interface QuizResult {
  id: string;
  quizId: string;
  subject: string;
  topic: string;
  difficulty: StudyLevel;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: { [questionId: string]: string };
  completedAt: string;
  improvementRecommendation: string;
}

export interface QuizRequest {
  subject: string;
  topic: string;
  difficulty: StudyLevel;
  questionCount: number;
}

export interface AdaptPlanRequest {
  planId: string;
  currentPlan: StudyPlan;
  missedTaskId: string;
  missedReason: string;
  extraTimeAvailableMinutes: number;
  remainingTargetDays?: number;
}

export interface AdaptedPlanResponse {
  updatedTasks: StudyTask[];
  redistributionSummary: string;
  priorityOrder: string[];
  encouragementMessage: string;
  isDemoFallback?: boolean;
}

export interface UserPreferences {
  userName: string;
  targetExamName: string;
  targetExamDate: string;
  dailyGoalHours: number;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large';
  soundEnabled: boolean;
}

export interface StudyProgress {
  totalHoursStudied: number;
  streakDays: number;
  lastStudyDate: string;
  completedTasksCount: number;
  totalTasksCount: number;
  quizzesTaken: number;
  averageQuizScore: number;
  weakTopicsIdentified: string[];
  masteredTopics: string[];
}

export interface AIStatus {
  isConfigured: boolean;
  provider: 'Google Gemini' | 'StudyMate Demo Engine' | string;
  model: string;
  status: 'ready' | 'missing_api_key' | 'error';
  message: string;
}
