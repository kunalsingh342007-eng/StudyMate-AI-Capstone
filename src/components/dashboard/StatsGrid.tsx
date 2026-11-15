import React from 'react';
import { Flame, CheckCircle2, Clock, Calendar, HelpCircle, BookOpen } from 'lucide-react';
import { StudyProgress, StudyPlan } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StatsGridProps {
  progress: StudyProgress;
  activePlan: StudyPlan | null;
  dueReviewsCount?: number;
  assessedConceptsCount?: number;
  targetExamDate?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  progress,
  activePlan,
  dueReviewsCount = 0,
  assessedConceptsCount,
  targetExamDate,
}) => {
  let defaultDuration = 45;

  try {
    const auth = useAuth();
    if (auth?.preferences?.defaultStudyDurationMinutes) {
      defaultDuration = auth.preferences.defaultStudyDurationMinutes;
    }
  } catch {
    // Safe fallback when rendered standalone outside AuthProvider in unit tests
  }

  const today = new Date();
  const effectiveExamDate = activePlan?.examDate || targetExamDate;
  let daysUntilExam: number | null = null;
  if (effectiveExamDate) {
    const examTime = new Date(effectiveExamDate).getTime();
    if (!Number.isNaN(examTime)) {
      daysUntilExam = Math.max(0, Math.ceil((examTime - today.getTime()) / (1000 * 3600 * 24)));
    }
  }

  const totalTasks = progress.totalTasksCount || activePlan?.tasks.length || 0;
  const completionRate =
    totalTasks > 0 ? Math.round((progress.completedTasksCount / totalTasks) * 100) : 0;

  const conceptsCount =
    typeof assessedConceptsCount === 'number'
      ? assessedConceptsCount
      : progress.masteredTopics.length + progress.weakTopicsIdentified.length;

  const hasRecordedActivity =
    progress.completedTasksCount > 0 ||
    progress.quizzesTaken > 0 ||
    progress.totalHoursStudied > 0;

  const stats = [
    {
      label: 'Completed Sessions',
      value: `${progress.completedTasksCount} / ${totalTasks}`,
      sub: totalTasks > 0 ? `${completionRate}% of plan` : 'No tasks added yet',
      icon: CheckCircle2,
      tone: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50',
    },
    {
      label: 'Study Time',
      value: `${progress.totalHoursStudied}h`,
      sub: hasRecordedActivity ? `${defaultDuration}m target focus` : 'Appears after first session',
      icon: Clock,
      tone: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50',
    },
    {
      label: 'Active Streak',
      value: `${progress.streakDays} Day${progress.streakDays === 1 ? '' : 's'}`,
      sub: hasRecordedActivity ? 'Logged continuity' : 'Starts on first activity',
      icon: Flame,
      tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      label: 'Quizzes Completed',
      value: `${progress.quizzesTaken}`,
      sub: progress.quizzesTaken > 0 ? `Recent avg: ${progress.averageQuizScore}%` : 'No quizzes scored yet',
      icon: HelpCircle,
      tone: 'text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40',
    },
    {
      label: 'Concepts Assessed',
      value: `${conceptsCount}`,
      sub:
        dueReviewsCount > 0
          ? `${dueReviewsCount} spaced review${dueReviewsCount === 1 ? '' : 's'} due`
          : conceptsCount > 0
          ? 'No reviews overdue'
          : 'Complete a quiz to measure',
      icon: BookOpen,
      tone: 'text-slate-700 dark:text-slate-200 bg-[#EFECE3] dark:bg-[#16263D]',
    },
    {
      label: 'Exam Window',
      value: daysUntilExam !== null ? `${daysUntilExam} Days` : 'Not set',
      sub: activePlan?.subject
        ? activePlan.subject
        : targetExamDate
        ? 'From study profile'
        : 'Set target date in planner',
      icon: Calendar,
      tone: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50',
    },
  ];

  return (
    <div className="space-y-3">
      {!hasRecordedActivity && (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Progress metrics, streaks, and mastery averages start at zero and update automatically once you complete a task, study session, or quiz.
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-4 sm:p-5 flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${stat.tone} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                  {stat.value}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
