import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { StudyTask, StudyPlan, AdaptedPlanResponse } from '../../types';
import { ApiClient } from '../../services/api/apiClient';

interface AdaptiveModalProps {
  task: StudyTask;
  currentPlan: StudyPlan;
  isOpen: boolean;
  onClose: () => void;
  onPlanAdapted: (adapted: AdaptedPlanResponse) => void;
}

export const AdaptiveModal: React.FC<AdaptiveModalProps> = ({
  task,
  currentPlan,
  isOpen,
  onClose,
  onPlanAdapted,
}) => {
  const [reason, setReason] = useState('Unexpected schedule conflict / busy day');
  const [customReason, setCustomReason] = useState('');
  const [extraMinutes, setExtraMinutes] = useState(30);
  const [isAdapting, setIsAdapting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptedPreview, setAdaptedPreview] = useState<AdaptedPlanResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const standardReasons = [
    'Unexpected schedule conflict / busy day',
    'Felt unwell or needed rest',
    'Previous topic was harder than expected',
    'Urgent college assignment / work deadline',
    'Other reason',
  ];

  const handleGenerateAdjustment = async () => {
    setIsAdapting(true);
    setError(null);

    const finalReason = reason === 'Other reason' && customReason ? customReason : reason;

    try {
      const res = await ApiClient.adaptPlan({
        planId: currentPlan.id,
        currentPlan,
        missedTaskId: task.id,
        missedReason: finalReason,
        extraTimeAvailableMinutes: extraMinutes,
      });
      setAdaptedPreview(res);
    } catch (err: any) {
      setError(err.message || 'We could not adapt your study plan right now. Please try again.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handleApply = () => {
    if (adaptedPreview) {
      onPlanAdapted(adaptedPreview);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adaptive-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0F1D32] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5E1D6] dark:border-[#1E2F47] relative text-slate-900 dark:text-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
          aria-label="Close adaptive modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!adaptedPreview ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Adaptive Recovery Assistant</span>
              </div>
              <h2 id="adaptive-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Missed Session Recovery
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Tell StudyMate AI what happened and how much extra time you can allocate. We will redistribute{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">{task.topic}</strong> without overloading your days.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">Missed Task</span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {task.topic} — {task.subtopic}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 tabular-nums">
                <span>{task.durationMinutes} min</span>
                <span aria-hidden="true">&middot;</span>
                <span>{task.priority} Priority</span>
                <span aria-hidden="true">&middot;</span>
                <span>{task.day}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="miss-reason" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Why was this session missed?
              </label>
              <select
                id="miss-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {standardReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {reason === 'Other reason' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe reason briefly..."
                  className="w-full text-sm p-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  aria-label="Custom missed session reason"
                />
              )}
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Can you add any extra study minutes over upcoming days?
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setExtraMinutes(mins)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer tabular-nums ${
                      extraMinutes === mins
                        ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600 dark:border-teal-600'
                        : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/50'
                    }`}
                  >
                    {mins === 0 ? 'None (0m)' : `+${mins} min`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Priority order: exam-critical concepts, weak topics, spaced revision, then practice.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-200"
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
              <button
                id="adaptive-modal-cancel-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="adaptive-modal-recalibrate-btn"
                type="button"
                onClick={handleGenerateAdjustment}
                disabled={isAdapting}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAdapting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating Reschedule...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Recalibrate My Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-700 dark:text-lime-400 mb-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Schedule Rebalanced</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Plan Recalibration Ready
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {adaptedPreview.encouragementMessage}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm space-y-2.5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>How StudyMate AI Rebalanced Your Work</span>
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {adaptedPreview.redistributionSummary}
              </p>

              <div className="pt-2 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Prioritization Order
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {adaptedPreview.priorityOrder.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-[#0F1D32] text-slate-800 dark:text-slate-200 border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-medium"
                    >
                      {idx + 1}. {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
              <button
                type="button"
                onClick={() => setAdaptedPreview(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-lg cursor-pointer"
              >
                &larr; Change Details
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Recalibrated Plan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
