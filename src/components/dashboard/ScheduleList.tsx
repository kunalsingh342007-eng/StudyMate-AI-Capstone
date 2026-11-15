import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { StudyPlan, StudyTask } from '../../types';
import { StatusIndicator } from '../ui/Common';

interface ScheduleListProps {
  plan: StudyPlan | null;
  onStatusChange: (taskId: string, status: 'pending' | 'completed' | 'missed') => void;
  onMissedClick: (task: StudyTask) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ plan, onStatusChange, onMissedClick }) => {
  if (!plan || plan.tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-[#EFECE3] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Your study plan starts here</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Build a personalized schedule around your subjects, target date, and available hours—or add tasks manually at your own pace.
          </p>
        </div>
        <Link
          to="/planner"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Build Schedule</span>
        </Link>
      </div>
    );
  }

  const upcomingTasks = plan.tasks.slice(0, 6);

  return (
    <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Study Schedule</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {plan.subject} &middot; {plan.dailyHours} hrs/day target
          </p>
        </div>
        <Link
          to="/planner"
          className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Full Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {upcomingTasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isMissed = task.status === 'missed';

          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                isCompleted
                  ? 'bg-[#F7F5EF]/70 dark:bg-[#0A1628]/60 border-[#E5E1D6] dark:border-[#1E2F47] opacity-75'
                  : isMissed
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  : 'bg-[#F7F5EF]/40 dark:bg-[#16263D]/50 hover:bg-[#EFECE3]/60 dark:hover:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, isCompleted ? 'pending' : 'completed')}
                  className={`mt-0.5 p-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                    isCompleted
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-[#0F1D32] text-slate-300 dark:text-slate-600 border-slate-300 dark:border-[#334155] hover:border-teal-600 hover:text-teal-600'
                  }`}
                  aria-label={isCompleted ? `Mark ${task.topic} pending` : `Mark ${task.topic} completed`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {task.day}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {task.date}
                    </span>
                    <StatusIndicator
                      label={isCompleted ? 'Done' : isMissed ? 'Missed' : task.priority}
                      tone={
                        isCompleted
                          ? 'lime'
                          : isMissed
                          ? 'rose'
                          : task.priority === 'High'
                          ? 'amber'
                          : 'neutral'
                      }
                    />
                  </div>
                  <h4
                    className={`text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5 ${
                      isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {task.topic}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{task.subtopic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-700 dark:text-slate-300 bg-[#EFECE3] dark:bg-[#0A1628] px-2 py-0.5 rounded font-mono tabular-nums hidden sm:inline">
                  {task.durationMinutes}m
                </span>
                {!isCompleted && !isMissed && (
                  <button
                    type="button"
                    onClick={() => onMissedClick(task)}
                    className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    Reschedule
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
