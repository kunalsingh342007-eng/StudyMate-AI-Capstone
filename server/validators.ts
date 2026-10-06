import {
  StudyPlanRequest,
  ExplainRequest,
  QuizRequest,
  QuizAnswerRequest,
  QuizSubmitRequest,
  AdaptPlanRequest,
  ExplainMistakeRequest,
  ParseSyllabusRequest,
  StudyLevel,
  MistakeCategory,
  ConfidenceLevel,
} from '../src/types/index.js';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const VALID_LEVELS: StudyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function validateStudyPlanInput(body: any): ValidationResult<StudyPlanRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { subject, topics, examDate, dailyHours, level, weakTopics, preferredDays } = body;

  if (typeof subject !== 'string' || subject.trim().length === 0) {
    return { success: false, error: 'Subject is required and must be a non-empty string.' };
  }
  if (subject.trim().length > 150) {
    return { success: false, error: 'Subject must not exceed 150 characters.' };
  }

  if (typeof examDate !== 'string' || examDate.trim().length === 0) {
    return { success: false, error: 'Target exam date is required.' };
  }
  const parsedDate = new Date(examDate);
  if (isNaN(parsedDate.getTime())) {
    return { success: false, error: 'Target exam date must be a valid calendar date format (YYYY-MM-DD).' };
  }

  const parsedHours = Number(dailyHours);
  if (isNaN(parsedHours) || parsedHours < 0.5 || parsedHours > 16) {
    return { success: false, error: 'Daily study hours must be a number between 0.5 and 16 hours.' };
  }

  let parsedLevel: StudyLevel = 'Intermediate';
  if (level) {
    if (!VALID_LEVELS.includes(level)) {
      return { success: false, error: 'Study level must be one of: Beginner, Intermediate, Advanced.' };
    }
    parsedLevel = level;
  }

  let parsedTopics: string[] = [];
  if (Array.isArray(topics)) {
    parsedTopics = topics.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof topics === 'string' && topics.trim().length > 0) {
    parsedTopics = topics.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (parsedTopics.length === 0) {
    return { success: false, error: 'At least one syllabus topic is required to build a study schedule.' };
  }
  if (parsedTopics.length > 50) {
    return { success: false, error: 'Maximum 50 topics allowed per schedule generation request.' };
  }

  let parsedWeak: string[] = [];
  if (Array.isArray(weakTopics)) {
    parsedWeak = weakTopics.map(w => String(w).trim()).filter(Boolean);
  } else if (typeof weakTopics === 'string' && weakTopics.trim().length > 0) {
    parsedWeak = weakTopics.split(',').map(w => w.trim()).filter(Boolean);
  }

  let parsedDays: string[] = [...VALID_DAYS];
  if (Array.isArray(preferredDays) && preferredDays.length > 0) {
    const validPreferred = preferredDays.filter(d => VALID_DAYS.includes(d));
    if (validPreferred.length > 0) {
      parsedDays = validPreferred;
    }
  }

  return {
    success: true,
    data: {
      subject: subject.trim(),
      topics: parsedTopics,
      examDate: examDate.trim(),
      dailyHours: parsedHours,
      level: parsedLevel,
      weakTopics: parsedWeak,
      preferredDays: parsedDays,
    },
  };
}

export function validateExplainInput(body: any): ValidationResult<ExplainRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { topic, level, subjectContext } = body;

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { success: false, error: 'Topic is required and must be a non-empty string.' };
  }
  if (topic.trim().length > 200) {
    return { success: false, error: 'Topic must not exceed 200 characters.' };
  }

  let parsedLevel: StudyLevel = 'Intermediate';
  if (level) {
    if (!VALID_LEVELS.includes(level)) {
      return { success: false, error: 'Study level must be one of: Beginner, Intermediate, Advanced.' };
    }
    parsedLevel = level;
  }

  let parsedContext: string | undefined = undefined;
  if (subjectContext) {
    if (typeof subjectContext !== 'string') {
      return { success: false, error: 'Subject context must be a string if provided.' };
    }
    parsedContext = subjectContext.trim().substring(0, 150);
  }

  return {
    success: true,
    data: {
      topic: topic.trim(),
      level: parsedLevel,
      subjectContext: parsedContext,
    },
  };
}

export function validateQuizInput(body: any): ValidationResult<QuizRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { subject, topic, difficulty, questionCount } = body;

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { success: false, error: 'Topic is required for quiz generation.' };
  }
  if (topic.trim().length > 200) {
    return { success: false, error: 'Topic must not exceed 200 characters.' };
  }

  let parsedDiff: StudyLevel = 'Intermediate';
  if (difficulty) {
    if (!VALID_LEVELS.includes(difficulty)) {
      return { success: false, error: 'Difficulty must be one of: Beginner, Intermediate, Advanced.' };
    }
    parsedDiff = difficulty;
  }

  let count = 4;
  if (questionCount !== undefined) {
    const num = Number(questionCount);
    if (isNaN(num) || num < 3 || num > 10) {
      return { success: false, error: 'Question count must be an integer between 3 and 10.' };
    }
    count = Math.floor(num);
  }

  return {
    success: true,
    data: {
      subject: typeof subject === 'string' && subject.trim() ? subject.trim().substring(0, 150) : 'General Studies',
      topic: topic.trim(),
      difficulty: parsedDiff,
      questionCount: count,
    },
  };
}

export function validateQuizAnswerInput(body: any): ValidationResult<QuizAnswerRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { quizId, questionId, selectedAnswer } = body;

  if (typeof quizId !== 'string' || quizId.trim().length === 0) {
    return { success: false, error: 'Quiz ID is required and must be a valid string.' };
  }

  if (typeof questionId !== 'string' || questionId.trim().length === 0) {
    return { success: false, error: 'Question ID is required and must be a valid string.' };
  }

  if (typeof selectedAnswer !== 'string' || selectedAnswer.trim().length === 0) {
    return { success: false, error: 'Selected answer is required.' };
  }

  return {
    success: true,
    data: {
      quizId: quizId.trim(),
      questionId: questionId.trim(),
      selectedAnswer: selectedAnswer.trim(),
    },
  };
}

export function validateQuizSubmitInput(body: any): ValidationResult<QuizSubmitRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { quizId, userAnswers, confidenceMap } = body;

  if (typeof quizId !== 'string' || quizId.trim().length === 0) {
    return { success: false, error: 'Quiz ID is required and must be a valid string.' };
  }

  if (!userAnswers || typeof userAnswers !== 'object' || Array.isArray(userAnswers)) {
    return { success: false, error: 'User answers must be an object mapping question IDs to selected options.' };
  }

  // Ensure userAnswers values are strings
  const sanitizedAnswers: { [key: string]: string } = {};
  for (const [qId, ans] of Object.entries(userAnswers)) {
    if (typeof ans === 'string') {
      sanitizedAnswers[qId] = ans.trim();
    }
  }

  let sanitizedConfidence: { [key: string]: ConfidenceLevel } | undefined = undefined;
  if (confidenceMap && typeof confidenceMap === 'object' && !Array.isArray(confidenceMap)) {
    sanitizedConfidence = {};
    const validConf: ConfidenceLevel[] = ['Low', 'Medium', 'High'];
    for (const [qId, conf] of Object.entries(confidenceMap)) {
      if (typeof conf === 'string' && validConf.includes(conf as ConfidenceLevel)) {
        sanitizedConfidence[qId] = conf as ConfidenceLevel;
      }
    }
  }

  return {
    success: true,
    data: {
      quizId: quizId.trim(),
      userAnswers: sanitizedAnswers,
      confidenceMap: sanitizedConfidence,
    },
  };
}

export function validateAdaptPlanInput(body: any): ValidationResult<AdaptPlanRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { planId, currentPlan, missedTaskId, missedReason, extraTimeAvailableMinutes } = body;

  if (!currentPlan || typeof currentPlan !== 'object' || !Array.isArray(currentPlan.tasks)) {
    return { success: false, error: 'Current study plan with tasks array is required for adaptive rescheduling.' };
  }

  if (typeof missedTaskId !== 'string' || missedTaskId.trim().length === 0) {
    return { success: false, error: 'Missed task ID is required.' };
  }

  const taskExists = currentPlan.tasks.some((t: any) => t && t.id === missedTaskId);
  if (!taskExists) {
    return { success: false, error: 'The specified missedTaskId was not found in the current study plan.' };
  }

  let extraMins = 0;
  if (extraTimeAvailableMinutes !== undefined) {
    const num = Number(extraTimeAvailableMinutes);
    if (!isNaN(num) && num >= 0 && num <= 600) {
      extraMins = Math.floor(num);
    }
  }

  return {
    success: true,
    data: {
      planId: String(planId || currentPlan.id || 'plan-default'),
      currentPlan,
      missedTaskId: missedTaskId.trim(),
      missedReason: typeof missedReason === 'string' ? missedReason.trim().substring(0, 300) : 'Schedule conflict',
      extraTimeAvailableMinutes: extraMins,
    },
  };
}

export function validateExplainMistakeInput(body: any): ValidationResult<ExplainMistakeRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { topic, question, selectedAnswer, correctAnswer, difficulty, confidence, mistakeCategory } = body;

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { success: false, error: 'Topic is required for mistake diagnosis.' };
  }
  if (typeof question !== 'string' || question.trim().length === 0) {
    return { success: false, error: 'Question text is required.' };
  }
  if (typeof selectedAnswer !== 'string' || selectedAnswer.trim().length === 0) {
    return { success: false, error: 'Student selected answer is required.' };
  }
  if (typeof correctAnswer !== 'string' || correctAnswer.trim().length === 0) {
    return { success: false, error: 'Correct answer is required.' };
  }

  const validDiff: StudyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  const validConf: ConfidenceLevel[] = ['Low', 'Medium', 'High'];
  const validCat: MistakeCategory[] = [
    'Conceptual',
    'Calculation',
    'Syntax',
    'Misreading',
    'Recall',
    'Careless',
  ];

  return {
    success: true,
    data: {
      topic: topic.trim().substring(0, 200),
      question: question.trim().substring(0, 500),
      selectedAnswer: selectedAnswer.trim().substring(0, 300),
      correctAnswer: correctAnswer.trim().substring(0, 300),
      difficulty: difficulty && validDiff.includes(difficulty) ? difficulty : 'Intermediate',
      confidence: confidence && validConf.includes(confidence) ? confidence : undefined,
      mistakeCategory: mistakeCategory && validCat.includes(mistakeCategory) ? mistakeCategory : 'Conceptual',
    },
  };
}

export function validateParseSyllabusInput(body: any): ValidationResult<ParseSyllabusRequest> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be a valid JSON object.' };
  }

  const { rawText, targetExamName } = body;

  if (typeof rawText !== 'string' || rawText.trim().length < 5) {
    return { success: false, error: 'Syllabus text is required (minimum 5 characters).' };
  }
  if (rawText.trim().length > 10000) {
    return { success: false, error: 'Syllabus text exceeds maximum length of 10,000 characters.' };
  }

  return {
    success: true,
    data: {
      rawText: rawText.trim(),
      targetExamName: typeof targetExamName === 'string' ? targetExamName.trim().substring(0, 150) : undefined,
    },
  };
}
