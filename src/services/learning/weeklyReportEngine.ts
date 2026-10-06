import {
  WeeklyReportData,
  TopicMastery,
  QuizResult,
  QuestionMistake,
  StudyProgress,
  StudyPlan,
  ExamReadinessScore,
} from '../../types';

export const WeeklyReportEngine = {
  generateReport(params: {
    progress: StudyProgress;
    activePlan: StudyPlan | null;
    masteries: Record<string, TopicMastery>;
    quizHistory: QuizResult[];
    mistakes: QuestionMistake[];
    readinessScore: ExamReadinessScore;
  }): WeeklyReportData {
    const { progress, activePlan, masteries, quizHistory, mistakes, readinessScore } = params;

    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = today.toISOString().split('T')[0];

    // Filter quizzes taken in the last 7 days
    const recentQuizzes = quizHistory.filter((q) => {
      const qDate = new Date(q.completedAt);
      return qDate >= weekStart;
    });

    const averageQuizScore =
      recentQuizzes.length > 0
        ? Math.round(recentQuizzes.reduce((acc, q) => acc + q.percentage, 0) / recentQuizzes.length)
        : progress.averageQuizScore;

    // Determine strongest improvement and biggest concern topics
    const masteryList = Object.values(masteries);
    let strongestImprovementTopic = 'Data Structures';
    let strongestImprovementDelta = 14;
    let biggestConcernTopic = 'Graph Traversal';
    let biggestConcernAccuracy = 42;

    if (masteryList.length > 0) {
      // Find highest accuracy topic
      const sortedByScore = [...masteryList].sort((a, b) => b.score - a.score);
      strongestImprovementTopic = sortedByScore[0].topic;
      strongestImprovementDelta = Math.min(25, Math.max(5, sortedByScore[0].score - 60));

      // Find lowest score
      const lowestScore = sortedByScore[sortedByScore.length - 1];
      biggestConcernTopic = lowestScore.topic;
      biggestConcernAccuracy = lowestScore.accuracy || lowestScore.score;
    }

    const resolvedMistakesCount = mistakes.filter((m) => m.resolved).length;

    // Action items
    const actionItemsNextWeek: string[] = [
      `Review core principles for ${biggestConcernTopic} before scheduling more drills.`,
      `Clear any due spaced retrieval cards to maintain retention in ${strongestImprovementTopic}.`,
      `Complete a timed Mock Exam to test pacing under realistic exam constraints.`,
    ];

    if (activePlan) {
      actionItemsNextWeek.unshift(`Complete scheduled milestones for ${activePlan.subject}.`);
    }

    return {
      weekStarting: weekStartStr,
      weekEnding: weekEndStr,
      totalMinutesStudied: (progress.totalHoursStudied || 0) * 60,
      completedTasksCount: progress.completedTasksCount || 0,
      quizzesCompleted: recentQuizzes.length || progress.quizzesTaken,
      averageQuizScore,
      strongestImprovementTopic,
      strongestImprovementDelta,
      biggestConcernTopic,
      biggestConcernAccuracy,
      currentStreak: progress.streakDays || 1,
      readinessScore: readinessScore.overallScore,
      resolvedMistakesCount,
      actionItemsNextWeek,
    };
  },
};
