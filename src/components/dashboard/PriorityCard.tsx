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
      <div className="bg-white rounded-2xl border border-[#E2DDD2] p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-[#EAF2F6] text-[#1A5C7A] flex items-center justify-center mx-auto">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1720]">All Caught Up For Today!</h2>
        <p className="text-sm text-[#6B747A] max-w-md mx-auto leading-relaxed">
          You have completed all scheduled tasks for today. Practice with a focused quiz or explore a new topic ahead of time.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/quiz"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4" /> Practice Quiz
          </Link>
          <Link
            to="/explain"
            className="px-5 py-2.5 text-xs font-semibold text-[#0B1720] bg-[#F4F1EA] hover:bg-[#EAE6DD] rounded-xl flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#1A5C7A]" /> Explain a Topic
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <div className="bg-[#071923] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#143A4E]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Tag & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#143A4E] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0E2C3D] text-sky-300 border border-[#1C4E6A] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              Today's Focus
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              {task.durationMinutes} min focus
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              {task.priority} Priority
            </span>
          </div>
        </div>

        {/* Editorial Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
            {task.topic}
          </h2>
          <p className="text-sm sm:text-base font-medium text-slate-300">{task.subtopic}</p>
        </div>

        {/* Objective Box */}
        <div className="p-4 rounded-xl bg-[#0D2732] border border-[#1A455C] text-xs sm:text-sm text-slate-200 leading-relaxed">
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
                className={`px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-white ${
                  isCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white text-[#071923] hover:bg-slate-100'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {isCompleted ? 'Completed! Mark Pending' : 'Start Session / Complete'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/explain?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#0E2838] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Explain Concept
            </Link>

            <Link
              to={`/quiz?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#0E2838] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Test Knowledge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

