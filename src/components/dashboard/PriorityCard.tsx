import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Clock, Sparkles, CheckCircle, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { StudyTask } from '../../types';
import { Badge } from '../ui/Common';

interface PriorityCardProps {
  task: StudyTask | null;
  onComplete: (taskId: string) => void;
  examDate?: string;
}

export const PriorityCard: React.FC<PriorityCardProps> = ({ task, onComplete, examDate }) => {
  if (!task) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">All Caught Up For Today!</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          You have completed all scheduled tasks for today. Practice with an AI quiz or explore a new topic ahead of time.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/quiz"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-4 h-4" /> Practice AI Quiz
          </Link>
          <Link
            to="/explain"
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" /> Explain a Topic
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-indigo-200 backdrop-blur-xs border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-300" />
              What should I study today?
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-indigo-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.durationMinutes} min focus
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/20 font-semibold">
              {task.priority} Priority
            </span>
          </div>
        </div>

        {/* Big Title */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {task.topic}
          </h2>
          <p className="text-sm sm:text-base font-medium text-indigo-200">{task.subtopic}</p>
        </div>

        {/* Objective Box */}
        <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs sm:text-sm text-indigo-50 leading-relaxed">
          <strong className="text-white">Core Objective: </strong>
          {task.learningObjective}
        </div>

        {/* Bottom CTA Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-white ${
                isCompleted
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-white text-indigo-900 hover:bg-indigo-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {isCompleted ? 'Completed! Mark Pending' : 'Mark as Completed'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/explain?topic=${encodeURIComponent(task.topic)}`}
              className="px-3 py-2 text-xs font-medium text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Explain this concept
            </Link>

            <Link
              to={`/quiz?topic=${encodeURIComponent(task.topic)}`}
              className="px-3 py-2 text-xs font-medium text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-300" /> Test knowledge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
