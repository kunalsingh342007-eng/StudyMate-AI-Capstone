import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Clock, RefreshCw, Target } from 'lucide-react';
import { StudyRecommendation } from '../../types';
import { StatusIndicator } from '../ui/Common';

interface NextBestActionProps {
  recommendations: StudyRecommendation[];
}

export const NextBestAction: React.FC<NextBestActionProps> = ({ recommendations }) => {
  const [index, setIndex] = useState(0);

  if (recommendations.length === 0) {
    return (
      <section
        aria-label="Next Best Action"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
          <Compass className="w-4 h-4" />
          <span>Next Best Action</span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Set Your First Study Goal
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Recommendations appear only when there is enough of your own study data. Create a study plan or complete an assessment to unlock personalized next steps.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/planner"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Build Schedule</span>
          </Link>
          <Link
            to="/quiz"
            className="px-4 py-2 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Take Diagnostic Quiz
          </Link>
        </div>
      </section>
    );
  }

  const safeIdx = index % recommendations.length;
  const current = recommendations[safeIdx];

  return (
    <section
      aria-label="Next Best Action"
      className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3">
        <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
          <Compass className="w-4 h-4" />
          <span>Next Best Action</span>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator
            label={`${current.priority} Priority`}
            tone={current.priority === 'High' ? 'amber' : 'teal'}
          />
          {recommendations.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % recommendations.length)}
              className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 cursor-pointer"
              title="Cycle next recommendation"
            >
              <RefreshCw className="w-3 h-3" />
              <span>
                {safeIdx + 1}/{recommendations.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
          {current.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {current.description}
        </p>
        <div className="p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Why this next: </span>
          {current.reason}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>~{current.estimatedMinutes} min</span>
        </span>

        <Link
          to={current.actionRoute}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>{current.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
};
