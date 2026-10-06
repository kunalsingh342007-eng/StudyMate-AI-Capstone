import {
  TopicMastery,
  ConfidenceLevel,
  QuestionMistake,
  SpacedReviewItem,
  WeakAreaItem,
  StudyRecommendation,
  LearningPathNode,
  StudyPlan,
  QuizResult,
} from '../../types';

export const MasteryEngine = {
  /**
   * Deterministic mastery score calculation (0 - 100)
   * Combines baseline accuracy, recency trend, logged study hours, and confidence penalties/bonuses.
   */
  calculateMasteryScore(params: {
    totalQuestions: number;
    correctQuestions: number;
    recentTrend?: number[]; // percentages of last 3-5 quiz attempts
    studyMinutes?: number;
    confidenceRatings?: { level: ConfidenceLevel; isCorrect: boolean }[];
  }): { score: number; level: 'Weak' | 'Needs Practice' | 'Mastered'; accuracy: number } {
    const { totalQuestions, correctQuestions, recentTrend = [], studyMinutes = 0, confidenceRatings = [] } = params;

    if (totalQuestions <= 0) {
      const timeBonus = Math.min(30, Math.floor(studyMinutes / 30) * 10);
      const score = Math.max(0, Math.min(100, timeBonus));
      return {
        score,
        level: score >= 75 ? 'Mastered' : score >= 50 ? 'Needs Practice' : 'Weak',
        accuracy: 0,
      };
    }

    const accuracy = Math.round((correctQuestions / totalQuestions) * 100);

    // 1. Base accuracy contribution (50% weight)
    const baseContribution = accuracy * 0.5;

    // 2. Recent performance trend contribution (30% weight)
    let trendContribution = accuracy * 0.3;
    if (recentTrend.length > 0) {
      const avgRecent = recentTrend.reduce((a, b) => a + b, 0) / recentTrend.length;
      trendContribution = avgRecent * 0.3;
    }

    // 3. Logged practical study sessions bonus (up to 15 points)
    const studyBonus = Math.min(15, Math.floor(studyMinutes / 25) * 3);

    // 4. Metacognitive confidence calibration bonus/penalty (up to +/- 8 points)
    let confidenceDelta = 0;
    confidenceRatings.forEach(({ level, isCorrect }) => {
      if (level === 'High' && isCorrect) {
        confidenceDelta += 2; // confirmed solid mastery
      } else if (level === 'High' && !isCorrect) {
        confidenceDelta -= 4; // overconfidence / misconception penalty
      } else if (level === 'Low' && isCorrect) {
        confidenceDelta += 0.5; // correct but unconfident
      } else if (level === 'Low' && !isCorrect) {
        confidenceDelta -= 1.5; // foundational deficit
      }
    });
    const boundedConfidence = Math.max(-10, Math.min(10, confidenceDelta));

    // Aggregate deterministic score
    const rawScore = baseContribution + trendContribution + studyBonus + boundedConfidence;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    let level: 'Weak' | 'Needs Practice' | 'Mastered' = 'Needs Practice';
    if (finalScore < 50) {
      level = 'Weak';
    } else if (finalScore >= 75) {
      level = 'Mastered';
    }

    return {
      score: finalScore,
      level,
      accuracy,
    };
  },

  /**
   * Analyzes student confidence vs actual correctness
   */
  evaluateConfidenceAlignment(
    confidence: ConfidenceLevel,
    isCorrect: boolean
  ): 'Misconception' | 'Lucky Guess' | 'Strong Mastery' | 'Foundational Gap' {
    if (confidence === 'High' && !isCorrect) return 'Misconception';
    if (confidence === 'Low' && isCorrect) return 'Lucky Guess';
    if (confidence === 'High' && isCorrect) return 'Strong Mastery';
    return 'Foundational Gap';
  },

  /**
   * Identifies and ranks weak areas needing immediate remediation
   */
  detectWeakAreas(
    masteries: Record<string, TopicMastery>,
    mistakes: QuestionMistake[],
    daysUntilExam: number = 30
  ): WeakAreaItem[] {
    const list: WeakAreaItem[] = [];

    Object.values(masteries).forEach((tm) => {
      const topicMistakes = mistakes.filter((m) => !m.resolved && m.topic.toLowerCase() === tm.topic.toLowerCase());
      const mistakeCount = topicMistakes.length;

      // Include if mastery is below 70% or has active mistakes
      if (tm.score < 70 || mistakeCount > 0) {
        // Urgency score calculation: lower mastery + more mistakes + closer exam = higher urgency
        const masteryDeficit = Math.max(0, 100 - tm.score);
        const mistakeFactor = mistakeCount * 12;
        const examUrgencyFactor = daysUntilExam <= 14 ? 25 : daysUntilExam <= 30 ? 12 : 5;
        const urgencyScore = masteryDeficit + mistakeFactor + examUrgencyFactor;

        let priority: 'High' | 'Medium' | 'Low' = 'Medium';
        if (urgencyScore >= 90 || tm.score < 40) {
          priority = 'High';
        } else if (urgencyScore < 45) {
          priority = 'Low';
        }

        let recommendedAction = '';
        let actionRoute = `/quiz?topic=${encodeURIComponent(tm.topic)}`;

        if (tm.score < 40) {
          recommendedAction = `Foundational revision needed: Review step-by-step breakdown then attempt 3 beginner drills.`;
          actionRoute = `/explain?topic=${encodeURIComponent(tm.topic)}`;
        } else if (mistakeCount >= 2) {
          recommendedAction = `Target active misconceptions: Resolve ${mistakeCount} unaddressed mistakes in review queue.`;
          actionRoute = `/quiz?topic=${encodeURIComponent(tm.topic)}`;
        } else {
          recommendedAction = `Reinforce recall: Practice 4 intermediate multiple-choice questions to boost mastery above 75%.`;
        }

        list.push({
          topic: tm.topic,
          mastery: tm.score,
          recentAccuracy: tm.accuracy,
          mistakeCount,
          priority,
          recommendedAction,
          actionRoute,
          urgencyScore,
        });
      }
    });

    // Sort by urgency descending
    return list.sort((a, b) => b.urgencyScore - a.urgencyScore);
  },

  /**
   * Spaced repetition interval calculator (deterministic modified Leitner)
   */
  calculateNextReview(
    currentReviewCount: number,
    performanceQuality: 'poor' | 'fair' | 'good'
  ): { intervalDays: number; nextReviewAt: string } {
    let nextIntervalDays = 1;

    if (performanceQuality === 'poor') {
      // Immediate reset: review tomorrow
      nextIntervalDays = 1;
    } else if (performanceQuality === 'fair') {
      // Conservative progression
      const ladder = [1, 2, 4, 7, 14, 21];
      const idx = Math.min(ladder.length - 1, currentReviewCount);
      nextIntervalDays = ladder[idx];
    } else {
      // Full progression: 1 -> 3 -> 7 -> 14 -> 30 days
      const ladder = [1, 3, 7, 14, 30, 60];
      const idx = Math.min(ladder.length - 1, currentReviewCount);
      nextIntervalDays = ladder[idx];
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextIntervalDays);
    const nextReviewAt = nextDate.toISOString().split('T')[0];

    return {
      intervalDays: nextIntervalDays,
      nextReviewAt,
    };
  },

  /**
   * Generates prioritized study recommendations with transparent pedagogical reasoning
   */
  generateRecommendations(params: {
    masteries: Record<string, TopicMastery>;
    dueReviews: SpacedReviewItem[];
    weakAreas: WeakAreaItem[];
    activePlan: StudyPlan | null;
    recentMistakes: QuestionMistake[];
    targetExamDate?: string;
  }): StudyRecommendation[] {
    const { masteries, dueReviews, weakAreas, activePlan, recentMistakes, targetExamDate } = params;
    const recommendations: StudyRecommendation[] = [];

    const today = new Date();
    let daysUntilExam = 30;
    if (targetExamDate) {
      const examDate = new Date(targetExamDate);
      if (!isNaN(examDate.getTime())) {
        daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
      }
    }

    // 1. Spaced Repetition Due Today recommendation
    if (dueReviews.length > 0) {
      const topDue = dueReviews[0];
      recommendations.push({
        id: `rec-spaced-${Date.now()}`,
        title: `Spaced Recall Due: ${topDue.concept || topDue.topic}`,
        description: `Scheduled memory consolidation based on your forgetting curve.`,
        reason: `It has been ${topDue.intervalDays} day(s) since your last study session. Active retrieval today cements this concept in long-term memory.`,
        type: 'review',
        targetTopic: topDue.topic,
        actionRoute: `/quiz?topic=${encodeURIComponent(topDue.topic)}`,
        actionLabel: 'Complete 5-Min Review',
        priority: 'High',
        estimatedMinutes: topDue.estimatedMinutes || 10,
      });
    }

    // 2. High-Yield Weak Area remediation
    if (weakAreas.length > 0) {
      const topWeak = weakAreas[0];
      const isImminent = daysUntilExam <= 14;

      recommendations.push({
        id: `rec-weak-${Date.now()}`,
        title: `Strengthen Weak Topic: ${topWeak.topic}`,
        description: topWeak.recommendedAction,
        reason: isImminent
          ? `Your target exam is in only ${daysUntilExam} days! Topic mastery is currently ${topWeak.mastery}% with ${topWeak.mistakeCount} unaddressed mistakes.`
          : `Current topic mastery is ${topWeak.mastery}% with an accuracy of ${topWeak.recentAccuracy}%. Addressing this closes your biggest syllabus vulnerability.`,
        type: topWeak.mastery < 40 ? 'explain' : 'quiz',
        targetTopic: topWeak.topic,
        actionRoute: topWeak.actionRoute,
        actionLabel: topWeak.mastery < 40 ? 'Review Concept Breakdown' : 'Start Target Practice Quiz',
        priority: topWeak.priority,
        estimatedMinutes: 15,
      });
    }

    // 3. Misconception alert recommendation
    const misconceptionMistakes = recentMistakes.filter((m) => !m.resolved && m.confidence === 'High');
    if (misconceptionMistakes.length > 0) {
      const target = misconceptionMistakes[0];
      recommendations.push({
        id: `rec-misconception-${Date.now()}`,
        title: `Clarify Misconception: ${target.topic}`,
        description: `You answered with High Confidence on an incorrect question regarding "${target.questionText.slice(0, 45)}...".`,
        reason: `Overconfidence on an incorrect rule creates persistent exam traps. Review the exact derivation before taking more tests.`,
        type: 'explain',
        targetTopic: target.topic,
        actionRoute: `/explain?topic=${encodeURIComponent(target.topic)}`,
        actionLabel: 'View Detailed Explanation',
        priority: 'High',
        estimatedMinutes: 8,
      });
    }

    // 4. Next syllabus milestone from active plan
    const pendingTask = activePlan?.tasks.find((t) => t.status === 'pending');
    if (pendingTask) {
      const tm = masteries[pendingTask.topic];
      const masteryStr = tm ? ` (${tm.score}% mastery)` : '';

      recommendations.push({
        id: `rec-task-${Date.now()}`,
        title: `Next Scheduled Focus: ${pendingTask.topic}`,
        description: `${pendingTask.subtopic} — ${pendingTask.learningObjective}`,
        reason: `Aligned with your daily study allocation of ${pendingTask.durationMinutes} minutes for ${pendingTask.day}.${masteryStr}`,
        type: 'plan',
        targetTopic: pendingTask.topic,
        actionRoute: `/planner`,
        actionLabel: 'View Schedule Task',
        priority: pendingTask.priority,
        estimatedMinutes: pendingTask.durationMinutes,
      });
    }

    // 5. Advancing Mastered Topic recommendation
    const masteredTopic = Object.values(masteries).find((m) => m.score >= 80);
    if (masteredTopic && recommendations.length < 4) {
      recommendations.push({
        id: `rec-adv-${Date.now()}`,
        title: `Advance Mastery: ${masteredTopic.topic}`,
        description: `You have achieved ${masteredTopic.score}% mastery. Advance to higher-difficulty edge cases.`,
        reason: `Foundational concepts are solid. Pushing into Advanced difficulty sharpens competitive exam edge.`,
        type: 'quiz',
        targetTopic: masteredTopic.topic,
        actionRoute: `/quiz?topic=${encodeURIComponent(masteredTopic.topic)}`,
        actionLabel: 'Attempt Advanced Quiz',
        priority: 'Low',
        estimatedMinutes: 12,
      });
    }

    return recommendations.slice(0, 4);
  },

  /**
   * Builds the Knowledge Map hierarchical tree
   */
  buildKnowledgeTree(activePlan: StudyPlan | null, masteries: Record<string, TopicMastery>): LearningPathNode[] {
    const defaultTopics = [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Database Management Systems',
      'Computer Networks',
    ];

    const topicsToUse = activePlan && activePlan.topics.length > 0 ? activePlan.topics : defaultTopics;

    return topicsToUse.map((topicName, idx) => {
      const tm = masteries[topicName];
      const score = tm ? tm.score : 0;

      let status: 'mastered' | 'in_progress' | 'weak' | 'not_started' = 'not_started';
      if (tm && tm.attemptsCount > 0) {
        if (score >= 75) status = 'mastered';
        else if (score >= 50) status = 'in_progress';
        else status = 'weak';
      }

      // Gather subtopics from active plan tasks matching this topic
      const subtasks = activePlan?.tasks.filter((t) => t.topic.toLowerCase().includes(topicName.toLowerCase())) || [];
      const subtopics = subtasks.slice(0, 3).map((st) => ({
        name: st.subtopic,
        mastery: st.status === 'completed' ? Math.max(score, 80) : Math.max(0, score - 15),
        status: (st.status === 'completed' ? 'mastered' : status) as 'mastered' | 'in_progress' | 'weak' | 'not_started',
      }));

      return {
        id: `node-${idx + 1}`,
        name: topicName,
        level: idx + 1,
        mastery: score,
        status,
        subtopics: subtopics.length > 0 ? subtopics : undefined,
      };
    });
  },
};
