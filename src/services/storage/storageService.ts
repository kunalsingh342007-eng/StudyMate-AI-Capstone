import { StudyPlan, StudyTask, QuizResult, UserPreferences, StudyProgress } from '../../types';

const STORAGE_KEYS = {
  ACTIVE_PLAN: 'studymate_active_plan',
  SAVED_PLANS: 'studymate_saved_plans',
  QUIZ_HISTORY: 'studymate_quiz_history',
  PREFERENCES: 'studymate_preferences',
  PROGRESS: 'studymate_progress',
  SAVED_EXPLANATIONS: 'studymate_saved_explanations',
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
      this.recalculateProgress();
      notifyChange();
    } catch (e) {
      console.error('Failed to save quiz result', e);
    }
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
      this.recalculateProgress();
      notifyChange();
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  },
};
