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

// Server-authoritative Quiz question (contains answer key and detailed explanation)
export interface ServerQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // Must match one of options
  explanation: string;
}

// Server-authoritative Quiz
export interface ServerQuiz {
  id: string;
  subject: string;
  topic: string;
  difficulty: StudyLevel;
  questions: ServerQuizQuestion[];
  createdAt: string;
  isDemoFallback?: boolean;
}

// Client-facing Quiz question — strictly shielded (no correctAnswer, no explanation)
export interface ClientQuizQuestion {
  id: string;
  question: string;
  options: string[];
}

// Client-facing Quiz
export interface ClientQuiz {
  id: string;
  subject: string;
  topic: string;
  difficulty: StudyLevel;
  questions: ClientQuizQuestion[];
  createdAt: string;
  isDemoFallback?: boolean;
}

// Backwards-compatible alias for client components
export type QuizQuestion = ClientQuizQuestion;
export type Quiz = ClientQuiz;

// Quiz Answer Evaluation Request & Response
export interface QuizAnswerRequest {
  quizId: string;
  questionId: string;
  selectedAnswer: string;
}

export interface QuizAnswerResponse {
  quizId: string;
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

// Post-submission review question with revealed answer and diagnostic explanation
export interface QuizQuestionReview {
  id: string;
  question: string;
  options: string[];
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  confidence?: ConfidenceLevel;
  alignment?: 'Misconception' | 'Lucky Guess' | 'Strong Mastery' | 'Foundational Gap';
}

// Quiz Submission (Batch scoring) Request & Response
export interface QuizSubmitRequest {
  quizId: string;
  userAnswers: { [questionId: string]: string };
  confidenceMap?: { [questionId: string]: ConfidenceLevel };
}

export interface QuizConfidenceInsights {
  misconceptionsCount: number;
  strongMasteryCount: number;
  unconfidentCount: number;
  overallAlignment: string;
}

export interface QuizSubmitResponse {
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
  reviewQuestions: QuizQuestionReview[];
  confidenceInsights?: QuizConfidenceInsights;
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
  reviewQuestions?: QuizQuestionReview[];
  confidenceMap?: { [questionId: string]: ConfidenceLevel };
  confidenceInsights?: QuizConfidenceInsights;
}

// ==========================================
// Phase 2: Study Intelligence & Mastery Engine
// ==========================================

export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export type MistakeCategory =
  | 'Conceptual'
  | 'Calculation'
  | 'Syntax'
  | 'Misreading'
  | 'Recall'
  | 'Careless';

export interface ConceptMastery {
  conceptId: string;
  name: string;
  score: number; // 0 - 100
  questionsAttempted: number;
  questionsCorrect: number;
  lastAttemptedAt?: string;
  confidenceAverage?: number; // 1 (low) to 3 (high)
}

export interface TopicMastery {
  topic: string;
  subject?: string;
  score: number; // 0 - 100
  level: 'Weak' | 'Needs Practice' | 'Mastered'; // <50: Weak, 50-74: Needs Practice, >=75: Mastered
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number; // percentage
  lastTestedAt: string;
  attemptsCount: number;
  concepts?: { [conceptName: string]: ConceptMastery };
  trend?: number[]; // last few percentage points
  totalStudyMinutes?: number;
}

export interface QuestionMistake {
  id: string;
  quizId: string;
  questionId: string;
  topic: string;
  subtopic?: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  mistakeCategory: MistakeCategory;
  confidence: ConfidenceLevel;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  aiExplanation?: MistakeExplanation;
}

export interface MistakeExplanation {
  whatWasMisunderstood: string;
  whySelectedWasWrong: string;
  whyCorrectWorks: string;
  simpleExample: string;
  keyTakeaway: string;
  followUpQuestion?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export interface ExplainMistakeRequest {
  topic: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  difficulty?: StudyLevel;
  confidence?: ConfidenceLevel;
  mistakeCategory?: MistakeCategory;
}

export interface SpacedReviewItem {
  id: string;
  topic: string;
  concept: string;
  subject?: string;
  estimatedMinutes: number;
  reviewCount: number;
  intervalDays: number; // 1, 3, 7, 14, 30...
  lastReviewedAt?: string;
  nextReviewAt: string; // YYYY-MM-DD
  dueStatus: 'due' | 'upcoming' | 'overdue';
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  associatedMistakeId?: string;
}

export interface WeakAreaItem {
  topic: string;
  mastery: number;
  recentAccuracy: number;
  mistakeCount: number;
  priority: 'High' | 'Medium' | 'Low';
  recommendedAction: string;
  actionRoute: string; // '/quiz?topic=...', '/explain?topic=...', etc.
  urgencyScore: number;
}

export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  type: 'review' | 'quiz' | 'explain' | 'plan';
  targetTopic: string;
  actionRoute: string;
  actionLabel: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
}

export interface StudySessionRecord {
  id: string;
  topic: string;
  subject?: string;
  taskId?: string;
  actualMinutes: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  confidenceRating?: ConfidenceLevel;
  completedAt: string;
}

export interface LearningPathNode {
  id: string;
  name: string;
  level: number;
  mastery: number;
  status: 'mastered' | 'in_progress' | 'weak' | 'not_started';
  prerequisites?: string[];
  subtopics?: {
    name: string;
    mastery: number;
    status: 'mastered' | 'in_progress' | 'weak' | 'not_started';
  }[];
}

export interface ParsedSyllabusTopic {
  name: string;
  subtopics: string[];
  estimatedHours: number;
  difficulty: StudyLevel;
  keyObjectives?: string[];
}

export interface ParsedSyllabus {
  subject: string;
  targetExamName?: string;
  topics: ParsedSyllabusTopic[];
  totalEstimatedHours: number;
}

export interface ParseSyllabusRequest {
  rawText: string;
  targetExamName?: string;
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

// ==========================================
// Phase 3: Personal AI Academic Copilot Types
// ==========================================

// 1. Syllabus Intelligence
export interface SyllabusUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: {
    id: string;
    name: string;
    subtopics: string[];
    importance: 'High' | 'Medium' | 'Low';
    examRelevance: number; // 1 to 5
    estimatedHours: number;
    dependencies?: string[];
  }[];
}

export interface SyllabusStructure {
  id: string;
  subject: string;
  targetExamName?: string;
  examDate?: string;
  units: SyllabusUnit[];
  rawText?: string;
  totalEstimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

// 2. Study Material Intelligence
export interface ExtractedConcept {
  name: string;
  definition?: string;
  formula?: string;
  example?: string;
  syllabusTopic?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  unitOrTopic?: string;
  sourceType: 'text' | 'notes' | 'markdown' | 'pdf';
  content: string;
  summary?: string;
  extractedConcepts: ExtractedConcept[];
  revisionNotes: string[];
  suggestedSyllabusTopics: string[];
  createdAt: string;
}

export interface MaterialAnalysisRequest {
  title: string;
  subject: string;
  content: string;
  sourceType?: 'text' | 'notes' | 'markdown' | 'pdf';
  targetExamName?: string;
}

export interface MaterialAnalysisResponse {
  summary: string;
  extractedConcepts: ExtractedConcept[];
  revisionNotes: string[];
  suggestedSyllabusTopics: string[];
}

// 3. Intelligent Flashcards
export type FlashcardRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface Flashcard {
  id: string;
  subject: string;
  topic: string;
  front: string;
  back: string;
  hint?: string;
  sourceMaterialId?: string;
  sourceRef?: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string;
  dueStatus: 'due' | 'upcoming' | 'mastered';
  createdAt: string;
}

// 4. Past Year Question Paper (PYQ) Analyzer
export interface PYQQuestionItem {
  id: string;
  question: string;
  topic: string;
  unit?: string;
  marks?: number;
  difficulty: StudyLevel;
  year?: string;
  questionType?: string;
}

export interface PYQTopicFrequency {
  topic: string;
  count: number;
  percentage: number;
  priority: 'High' | 'Medium' | 'Low';
  repeatedConcepts: string[];
  averageMarks?: number;
}

export interface PYQAnalysisResult {
  id: string;
  subject: string;
  examName: string;
  totalQuestionsAnalyzed: number;
  topicFrequencies: PYQTopicFrequency[];
  highPriorityTopics: string[];
  yearTrends?: { year: string; topTopics: string[] }[];
  rawText?: string;
  analyzedAt: string;
}

export interface AnalyzePYQRequest {
  subject: string;
  examName?: string;
  rawQuestionsText: string;
}

// 5. Source-Grounded AI Tutor & Socratic Learning
export interface TutorCitation {
  sourceTitle: string;
  section?: string;
  quote?: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode: 'standard' | 'socratic';
  citations?: TutorCitation[];
  hint?: string;
  isSocraticQuestion?: boolean;
  fullExplanationRevealed?: boolean;
}

export interface TutorChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  subject: string;
  topic?: string;
  mode: 'standard' | 'socratic';
  studyMaterialContent?: string;
  studyMaterialTitle?: string;
  studentMastery?: number;
  weakTopics?: string[];
  examDate?: string;
  showFullExplanation?: boolean;
}

export interface TutorChatResponse {
  reply: string;
  isSocraticQuestion: boolean;
  hint?: string;
  citations?: TutorCitation[];
  suggestedFollowUp?: string;
  fullExplanationRevealed?: boolean;
}

// 6. Exam Simulator
export interface MockExamConfig {
  subject: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  topics: string[];
  difficulty: StudyLevel;
  includePYQEmphasis?: boolean;
}

export interface MockExamQuestion {
  id: string;
  question: string;
  options: string[];
  marks: number;
  topic: string;
  difficulty: StudyLevel;
  selectedAnswer?: string;
  isFlagged?: boolean;
}

export interface MockExamSession {
  id: string;
  config: MockExamConfig;
  questions: MockExamQuestion[];
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
  isSubmitted: boolean;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  topicBreakdown?: { topic: string; correct: number; total: number; score: number }[];
  difficultyBreakdown?: { difficulty: StudyLevel; correct: number; total: number }[];
  reviewQuestions?: QuizQuestionReview[];
}

export interface GenerateMockExamRequest {
  subject: string;
  topics: string[];
  difficulty: StudyLevel;
  questionCount: number;
  durationMinutes: number;
  pyqTopics?: string[];
}

// 7. Exam Readiness Score
export interface ExamReadinessScore {
  overallScore: number; // 0 - 100
  status: 'Ready' | 'On Track' | 'At Risk';
  syllabusCoverage: number;
  masteryAverage: number;
  recentQuizPerformance: number;
  revisionCoverage: number;
  pyqPreparedness: number;
  daysUntilExam: number;
  limitingFactors: string[];
  keyStrengths: string[];
  recommendedAction: string;
  lastCalculatedAt: string;
}

// 8. Learning Session (30-Minute Closed Loop)
export interface ActiveStudySessionState {
  id: string;
  topic: string;
  subject: string;
  durationMinutes: number;
  phase: 'recall' | 'learn' | 'practice' | 'assessment' | 'completed';
  elapsedSeconds: number;
  recallNotes: string;
  confidenceRating?: ConfidenceLevel;
  completedAt?: string;
}

// 9. Weekly AI Learning Report
export interface WeeklyReportData {
  weekStarting: string;
  weekEnding: string;
  totalMinutesStudied: number;
  completedTasksCount: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  strongestImprovementTopic: string;
  strongestImprovementDelta: number;
  biggestConcernTopic: string;
  biggestConcernAccuracy: number;
  currentStreak: number;
  readinessScore: number;
  resolvedMistakesCount: number;
  actionItemsNextWeek: string[];
}
