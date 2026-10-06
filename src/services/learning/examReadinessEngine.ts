import {
  ExamReadinessScore,
  StudyPlan,
  TopicMastery,
  QuizResult,
  SpacedReviewItem,
  PYQAnalysisResult,
} from '../../types';

export const ExamReadinessEngine = {
  /**
   * Deterministically calculates an explainable Exam Readiness Score (0 - 100%)
   * Combines Syllabus Coverage (25%), Topic Mastery (30%), Recent Quiz Performance (20%),
   * Spaced Revision Coverage (15%), and PYQ Preparedness (10%).
   */
  calculateReadiness(params: {
    activePlan: StudyPlan | null;
    masteries: Record<string, TopicMastery>;
    quizHistory: QuizResult[];
    spacedReviews: SpacedReviewItem[];
    pyqAnalysis?: PYQAnalysisResult | null;
    targetExamDate?: string;
  }): ExamReadinessScore {
    const {
      activePlan,
      masteries,
      quizHistory,
      spacedReviews,
      pyqAnalysis,
      targetExamDate,
    } = params;

    // 1. Days until exam calculation
    let daysUntilExam = 30;
    const effectiveExamDate = targetExamDate || activePlan?.examDate;
    if (effectiveExamDate) {
      const parsed = new Date(effectiveExamDate);
      if (!isNaN(parsed.getTime())) {
        const diffMs = parsed.getTime() - new Date().getTime();
        daysUntilExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // 2. Syllabus Coverage (Weight: 25%)
    let syllabusCoverage = 0;
    if (activePlan && activePlan.tasks.length > 0) {
      const completed = activePlan.tasks.filter((t) => t.status === 'completed').length;
      syllabusCoverage = Math.round((completed / activePlan.tasks.length) * 100);
    } else {
      syllabusCoverage = 50; // Neutral baseline if no plan generated yet
    }

    // 3. Topic Mastery Average (Weight: 30%)
    const masteryValues = Object.values(masteries);
    let masteryAverage = 0;
    if (masteryValues.length > 0) {
      const sum = masteryValues.reduce((acc, m) => acc + m.score, 0);
      masteryAverage = Math.round(sum / masteryValues.length);
    } else {
      masteryAverage = 45; // Baseline prior to quizzes
    }

    // 4. Recent Quiz Performance (Weight: 20%)
    let recentQuizPerformance = 0;
    if (quizHistory.length > 0) {
      const recent = quizHistory.slice(0, 5);
      const sum = recent.reduce((acc, q) => acc + q.percentage, 0);
      recentQuizPerformance = Math.round(sum / recent.length);
    } else {
      recentQuizPerformance = masteryAverage;
    }

    // 5. Revision & Spaced Repetition Coverage (Weight: 15%)
    let revisionCoverage = 70;
    if (spacedReviews.length > 0) {
      const dueCount = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length;
      const totalReviews = spacedReviews.length;
      const pendingRatio = dueCount / totalReviews;
      revisionCoverage = Math.max(10, Math.min(100, Math.round((1 - pendingRatio) * 100)));
    }

    // 6. PYQ Preparedness (Weight: 10%)
    let pyqPreparedness = 60;
    if (pyqAnalysis && pyqAnalysis.topicFrequencies.length > 0) {
      // Check mastery of top PYQ topics
      const highPriority = pyqAnalysis.highPriorityTopics;
      if (highPriority.length > 0) {
        let matchedScores = 0;
        let matchedCount = 0;
        highPriority.forEach((topTopic) => {
          const match = Object.values(masteries).find(
            (m) => m.topic.toLowerCase().includes(topTopic.toLowerCase()) || topTopic.toLowerCase().includes(m.topic.toLowerCase())
          );
          if (match) {
            matchedScores += match.score;
            matchedCount++;
          }
        });
        if (matchedCount > 0) {
          pyqPreparedness = Math.round(matchedScores / matchedCount);
        }
      }
    }

    // Aggregate Weighted Score
    const rawScore =
      syllabusCoverage * 0.25 +
      masteryAverage * 0.30 +
      recentQuizPerformance * 0.20 +
      revisionCoverage * 0.15 +
      pyqPreparedness * 0.10;

    const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Categorization
    let status: 'Ready' | 'On Track' | 'At Risk' = 'On Track';
    if (overallScore >= 75 && daysUntilExam >= 3) {
      status = 'Ready';
    } else if (overallScore < 55 || (daysUntilExam <= 7 && overallScore < 70)) {
      status = 'At Risk';
    }

    // Explainable Limiting Factors
    const limitingFactors: string[] = [];
    const weakTopics = Object.values(masteries).filter((m) => m.score < 50);
    if (weakTopics.length > 0) {
      limitingFactors.push(`Low mastery in ${weakTopics.slice(0, 2).map((w) => w.topic).join(', ')} (${weakTopics[0].score}%)`);
    }

    if (syllabusCoverage < 60) {
      limitingFactors.push(`Syllabus completion is only ${syllabusCoverage}%; ${100 - syllabusCoverage}% remains unstudied`);
    }

    if (spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length > 0) {
      const dueCount = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length;
      limitingFactors.push(`${dueCount} spaced retrieval review(s) overdue in your Leitner queue`);
    }

    if (daysUntilExam <= 10 && overallScore < 70) {
      limitingFactors.push(`Exam is in only ${daysUntilExam} days with current readiness below benchmark`);
    }

    if (limitingFactors.length === 0) {
      limitingFactors.push('Maintain active recall drills on edge cases to prevent memory decay');
    }

    // Key Strengths
    const keyStrengths: string[] = [];
    const strongTopics = Object.values(masteries).filter((m) => m.score >= 75);
    if (strongTopics.length > 0) {
      keyStrengths.push(`Solid mastery achieved in ${strongTopics.slice(0, 2).map((s) => s.topic).join(', ')}`);
    }
    if (recentQuizPerformance >= 75) {
      keyStrengths.push(`High diagnostic quiz accuracy (${recentQuizPerformance}% across recent drills)`);
    }
    if (syllabusCoverage >= 70) {
      keyStrengths.push(`Strong syllabus coverage (${syllabusCoverage}% completed)`);
    }
    if (keyStrengths.length === 0) {
      keyStrengths.push('Regular study momentum and active schedule setup');
    }

    // Actionable Recommendation
    let recommendedAction = '';
    if (weakTopics.length > 0) {
      recommendedAction = `Focus next study block on ${weakTopics[0].topic}: review conceptual mechanics then complete a 4-question drill.`;
    } else if (revisionCoverage < 70) {
      recommendedAction = 'Clear your overdue spaced repetition queue to lock concepts into long-term recall.';
    } else if (pyqAnalysis && pyqPreparedness < 70) {
      recommendedAction = `Solve 3 past exam questions on ${pyqAnalysis.highPriorityTopics[0] || 'high-yield topics'}.`;
    } else {
      recommendedAction = 'Attempt a full timed Exam Simulation to benchmark pacing and exam endurance.';
    }

    return {
      overallScore,
      status,
      syllabusCoverage,
      masteryAverage,
      recentQuizPerformance,
      revisionCoverage,
      pyqPreparedness,
      daysUntilExam,
      limitingFactors,
      keyStrengths,
      recommendedAction,
      lastCalculatedAt: new Date().toISOString(),
    };
  },
};
