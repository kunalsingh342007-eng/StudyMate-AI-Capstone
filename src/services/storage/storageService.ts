import {
  StudyPlan,
  StudyTask,
  QuizResult,
  UserPreferences,
  StudyProgress,
  TopicMastery,
  QuestionMistake,
  SpacedReviewItem,
  StudySessionRecord,
  ConfidenceLevel,
  SyllabusStructure,
  StudyMaterial,
  Flashcard,
  FlashcardRating,
  PYQAnalysisResult,
  MockExamSession,
  TutorMessage,
} from '../../types';
import { MasteryEngine } from '../learning/masteryEngine';
import { FlashcardEngine } from '../learning/flashcardEngine';

const STORAGE_KEYS = {
  ACTIVE_PLAN: 'studymate_active_plan',
  SAVED_PLANS: 'studymate_saved_plans',
  QUIZ_HISTORY: 'studymate_quiz_history',
  PREFERENCES: 'studymate_preferences',
  PROGRESS: 'studymate_progress',
  SAVED_EXPLANATIONS: 'studymate_saved_explanations',
  TOPIC_MASTERY: 'studymate_topic_mastery',
  MISTAKES: 'studymate_mistakes',
  SPACED_REVIEWS: 'studymate_spaced_reviews',
  STUDY_SESSIONS: 'studymate_study_sessions',
  SYLLABUS: 'studymate_syllabus',
  STUDY_MATERIALS: 'studymate_study_materials',
  FLASHCARDS: 'studymate_flashcards',
  PYQ_ANALYSES: 'studymate_pyq_analyses',
  MOCK_EXAMS: 'studymate_mock_exams',
  TUTOR_CHAT: 'studymate_tutor_chat',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  userName: 'Student',
  targetExamName: 'Semester Finals / Tech Certification',
  targetExamDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dailyGoalHours: 3,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
  soundEnabled: true,
};

const DEFAULT_PROGRESS: StudyProgress = {
  totalHoursStudied: 0,
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  completedTasksCount: 0,
  totalTasksCount: 0,
  quizzesTaken: 0,
  averageQuizScore: 0,
  weakTopicsIdentified: [],
  masteredTopics: [],
};

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studymate_storage_change'));
  }
}

export const StorageService = {
  // --- Active Plan ---
  getActivePlan(): StudyPlan | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load active plan from storage', e);
      return null;
    }
  },

  setActivePlan(plan: StudyPlan): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(plan));
      // Also add/update in saved plans list
      this.savePlanToList(plan);
      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to save active plan', e);
    }
  },

  // --- Saved Plans List ---
  getSavedPlans(): StudyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  savePlanToList(plan: StudyPlan): void {
    try {
      const current = this.getSavedPlans();
      const existingIdx = current.findIndex((p) => p.id === plan.id);
      if (existingIdx >= 0) {
        current[existingIdx] = plan;
      } else {
        current.unshift(plan);
      }
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to update saved plans list', e);
    }
  },

  deletePlan(planId: string): void {
    try {
      const current = this.getSavedPlans().filter((p) => p.id !== planId);
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(current));

      const active = this.getActivePlan();
      if (active && active.id === planId) {
        if (current.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(current[0]));
        } else {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAN);
        }
      }
      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to delete plan', e);
    }
  },

  // --- Task Updates ---
  updateTaskStatus(taskId: string, status: 'pending' | 'completed' | 'missed', missedReason?: string): StudyPlan | null {
    const active = this.getActivePlan();
    if (!active) return null;

    const taskIndex = active.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return active;

    const updatedTask: StudyTask = {
      ...active.tasks[taskIndex],
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      missedReason: status === 'missed' ? missedReason : undefined,
    };

    active.tasks[taskIndex] = updatedTask;
    this.setActivePlan(active);
    return active;
  },

  updateTaskNotes(taskId: string, notes: string): StudyPlan | null {
    const active = this.getActivePlan();
    if (!active) return null;

    const taskIndex = active.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return active;

    active.tasks[taskIndex] = {
      ...active.tasks[taskIndex],
      notes,
    };

    this.setActivePlan(active);
    return active;
  },

  // --- Quiz History ---
  getQuizHistory(): QuizResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveQuizResult(result: QuizResult): void {
    try {
      const history = this.getQuizHistory();
      history.unshift(result);
      // Keep last 50 results
      const capped = history.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(capped));

      // --- Connect Quiz Performance to Mastery Engine ---
      const topicName = result.topic.trim();
      const existingMasteries = this.getMasteries();
      const prevMastery = existingMasteries[topicName] || {
        topic: topicName,
        subject: result.subject,
        score: 0,
        level: 'Weak' as const,
        totalQuestions: 0,
        correctQuestions: 0,
        accuracy: 0,
        lastTestedAt: result.completedAt,
        attemptsCount: 0,
        trend: [],
      };

      const newTotalQuestions = prevMastery.totalQuestions + result.totalQuestions;
      const newCorrectQuestions = prevMastery.correctQuestions + result.score;
      const newTrend = [...(prevMastery.trend || []), result.percentage].slice(-5);

      // Collect confidence ratings from review questions if provided
      const confidenceRatings: { level: ConfidenceLevel; isCorrect: boolean }[] = [];
      if (result.reviewQuestions) {
        result.reviewQuestions.forEach((rq) => {
          if (rq.confidence) {
            confidenceRatings.push({ level: rq.confidence, isCorrect: rq.isCorrect });
          }
        });
      }

      // Check logged study minutes for this topic
      const studySessions = this.getStudySessions();
      const topicMinutes = studySessions
        .filter((s) => s.topic.toLowerCase() === topicName.toLowerCase())
        .reduce((sum, s) => sum + s.actualMinutes, 0);

      const calculated = MasteryEngine.calculateMasteryScore({
        totalQuestions: newTotalQuestions,
        correctQuestions: newCorrectQuestions,
        recentTrend: newTrend,
        studyMinutes: topicMinutes,
        confidenceRatings,
      });

      const updatedMastery: TopicMastery = {
        ...prevMastery,
        score: calculated.score,
        level: calculated.level,
        accuracy: calculated.accuracy,
        totalQuestions: newTotalQuestions,
        correctQuestions: newCorrectQuestions,
        lastTestedAt: result.completedAt,
        attemptsCount: prevMastery.attemptsCount + 1,
        trend: newTrend,
        totalStudyMinutes: topicMinutes,
      };

      this.saveMastery(updatedMastery);

      // --- Process Review Questions for Mistakes & Spaced Repetition ---
      if (result.reviewQuestions && result.reviewQuestions.length > 0) {
        result.reviewQuestions.forEach((rq) => {
          if (!rq.isCorrect) {
            // Record mistake
            const mistake: QuestionMistake = {
              id: `mistake-${Date.now()}-${rq.id}`,
              quizId: result.quizId,
              questionId: rq.id,
              topic: topicName,
              questionText: rq.question,
              selectedAnswer: rq.selectedAnswer,
              correctAnswer: rq.correctAnswer,
              explanation: rq.explanation,
              mistakeCategory: 'Conceptual',
              confidence: rq.confidence || 'Medium',
              timestamp: result.completedAt,
              resolved: false,
            };
            this.saveMistake(mistake);

            // Schedule spaced repetition due tomorrow (1-day reset for missed concept)
            const nextReview = MasteryEngine.calculateNextReview(0, 'poor');
            this.saveSpacedReview({
              id: `review-${Date.now()}-${rq.id}`,
              topic: topicName,
              concept: rq.question.length > 50 ? rq.question.slice(0, 47) + '...' : rq.question,
              subject: result.subject,
              estimatedMinutes: 5,
              reviewCount: 0,
              intervalDays: nextReview.intervalDays,
              nextReviewAt: nextReview.nextReviewAt,
              dueStatus: 'due',
              priority: 'High',
              reason: `Missed in ${result.difficulty} quiz. Rapid review consolidates corrected logic.`,
              associatedMistakeId: mistake.id,
            });
          } else {
            // Correct answer: advance spaced repetition if an existing review item exists
            const existingReviews = this.getSpacedReviews();
            const matchingReview = existingReviews.find(
              (r) => r.topic.toLowerCase() === topicName.toLowerCase() && r.dueStatus === 'due'
            );
            if (matchingReview) {
              const quality = rq.confidence === 'High' ? 'good' : 'fair';
              this.completeSpacedReview(matchingReview.id, quality);
            }
          }
        });
      }

      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to save quiz result', e);
    }
  },

  // --- Topic Mastery Management ---
  getMasteries(): Record<string, TopicMastery> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOPIC_MASTERY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  getMastery(topic: string): TopicMastery | null {
    const all = this.getMasteries();
    return all[topic] || null;
  },

  saveMastery(topicMastery: TopicMastery): void {
    try {
      const all = this.getMasteries();
      all[topicMastery.topic] = topicMastery;
      localStorage.setItem(STORAGE_KEYS.TOPIC_MASTERY, JSON.stringify(all));
      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to save mastery', e);
    }
  },

  // --- Mistake Analysis & Tracking ---
  getMistakes(): QuestionMistake[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMistake(mistake: QuestionMistake): void {
    try {
      const current = this.getMistakes();
      current.unshift(mistake);
      localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(current.slice(0, 100)));
      notifyChange();
    } catch (e) {
      console.error('Failed to save mistake', e);
    }
  },

  resolveMistake(mistakeId: string): void {
    try {
      const current = this.getMistakes();
      const idx = current.findIndex((m) => m.id === mistakeId);
      if (idx !== -1) {
        current[idx].resolved = true;
        current[idx].resolvedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(current));
        notifyChange();
      }
    } catch (e) {
      console.error('Failed to resolve mistake', e);
    }
  },

  updateMistakeExplanation(mistakeId: string, explanation: any): void {
    try {
      const current = this.getMistakes();
      const idx = current.findIndex((m) => m.id === mistakeId);
      if (idx !== -1) {
        current[idx].aiExplanation = explanation;
        localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(current));
        notifyChange();
      }
    } catch (e) {
      console.error('Failed to update mistake explanation', e);
    }
  },

  // --- Spaced Repetition Reviews ---
  getSpacedReviews(): SpacedReviewItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SPACED_REVIEWS);
      const items: SpacedReviewItem[] = data ? JSON.parse(data) : [];
      const todayStr = new Date().toISOString().split('T')[0];

      // Update due statuses dynamically
      return items.map((item) => {
        let status: 'due' | 'upcoming' | 'overdue' = 'upcoming';
        if (item.nextReviewAt < todayStr) {
          status = 'overdue';
        } else if (item.nextReviewAt === todayStr) {
          status = 'due';
        }
        return { ...item, dueStatus: status };
      });
    } catch (e) {
      return [];
    }
  },

  saveSpacedReview(item: SpacedReviewItem): void {
    try {
      const current = this.getSpacedReviews();
      const existingIdx = current.findIndex(
        (r) => r.topic.toLowerCase() === item.topic.toLowerCase() && r.concept === item.concept
      );
      if (existingIdx !== -1) {
        current[existingIdx] = item;
      } else {
        current.unshift(item);
      }
      localStorage.setItem(STORAGE_KEYS.SPACED_REVIEWS, JSON.stringify(current.slice(0, 100)));
      notifyChange();
    } catch (e) {
      console.error('Failed to save spaced review item', e);
    }
  },

  completeSpacedReview(itemId: string, quality: 'poor' | 'fair' | 'good' = 'good'): void {
    try {
      const current = this.getSpacedReviews();
      const idx = current.findIndex((r) => r.id === itemId);
      if (idx !== -1) {
        const item = current[idx];
        const nextReview = MasteryEngine.calculateNextReview(item.reviewCount + 1, quality);
        current[idx] = {
          ...item,
          reviewCount: item.reviewCount + 1,
          intervalDays: nextReview.intervalDays,
          lastReviewedAt: new Date().toISOString().split('T')[0],
          nextReviewAt: nextReview.nextReviewAt,
          dueStatus: 'upcoming',
        };
        localStorage.setItem(STORAGE_KEYS.SPACED_REVIEWS, JSON.stringify(current));

        // If this review was tied to a mistake, mark the mistake resolved on good performance
        if (item.associatedMistakeId && quality === 'good') {
          this.resolveMistake(item.associatedMistakeId);
        }

        notifyChange();
      }
    } catch (e) {
      console.error('Failed to complete spaced review', e);
    }
  },

  // --- Actual Study Sessions Logging ---
  getStudySessions(): StudySessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  logStudySession(session: Omit<StudySessionRecord, 'id' | 'completedAt'>): StudySessionRecord {
    const record: StudySessionRecord = {
      ...session,
      id: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    try {
      const current = this.getStudySessions();
      current.unshift(record);
      localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(current.slice(0, 100)));

      // Boost mastery for this topic
      const topicName = session.topic.trim();
      const existingMastery = this.getMastery(topicName);
      if (existingMastery) {
        const newMinutes = (existingMastery.totalStudyMinutes || 0) + session.actualMinutes;
        const recomputed = MasteryEngine.calculateMasteryScore({
          totalQuestions: existingMastery.totalQuestions,
          correctQuestions: existingMastery.correctQuestions,
          recentTrend: existingMastery.trend,
          studyMinutes: newMinutes,
        });

        this.saveMastery({
          ...existingMastery,
          score: recomputed.score,
          level: recomputed.level,
          totalStudyMinutes: newMinutes,
        });
      }

      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to log study session', e);
    }

    return record;
  },

  // --- Preferences ---
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (e) {
      return DEFAULT_PREFERENCES;
    }
  },

  setPreferences(prefs: Partial<UserPreferences>): UserPreferences {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      notifyChange();
      return updated;
    } catch (e) {
      console.error('Failed to save preferences', e);
      return DEFAULT_PREFERENCES;
    }
  },

  // --- Progress & Analytics ---
  getProgress(): StudyProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return data ? { ...DEFAULT_PROGRESS, ...JSON.parse(data) } : this.recalculateProgress();
    } catch (e) {
      return DEFAULT_PROGRESS;
    }
  },

  recalculateProgress(): StudyProgress {
    const activePlan = this.getActivePlan();
    const quizHistory = this.getQuizHistory();
    const todayStr = new Date().toISOString().split('T')[0];

    let totalCompletedHours = 0;
    let completedCount = 0;
    let totalCount = 0;

    if (activePlan) {
      totalCount = activePlan.tasks.length;
      activePlan.tasks.forEach((t) => {
        if (t.status === 'completed') {
          completedCount += 1;
          totalCompletedHours += t.durationMinutes / 60;
        }
      });
    }

    // Quiz statistics
    const quizzesTaken = quizHistory.length;
    const avgScore = quizzesTaken > 0
      ? Math.round(quizHistory.reduce((acc, q) => acc + q.percentage, 0) / quizzesTaken)
      : 0;

    // Identify weak vs mastered from quiz history and study plan
    const topicScores: { [topic: string]: { total: number; count: number } } = {};
    quizHistory.forEach((q) => {
      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { total: 0, count: 0 };
      }
      topicScores[q.topic].total += q.percentage;
      topicScores[q.topic].count += 1;
    });

    const weakSet = new Set<string>(activePlan?.weakTopics || []);
    const masteredSet = new Set<string>();

    Object.entries(topicScores).forEach(([topic, stat]) => {
      const average = stat.total / stat.count;
      if (average < 70) {
        weakSet.add(topic);
      } else if (average >= 85) {
        masteredSet.add(topic);
      }
    });

    const currentProg = (() => {
      try {
        const d = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return d ? JSON.parse(d) : DEFAULT_PROGRESS;
      } catch {
        return DEFAULT_PROGRESS;
      }
    })();

    // Streak calculation
    let streak = currentProg.streakDays || 1;
    if (currentProg.lastStudyDate && currentProg.lastStudyDate !== todayStr) {
      const lastDate = new Date(currentProg.lastStudyDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        // Continuous streak
        if (completedCount > (currentProg.completedTasksCount || 0)) {
          streak += 1;
        }
      } else if (diffDays > 1) {
        streak = 1;
      }
    }

    const newProgress: StudyProgress = {
      totalHoursStudied: Math.round(totalCompletedHours * 10) / 10,
      streakDays: streak,
      lastStudyDate: todayStr,
      completedTasksCount: completedCount,
      totalTasksCount: totalCount,
      quizzesTaken,
      averageQuizScore: avgScore,
      weakTopicsIdentified: Array.from(weakSet),
      masteredTopics: Array.from(masteredSet),
    };

    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
    } catch (e) {
      // ignore
    }

    return newProgress;
  },

  // --- Seed Initial Sample Data for Instant Showcase ---
  seedSampleDataIfEmpty(): void {
    if (typeof window === 'undefined') return;
    if (!this.getActivePlan()) {
      const today = new Date();
      const sampleTasks: StudyTask[] = [
        {
          id: 'task-1',
          date: today.toISOString().split('T')[0],
          day: 'Today (Day 1)',
          topic: 'Algorithms: Dynamic Programming',
          subtopic: 'Overlapping Subproblems & Memoization',
          durationMinutes: 75,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Master top-down memoization patterns on 1D recurrence relations.',
          revisionTask: 'Review recursion stack diagrams and state transition formulas.',
          practiceRecommendation: 'Solve Fibonacci Memoized and Climbing Stairs on problem sheet.',
          status: 'pending',
        },
        {
          id: 'task-2',
          date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
          day: 'Tomorrow (Day 2)',
          topic: 'System Design: Distributed Caching',
          subtopic: 'Redis, Memcached & Cache Invalidation Strategies',
          durationMinutes: 60,
          priority: 'High',
          difficulty: 'Advanced',
          learningObjective: 'Understand Write-Through, Write-Behind, and Cache-Aside architectures.',
          revisionTask: 'Recall LRU eviction policy complexity and TTL implementations.',
          practiceRecommendation: 'Draft high-level architecture diagram for high-throughput feed caching.',
          status: 'pending',
        },
        {
          id: 'task-3',
          date: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
          day: 'Day 3',
          topic: 'Database Systems: Indexing',
          subtopic: 'B-Trees vs LSM Trees in Relational & NoSQL Stores',
          durationMinutes: 60,
          priority: 'Medium',
          difficulty: 'Intermediate',
          learningObjective: 'Analyze I/O complexity of clustered vs unclustered indexes.',
          revisionTask: 'Self-test on query execution plans with EXPLAIN ANALYZE.',
          practiceRecommendation: 'Benchmark composite index order on sample table with 1M rows.',
          status: 'pending',
        },
        {
          id: 'task-4',
          date: new Date(today.getTime() + 259200000).toISOString().split('T')[0],
          day: 'Day 4',
          topic: 'Computer Networks: HTTP/3 & QUIC',
          subtopic: 'UDP Transport, Head-of-Line Blocking, and 0-RTT Handshakes',
          durationMinutes: 45,
          priority: 'Medium',
          difficulty: 'Intermediate',
          learningObjective: 'Understand connection migration and TLS 1.3 handshake mechanics.',
          revisionTask: '15-min flashcard review on TCP vs QUIC flow control differences.',
          practiceRecommendation: 'Inspect Wireshark traces of a QUIC connection in browser.',
          status: 'pending',
        },
      ];

      const samplePlan: StudyPlan = {
        id: 'plan-sample-1',
        createdAt: new Date().toISOString(),
        subject: 'Computer Science Core & Engineering',
        examDate: new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0],
        dailyHours: 2.5,
        level: 'Intermediate',
        topics: ['Dynamic Programming', 'Distributed Caching', 'Database Indexing', 'HTTP/3 & QUIC'],
        weakTopics: ['Dynamic Programming'],
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        tasks: sampleTasks,
        totalDays: 4,
        totalStudyHours: 4.0,
        assumptions: [
          'Assumes 2.5 hours average focus block per study day.',
          'Dynamic Programming weighted first as primary high-priority area.',
        ],
        isDemoFallback: false,
      };

      this.setActivePlan(samplePlan);

      // Seed a sample quiz result for realistic dashboard charts
      this.saveQuizResult({
        id: 'quiz-sample-1',
        quizId: 'quiz-sample-1',
        subject: 'Computer Science Core',
        topic: 'Data Structures & Algorithms',
        difficulty: 'Intermediate',
        score: 4,
        totalQuestions: 4,
        percentage: 100,
        userAnswers: { q1: 'O(log N)', q2: 'Queue', q3: 'O(N^2)', q4: 'All of the above' },
        completedAt: new Date(today.getTime() - 86400000).toISOString(),
        improvementRecommendation: 'Excellent grasp of asymptotic bounds and FIFO principles! Continue with Graph algorithms.',
      });

      // Seed Phase 2 learning intelligence: Topic Masteries
      this.saveMastery({
        topic: 'Data Structures & Algorithms',
        subject: 'Computer Science Core',
        score: 85,
        level: 'Mastered',
        totalQuestions: 8,
        correctQuestions: 7,
        accuracy: 88,
        lastTestedAt: new Date(today.getTime() - 86400000).toISOString(),
        attemptsCount: 2,
        trend: [75, 100],
        totalStudyMinutes: 90,
      });

      this.saveMastery({
        topic: 'Dynamic Programming',
        subject: 'Computer Science Core',
        score: 38,
        level: 'Weak',
        totalQuestions: 6,
        correctQuestions: 2,
        accuracy: 33,
        lastTestedAt: new Date(today.getTime() - 172800000).toISOString(),
        attemptsCount: 1,
        trend: [33],
        totalStudyMinutes: 45,
      });

      this.saveMastery({
        topic: 'Distributed Caching',
        subject: 'Computer Science Core',
        score: 62,
        level: 'Needs Practice',
        totalQuestions: 5,
        correctQuestions: 3,
        accuracy: 60,
        lastTestedAt: new Date(today.getTime() - 259200000).toISOString(),
        attemptsCount: 1,
        trend: [60],
        totalStudyMinutes: 60,
      });

      // Seed Spaced Review Item due today
      this.saveSpacedReview({
        id: 'review-sample-1',
        topic: 'Dynamic Programming',
        concept: '1D State Transitions & Memoization Arrays',
        subject: 'Computer Science Core',
        estimatedMinutes: 5,
        reviewCount: 1,
        intervalDays: 1,
        lastReviewedAt: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
        nextReviewAt: today.toISOString().split('T')[0],
        dueStatus: 'due',
        priority: 'High',
        reason: 'Optimal substructure verification due for spaced consolidation.',
      });

      // Seed a sample mistake for mistake analysis drill
      this.saveMistake({
        id: 'mistake-sample-1',
        quizId: 'quiz-prev-dp',
        questionId: 'q-dp-fib',
        topic: 'Dynamic Programming',
        questionText: 'What is the auxiliary space complexity of bottom-up tabular Fibonacci without space optimization?',
        selectedAnswer: 'O(1)',
        correctAnswer: 'O(N)',
        explanation: 'A 1D table of size N stores all prior subproblems, consuming linear O(N) space unless only the last 2 states are retained.',
        mistakeCategory: 'Conceptual',
        confidence: 'High',
        timestamp: new Date(today.getTime() - 172800000).toISOString(),
        resolved: false,
      });

      // Seed initial practical study session
      this.logStudySession({
        topic: 'Dynamic Programming',
        subject: 'Computer Science Core',
        actualMinutes: 45,
        date: today.toISOString().split('T')[0],
        notes: 'Constructed recursive call trees and identified overlapping subproblems for Fibonacci and Coin Change.',
        confidenceRating: 'Medium',
      });

      // Seed initial structured course syllabus
      this.saveSyllabus({
        id: 'syllabus-cs-core',
        subject: 'Data Structures & Algorithms',
        targetExamName: 'Semester Finals / Tech Interview Exam',
        examDate: new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0],
        totalEstimatedHours: 42,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        units: [
          {
            id: 'unit-1',
            unitNumber: 1,
            title: 'Linear Data Structures',
            topics: [
              {
                id: 'top-1',
                name: 'Arrays & Dynamic Sizing',
                subtopics: ['Prefix Sums', 'Sliding Window', 'Two Pointers'],
                importance: 'High',
                examRelevance: 5,
                estimatedHours: 6,
                dependencies: [],
              },
              {
                id: 'top-2',
                name: 'Linked Lists',
                subtopics: ['Singly Linked List', 'Doubly Linked List', 'Fast & Slow Pointers Cycle Detection'],
                importance: 'Medium',
                examRelevance: 4,
                estimatedHours: 5,
                dependencies: ['Arrays'],
              },
              {
                id: 'top-3',
                name: 'Stacks & Queues',
                subtopics: ['Monotonic Stack', 'Circular Queue', 'Min Stack Implementation'],
                importance: 'High',
                examRelevance: 4,
                estimatedHours: 4,
                dependencies: ['Arrays', 'Linked Lists'],
              },
            ],
          },
          {
            id: 'unit-2',
            unitNumber: 2,
            title: 'Hierarchical & Graph Structures',
            topics: [
              {
                id: 'top-4',
                name: 'Binary Trees & BSTs',
                subtopics: ['Inorder/Preorder/Postorder', 'Lowest Common Ancestor', 'BST Validations'],
                importance: 'High',
                examRelevance: 5,
                estimatedHours: 8,
                dependencies: ['Recursion'],
              },
              {
                id: 'top-5',
                name: 'Graph Traversal & Shortest Path',
                subtopics: ['BFS & DFS', 'Dijkstra Algorithm', 'Topological Sorting & Kahn Algorithm'],
                importance: 'High',
                examRelevance: 5,
                estimatedHours: 10,
                dependencies: ['Binary Trees', 'Queues'],
              },
            ],
          },
        ],
      });

      // Seed sample study material
      this.saveMaterial({
        id: 'mat-os-unit2',
        title: 'Operating Systems Unit 2: Process Scheduling & Synchronization',
        subject: 'Operating Systems',
        unitOrTopic: 'Unit 2: Process Management',
        sourceType: 'notes',
        content: `Operating Systems Unit 2: Process Scheduling & Synchronization
Process scheduling algorithms determine which process in the ready queue is allocated CPU time:
1. FCFS (First-Come, First-Served): Non-preemptive. Suffers from Convoy Effect where short jobs wait behind long jobs. Average waiting time is often high.
2. SJF (Shortest Job First): Provably optimal minimum average waiting time. Preemptive SJF is Shortest Remaining Time First (SRTF). Cannot easily know future CPU burst time.
3. Round Robin (RR): Preemptive using a time quantum q. If q is too large, degrades to FCFS. If q is too small, context switch overhead dominates.
4. Priority Scheduling: Each process has a priority. Low-priority processes may suffer from Starvation (indefinite blocking). Solution is Aging (gradually increasing priority of waiting processes).
Critical Section Problem requires: Mutual Exclusion, Progress, and Bounded Waiting.
Peterson's Solution achieves mutual exclusion for 2 processes using flag array and turn variable.`,
        summary: 'Comprehensive notes covering CPU burst scheduling algorithms (FCFS, SJF, RR, Priority) and Critical Section synchronization conditions (Mutual Exclusion, Progress, Bounded Waiting).',
        extractedConcepts: [
          {
            name: 'Convoy Effect',
            definition: 'When multiple short processes wait behind a single CPU-heavy process in non-preemptive FCFS scheduling.',
            syllabusTopic: 'Process Scheduling',
          },
          {
            name: 'Aging',
            definition: 'Technique of gradually increasing process priority over time to prevent starvation in priority scheduling.',
            syllabusTopic: 'Priority Scheduling',
          },
          {
            name: 'Critical Section Requirements',
            definition: 'The three mandatory conditions for concurrency solutions: Mutual Exclusion, Progress, and Bounded Waiting.',
            formula: 'Mutual Exclusion + Progress + Bounded Waiting',
            syllabusTopic: 'Process Synchronization',
          },
        ],
        revisionNotes: [
          'SJF gives provably minimal average waiting time.',
          'Small time quantum in Round Robin increases context-switch overhead.',
          'Aging is the primary antidote to starvation in priority queues.',
          'Critical section demands Mutual Exclusion, Progress, and Bounded Waiting.',
        ],
        suggestedSyllabusTopics: ['Process Scheduling', 'CPU Burst', 'Process Synchronization'],
        createdAt: today.toISOString(),
      });

      // Seed initial intelligent flashcards
      this.saveFlashcard({
        id: 'card-1',
        subject: 'Operating Systems',
        topic: 'Process Scheduling',
        front: 'What is the primary drawback of First-Come First-Served (FCFS) scheduling?',
        back: 'The Convoy Effect: short processes suffer long average waiting times behind CPU-intensive jobs.',
        hint: 'Think about vehicles stuck behind a slow truck on a single lane.',
        intervalDays: 1,
        repetitions: 1,
        easeFactor: 2.5,
        nextReviewDate: today.toISOString().split('T')[0],
        dueStatus: 'due',
        createdAt: today.toISOString(),
      });

      this.saveFlashcard({
        id: 'card-2',
        subject: 'Data Structures',
        topic: 'Trees & BSTs',
        front: 'What is the relationship between BST inorder traversal and key ordering?',
        back: 'An inorder traversal (Left -> Root -> Right) of a valid Binary Search Tree visits keys in strictly ascending sorted order.',
        hint: 'L-N-R visits all values strictly less before root, then greater.',
        intervalDays: 3,
        repetitions: 2,
        easeFactor: 2.6,
        nextReviewDate: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
        dueStatus: 'upcoming',
        createdAt: today.toISOString(),
      });

      // Seed Past Year Question Paper (PYQ) analysis
      this.savePYQAnalysis({
        id: 'pyq-cs-2025',
        subject: 'Computer Science Core',
        examName: 'Midterm & Finals Past 5 Years',
        totalQuestionsAnalyzed: 45,
        analyzedAt: today.toISOString(),
        topicFrequencies: [
          {
            topic: 'Binary Trees & BSTs',
            count: 12,
            percentage: 27,
            priority: 'High',
            repeatedConcepts: ['BST Search Time', 'Inorder Successor', 'LCA'],
            averageMarks: 8,
          },
          {
            topic: 'Graph Traversal',
            count: 9,
            percentage: 20,
            priority: 'High',
            repeatedConcepts: ['Cycle Detection', 'Dijkstra Complexity', 'Topological Sort'],
            averageMarks: 10,
          },
          {
            topic: 'Process Scheduling',
            count: 8,
            percentage: 18,
            priority: 'High',
            repeatedConcepts: ['Round Robin Gantt Chart', 'Average Waiting Time', 'Starvation vs Deadlock'],
            averageMarks: 7,
          },
          {
            topic: 'Dynamic Programming',
            count: 6,
            percentage: 13,
            priority: 'Medium',
            repeatedConcepts: ['Memoization vs Tabulation', '0/1 Knapsack'],
            averageMarks: 12,
          },
          {
            topic: 'Linked Lists',
            count: 5,
            percentage: 11,
            priority: 'Low',
            repeatedConcepts: ['Reverse Linked List', 'Detect Loop'],
            averageMarks: 5,
          },
        ],
        highPriorityTopics: ['Binary Trees & BSTs', 'Graph Traversal', 'Process Scheduling'],
        yearTrends: [
          { year: '2024', topTopics: ['Graph Traversal', 'BSTs', 'Round Robin'] },
          { year: '2023', topTopics: ['BSTs', 'Dynamic Programming', 'Dijkstra'] },
        ],
      });
    }
  },

  // --- Syllabus Intelligence ---
  getSyllabus(): SyllabusStructure | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYLLABUS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveSyllabus(syllabus: SyllabusStructure): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYLLABUS, JSON.stringify(syllabus));
      notifyChange();
    } catch (e) {
      console.error('Failed to save syllabus', e);
    }
  },

  // --- Study Materials ---
  getMaterials(): StudyMaterial[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_MATERIALS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMaterial(material: StudyMaterial): void {
    try {
      const current = this.getMaterials();
      const idx = current.findIndex((m) => m.id === material.id);
      if (idx !== -1) {
        current[idx] = material;
      } else {
        current.unshift(material);
      }
      localStorage.setItem(STORAGE_KEYS.STUDY_MATERIALS, JSON.stringify(current));
      notifyChange();
    } catch (e) {
      console.error('Failed to save study material', e);
    }
  },

  deleteMaterial(id: string): void {
    try {
      const current = this.getMaterials().filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.STUDY_MATERIALS, JSON.stringify(current));
      notifyChange();
    } catch (e) {
      console.error('Failed to delete study material', e);
    }
  },

  // --- Intelligent Flashcards ---
  getFlashcards(): Flashcard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveFlashcard(card: Flashcard): void {
    try {
      const current = this.getFlashcards();
      const idx = current.findIndex((c) => c.id === card.id);
      if (idx !== -1) {
        current[idx] = card;
      } else {
        current.unshift(card);
      }
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(current));
      notifyChange();
    } catch (e) {
      console.error('Failed to save flashcard', e);
    }
  },

  reviewFlashcard(cardId: string, rating: FlashcardRating): Flashcard | null {
    try {
      const current = this.getFlashcards();
      const idx = current.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;

      const card = current[idx];
      const updatedTiming = FlashcardEngine.calculateNextReview(card, rating);
      const updatedCard: Flashcard = {
        ...card,
        ...updatedTiming,
        lastReviewedDate: new Date().toISOString().split('T')[0],
      };

      current[idx] = updatedCard;
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(current));
      notifyChange();
      return updatedCard;
    } catch (e) {
      console.error('Failed to review flashcard', e);
      return null;
    }
  },

  deleteFlashcard(cardId: string): void {
    try {
      const current = this.getFlashcards().filter((c) => c.id !== cardId);
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(current));
      notifyChange();
    } catch (e) {
      console.error('Failed to delete flashcard', e);
    }
  },

  // --- PYQ Analyses ---
  getPYQAnalyses(): PYQAnalysisResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PYQ_ANALYSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getLatestPYQAnalysis(): PYQAnalysisResult | null {
    const list = this.getPYQAnalyses();
    return list.length > 0 ? list[0] : null;
  },

  savePYQAnalysis(analysis: PYQAnalysisResult): void {
    try {
      const current = this.getPYQAnalyses();
      current.unshift(analysis);
      localStorage.setItem(STORAGE_KEYS.PYQ_ANALYSES, JSON.stringify(current.slice(0, 20)));
      notifyChange();
    } catch (e) {
      console.error('Failed to save PYQ analysis', e);
    }
  },

  // --- Mock Exam Sessions ---
  getMockExams(): MockExamSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOCK_EXAMS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMockExam(session: MockExamSession): void {
    try {
      const current = this.getMockExams();
      const idx = current.findIndex((m) => m.id === session.id);
      if (idx !== -1) {
        current[idx] = session;
      } else {
        current.unshift(session);
      }
      localStorage.setItem(STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(current.slice(0, 30)));
      notifyChange();
    } catch (e) {
      console.error('Failed to save mock exam', e);
    }
  },

  // --- Contextual AI Tutor Chat ---
  getTutorMessages(): TutorMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TUTOR_CHAT);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveTutorMessage(msg: TutorMessage): void {
    try {
      const current = this.getTutorMessages();
      current.push(msg);
      localStorage.setItem(STORAGE_KEYS.TUTOR_CHAT, JSON.stringify(current.slice(-50)));
      notifyChange();
    } catch (e) {
      console.error('Failed to save tutor message', e);
    }
  },

  clearTutorChat(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TUTOR_CHAT);
      notifyChange();
    } catch (e) {
      // ignore
    }
  },

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    notifyChange();
  },

  exportDataJson(): string {
    const backup: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const item = localStorage.getItem(key);
        if (item) backup[name] = JSON.parse(item);
      } catch (e) {
        // ignore
      }
    });
    return JSON.stringify(backup, null, 2);
  },

  importDataJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.ACTIVE_PLAN) localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(data.ACTIVE_PLAN));
      if (data.SAVED_PLANS) localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(data.SAVED_PLANS));
      if (data.QUIZ_HISTORY) localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(data.QUIZ_HISTORY));
      if (data.PREFERENCES) localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(data.PREFERENCES));
      if (data.PROGRESS) localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.PROGRESS));
      if (data.TOPIC_MASTERY) localStorage.setItem(STORAGE_KEYS.TOPIC_MASTERY, JSON.stringify(data.TOPIC_MASTERY));
      if (data.MISTAKES) localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(data.MISTAKES));
      if (data.SPACED_REVIEWS) localStorage.setItem(STORAGE_KEYS.SPACED_REVIEWS, JSON.stringify(data.SPACED_REVIEWS));
      if (data.STUDY_SESSIONS) localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(data.STUDY_SESSIONS));
      if (data.SYLLABUS) localStorage.setItem(STORAGE_KEYS.SYLLABUS, JSON.stringify(data.SYLLABUS));
      if (data.STUDY_MATERIALS) localStorage.setItem(STORAGE_KEYS.STUDY_MATERIALS, JSON.stringify(data.STUDY_MATERIALS));
      if (data.FLASHCARDS) localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(data.FLASHCARDS));
      if (data.PYQ_ANALYSES) localStorage.setItem(STORAGE_KEYS.PYQ_ANALYSES, JSON.stringify(data.PYQ_ANALYSES));
      if (data.MOCK_EXAMS) localStorage.setItem(STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(data.MOCK_EXAMS));
      if (data.TUTOR_CHAT) localStorage.setItem(STORAGE_KEYS.TUTOR_CHAT, JSON.stringify(data.TUTOR_CHAT));
      this.recalculateProgress();
      notifyChange();
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  },
};
