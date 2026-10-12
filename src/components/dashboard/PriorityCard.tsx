import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Clock, Sparkles, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { StudyTask } from '../../types';

interface PriorityCardProps {
  task: StudyTask | null;
  onComplete?: (taskId: string) => void;
  examDate?: string;
  totalPendingToday?: number;
}

export const PriorityCard: React.FC<PriorityCardProps> = ({
  task,
  onComplete,
  examDate,
  totalPendingToday,
}) => {
  if (!task) {
    return (
      <div className="bg-white rounded-3xl border border-purple-100 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#1E1B4B]">All Caught Up For Today!</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          You have completed all scheduled tasks for today. Practice with a focused quiz or explore a new topic ahead of time.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/quiz"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 shadow-sm shadow-purple-600/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4" /> Practice Quiz
          </Link>
          <Link
            to="/explain"
            className="px-5 py-2.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center gap-2 transition-colors border border-purple-200"
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> Explain a Topic
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <div className="bg-gradient-to-r from-[#1E1538] via-[#2A164D] to-[#3B1B76] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-400/20">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Tag & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-purple-200 border border-white/15 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Target className="w-3.5 h-3.5 text-purple-300" />
              Today's Focus
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-purple-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-300" />
              {task.durationMinutes} min focus
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30 font-semibold">
              {task.priority} Priority
            </span>
          </div>
        </div>

        {/* Editorial Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
            {task.topic}
          </h2>
          <p className="text-sm sm:text-base font-medium text-purple-200">{task.subtopic}</p>
        </div>

        {/* Objective Box */}
        <div className="p-4 rounded-2xl bg-white/8 border border-white/10 text-xs sm:text-sm text-purple-100 leading-relaxed backdrop-blur-xs">
          <strong className="text-white font-semibold">Core Objective: </strong>
          {task.learningObjective}
        </div>

        {/* Bottom CTA Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onComplete && (
              <button
                type="button"
                onClick={() => onComplete(task.id)}
                className={`px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-white cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white text-purple-950 hover:bg-purple-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{isCompleted ? 'Completed! Mark Pending' : 'Start Session / Complete'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/explain?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Explain Concept
            </Link>

            <Link
              to={`/quiz?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-300" /> Test Knowledge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

