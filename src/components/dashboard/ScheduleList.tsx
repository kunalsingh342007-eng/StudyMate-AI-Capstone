import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { StudyPlan, StudyTask } from '../../types';
import { Badge } from '../ui/Common';

interface ScheduleListProps {
  plan: StudyPlan | null;
  onStatusChange: (taskId: string, status: 'pending' | 'completed' | 'missed') => void;
  onMissedClick: (task: StudyTask) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ plan, onStatusChange, onMissedClick }) => {
  if (!plan || plan.tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-purple-100 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#1E1B4B]">No Active Study Plan</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Generate an intelligent study schedule to get daily tasks, spaced revision, and active practice recommendations.
        </p>
        <Link
          to="/planner"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 shadow-sm shadow-purple-600/30 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-purple-200" /> Create Study Plan
        </Link>
      </div>
    );
  }

  // Get next 5 upcoming tasks
  const upcomingTasks = plan.tasks.slice(0, 6);

  return (
    <div className="bg-white rounded-3xl border border-purple-100/80 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-purple-100/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-[#1E1B4B]">Current Study Schedule</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {plan.subject} &bull; {plan.dailyHours} hrs/day target
          </p>
        </div>
        <Link
          to="/planner"
          className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group"
        >
          <span>View Full Plan</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {upcomingTasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isMissed = task.status === 'missed';

          return (
            <div
              key={task.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isCompleted
                  ? 'bg-slate-50/70 border-purple-100/50 opacity-75'
                  : isMissed
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-[#FDFBFE] hover:bg-purple-50/30 border-purple-100/80 hover:border-purple-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, isCompleted ? 'pending' : 'completed')}
                  className={`mt-0.5 p-1 rounded-lg border transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-300 border-slate-300 hover:border-purple-600 hover:text-purple-600'
                  }`}
                  aria-label={isCompleted ? `Mark ${task.topic} pending` : `Mark ${task.topic} completed`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 font-mono">{task.day}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] text-slate-500 font-mono">{task.date}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'High'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <h4 className={`text-sm font-semibold text-[#1E1B4B] truncate mt-0.5 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                    {task.topic}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{task.subtopic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg font-mono font-medium hidden sm:inline">
                  {task.durationMinutes}m
                </span>
                {!isCompleted && !isMissed && (
                  <button
                    type="button"
                    onClick={() => onMissedClick(task)}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Missed?
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

