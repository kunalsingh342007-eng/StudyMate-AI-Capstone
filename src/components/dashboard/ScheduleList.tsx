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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-900">No Active Study Plan</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Generate an AI study schedule with Claude to get daily tasks, spaced revision, and practice recommendations.
        </p>
        <Link
          to="/planner"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs"
        >
          <Sparkles className="w-4 h-4" /> Create Study Plan
        </Link>
      </div>
    );
  }

  // Get next 5 upcoming tasks
  const upcomingTasks = plan.tasks.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Current Study Schedule</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {plan.subject} &bull; {plan.dailyHours} hrs/day target
          </p>
        </div>
        <Link
          to="/planner"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View Full Plan <ArrowRight className="w-3.5 h-3.5" />
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
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : isMissed
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, isCompleted ? 'pending' : 'completed')}
                  className={`mt-0.5 p-1 rounded-md border transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-300 border-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                  }`}
                  aria-label={isCompleted ? `Mark ${task.topic} pending` : `Mark ${task.topic} completed`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-500">{task.day}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] text-slate-500 font-mono">{task.date}</span>
                    <Badge variant={task.priority === 'High' ? 'danger' : 'default'} size="sm">
                      {task.priority}
                    </Badge>
                  </div>
                  <h4 className={`text-sm font-semibold text-slate-900 truncate mt-0.5 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                    {task.topic}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{task.subtopic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {task.durationMinutes}m
                </span>
                {!isCompleted && !isMissed && (
                  <button
                    type="button"
                    onClick={() => onMissedClick(task)}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50"
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
