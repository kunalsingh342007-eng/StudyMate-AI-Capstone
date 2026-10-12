import React from 'react';
import { Flame, CheckCircle2, Clock, Calendar, HelpCircle, TrendingUp } from 'lucide-react';
import { StudyProgress, StudyPlan } from '../../types';

interface StatsGridProps {
  progress: StudyProgress;
  activePlan: StudyPlan | null;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ progress, activePlan }) => {
  const today = new Date();
  let daysUntilExam = 30;
  if (activePlan?.examDate) {
    const examTime = new Date(activePlan.examDate).getTime();
    daysUntilExam = Math.max(0, Math.ceil((examTime - today.getTime()) / (1000 * 3600 * 24)));
  }

  const completionRate = activePlan && activePlan.tasks.length > 0
    ? Math.round((progress.completedTasksCount / activePlan.tasks.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Study Streak',
      value: `${progress.streakDays} Day${progress.streakDays === 1 ? '' : 's'}`,
      sub: 'Active daily learning',
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Completed Tasks',
      value: `${progress.completedTasksCount} / ${progress.totalTasksCount || activePlan?.tasks.length || 0}`,
      sub: `${completionRate}% syllabus covered`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Exam Countdown',
      value: `${daysUntilExam} Days`,
      sub: activePlan?.subject ? activePlan.subject.slice(0, 20) + '...' : 'Target Exam',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Total Hours Studied',
      value: `${progress.totalHoursStudied}h`,
      sub: 'Logged across sessions',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Quizzes Taken',
      value: `${progress.quizzesTaken}`,
      sub: `Avg score: ${progress.averageQuizScore}%`,
      icon: HelpCircle,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'Weak Areas',
      value: `${progress.weakTopicsIdentified.length}`,
      sub: 'Prioritized for review',
      icon: TrendingUp,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-purple-100/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{stat.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

