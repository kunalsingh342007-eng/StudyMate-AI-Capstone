import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, ArrowRight, Check, Clock, RefreshCw } from 'lucide-react';
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adaptive-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-600"
          aria-label="Close adaptive modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!adaptedPreview ? (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Adaptive Recovery Assistant
              </div>
              <h2 id="adaptive-modal-title" className="text-xl font-bold text-slate-900">
                Missed Session Recovery
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Life happens! Tell Claude what happened and how much extra time you have. We'll redistribute{' '}
                <strong className="text-slate-900 font-semibold">{task.topic}</strong> without overloading you.
              </p>
            </div>

            {/* Target Task Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium block mb-0.5">Missed Task:</span>
              <div className="font-semibold text-slate-900">{task.topic} — {task.subtopic}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{task.durationMinutes} min</span>
                <span>&bull;</span>
                <span>{task.priority} Priority</span>
                <span>&bull;</span>
                <span>{task.day}</span>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label htmlFor="miss-reason" className="block text-xs font-semibold text-slate-900">
                Why was this session missed?
              </label>
              <select
                id="miss-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
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
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-indigo-600"
                  aria-label="Custom missed session reason"
                />
              )}
            </div>

            {/* Extra Time Availability */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-900">
                Can you add any extra study minutes over upcoming days?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setExtraMinutes(mins)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                      extraMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {mins === 0 ? 'None (0 min)' : `+${mins} min`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                AI prioritizes: 1. Exam-critical concepts, 2. Weak topics, 3. Spaced revision, 4. Practice.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                id="adaptive-modal-cancel-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="adaptive-modal-recalibrate-btn"
                type="button"
                onClick={handleGenerateAdjustment}
                disabled={isAdapting}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                {isAdapting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Calculating Reschedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Recalibrate My Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Preview Adapted Plan */
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <Check className="w-3.5 h-3.5" />
                Schedule Rebalanced
              </div>
              <h2 className="text-xl font-bold text-slate-900">Plan Recalibration Ready</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{adaptedPreview.encouragementMessage}</p>
            </div>

            {/* Redistribution Summary Card */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs sm:text-sm space-y-2">
              <h3 className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                How Claude Rebalanced Your Work:
              </h3>
              <p className="text-slate-700 leading-relaxed">{adaptedPreview.redistributionSummary}</p>

              <div className="pt-2 border-t border-indigo-100/80">
                <span className="text-xs font-semibold text-indigo-900 block mb-1">Prioritization Order:</span>
                <div className="flex flex-wrap gap-1.5">
                  {adaptedPreview.priorityOrder.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200 text-xs font-medium"
                    >
                      {idx + 1}. {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdaptedPreview(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                &larr; Change Details
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Apply Recalibrated Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
