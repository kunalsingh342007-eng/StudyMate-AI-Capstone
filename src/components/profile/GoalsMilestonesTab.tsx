import React, { useState } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  RotateCcw,
  Flame,
  HelpCircle,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  StudentGoal,
  StudentGoalStatus,
  StudyProgress,
  StudySessionRecord,
  UserProfile,
} from '../../types';
import { StudioPanel, ProgressMeter, StatusIndicator } from '../ui/Common';
import { transitionGoalStatus } from '../../services/learning/profileUtils';
import { useToast } from '../../context/ToastContext';

interface GoalsMilestonesTabProps {
  profile: UserProfile;
  progress: StudyProgress;
  studySessions: StudySessionRecord[];
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const GOAL_CATEGORIES = [
  'Academic',
  'Exam Prep',
  'Skill',
  'Project',
  'Career',
  'Personal',
] as const;

const GOAL_STATUSES: StudentGoalStatus[] = [
  'Not Started',
  'In Progress',
  'Completed',
  'Paused',
];

const inputClass =
  'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

interface GoalFormState {
  id?: string;
  title: string;
  category: string;
  description: string;
  targetDate: string;
  status: StudentGoalStatus;
  completedAt: string;
  notes: string;
  completedSteps: string;
  totalSteps: string;
}

const EMPTY_GOAL_FORM: GoalFormState = {
  title: '',
  category: 'Academic',
  description: '',
  targetDate: '',
  status: 'Not Started',
  completedAt: '',
  notes: '',
  completedSteps: '',
  totalSteps: '',
};

function statusTone(status: StudentGoalStatus): 'neutral' | 'teal' | 'lime' | 'amber' {
  switch (status) {
    case 'Completed':
      return 'lime';
    case 'In Progress':
      return 'teal';
    case 'Paused':
      return 'amber';
    default:
      return 'neutral';
  }
}

export const GoalsMilestonesTab: React.FC<GoalsMilestonesTabProps> = ({
  profile,
  progress,
  studySessions,
  onSaveProfile,
}) => {
  const { showToast } = useToast();
  const goals = profile.goals || [];
  const activeGoals = goals.filter((g) => g.status !== 'Completed');
  const completedGoals = goals.filter((g) => g.status === 'Completed');

  const [editingGoalId, setEditingGoalId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<GoalFormState>(EMPTY_GOAL_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openNewGoal = () => {
    setErrors([]);
    setEditingGoalId('new');
    setForm(EMPTY_GOAL_FORM);
  };

  const openEditGoal = (goal: StudentGoal) => {
    setErrors([]);
    setEditingGoalId(goal.id);
    setForm({
      id: goal.id,
      title: goal.title,
      category: goal.category || 'Academic',
      description: goal.description || '',
      targetDate: goal.targetDate || '',
      status: goal.status,
      completedAt: goal.completedAt || '',
      notes: goal.notes || '',
      completedSteps: goal.completedSteps !== undefined ? String(goal.completedSteps) : '',
      totalSteps: goal.totalSteps !== undefined ? String(goal.totalSteps) : '',
    });
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!form.title.trim()) {
      validationErrors.push('Goal title is required.');
    }

    const parsedTotalSteps = form.totalSteps.trim() !== '' ? Number(form.totalSteps) : undefined;
    const parsedCompletedSteps =
      form.completedSteps.trim() !== '' ? Number(form.completedSteps) : undefined;

    if (
      parsedTotalSteps !== undefined &&
      (!Number.isInteger(parsedTotalSteps) || parsedTotalSteps < 1 || parsedTotalSteps > 500)
    ) {
      validationErrors.push('Total steps must be a whole number between 1 and 500.');
    }
    if (
      parsedCompletedSteps !== undefined &&
      (!Number.isInteger(parsedCompletedSteps) || parsedCompletedSteps < 0)
    ) {
      validationErrors.push('Completed steps cannot be negative.');
    }
    if (
      parsedCompletedSteps !== undefined &&
      parsedTotalSteps !== undefined &&
      parsedCompletedSteps > parsedTotalSteps
    ) {
      validationErrors.push('Completed steps cannot exceed total steps.');
    }
    if (parsedCompletedSteps !== undefined && parsedTotalSteps === undefined) {
      validationErrors.push('Please enter total steps when tracking step progress.');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const nowIso = new Date().toISOString();
    const existing = form.id ? goals.find((g) => g.id === form.id) : undefined;

    const baseGoal: StudentGoal = {
      id: form.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: form.title.trim(),
      category: form.category.trim() || 'Academic',
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.targetDate ? { targetDate: form.targetDate } : {}),
      status: form.status,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      ...(parsedTotalSteps !== undefined
        ? {
            totalSteps: parsedTotalSteps,
            completedSteps: parsedCompletedSteps ?? 0,
          }
        : {}),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    const finalizedGoal = transitionGoalStatus(baseGoal, form.status, {
      completedAt: form.status === 'Completed' ? form.completedAt || nowIso.split('T')[0] : undefined,
      nowIso,
    });

    const nextGoals =
      editingGoalId === 'new'
        ? [finalizedGoal, ...goals]
        : goals.map((g) => (g.id === editingGoalId ? finalizedGoal : g));

    setErrors([]);
    setSaving(true);
    try {
      await onSaveProfile({ goals: nextGoals });
      setEditingGoalId(null);
      setForm(EMPTY_GOAL_FORM);
    } catch (err: any) {
      setErrors([err?.message || 'Failed to save goal.']);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goal: StudentGoal, nextStatus: StudentGoalStatus) => {
    const previousGoals = goals;
    const updatedGoal = transitionGoalStatus(goal, nextStatus);
    const nextGoals = goals.map((g) => (g.id === goal.id ? updatedGoal : g));

    setSaving(true);
    try {
      await onSaveProfile({ goals: nextGoals });
      showToast({
        variant: nextStatus === 'Completed' ? 'success' : 'info',
        title:
          nextStatus === 'Completed'
            ? `Goal completed: ${goal.title}`
            : `Goal marked ${nextStatus}`,
        description:
          nextStatus === 'Completed'
            ? 'Moved to Completed Goals & Milestones.'
            : undefined,
        action: {
          label: 'Undo',
          onClick: () => {
            onSaveProfile({ goals: previousGoals }).catch(() => {});
          },
        },
      });
    } catch (err: any) {
      setErrors([err?.message || 'Could not update goal status.']);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustSteps = async (goal: StudentGoal, delta: number) => {
    if (!goal.totalSteps) return;
    const current = goal.completedSteps || 0;
    const nextSteps = Math.max(0, Math.min(goal.totalSteps, current + delta));
    if (nextSteps === current) return;

    // Never auto-complete without explicit confirmation — keep status as-is (or In Progress if Not Started)
    const nextStatus: StudentGoalStatus =
      goal.status === 'Not Started' && nextSteps > 0 ? 'In Progress' : goal.status;

    const updatedGoal: StudentGoal = {
      ...goal,
      completedSteps: nextSteps,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await onSaveProfile({
        goals: goals.map((g) => (g.id === goal.id ? updatedGoal : g)),
      });
    } catch (err: any) {
      setErrors([err?.message || 'Could not update goal progress.']);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goal: StudentGoal) => {
    const previousGoals = goals;
    setSaving(true);
    try {
      await onSaveProfile({
        goals: goals.filter((g) => g.id !== goal.id),
      });
      if (editingGoalId === goal.id) setEditingGoalId(null);
      showToast({
        variant: 'info',
        title: `Removed goal: ${goal.title}`,
        action: {
          label: 'Undo',
          onClick: () => {
            onSaveProfile({ goals: previousGoals }).catch(() => {});
          },
        },
      });
    } catch (err: any) {
      setErrors([err?.message || 'Could not remove goal.']);
    } finally {
      setSaving(false);
    }
  };

  const studyMilestones = [
    {
      id: 'ach-1',
      title: '7-Day Consistency Streak',
      desc: 'Completed planned study intervals every day for a whole week.',
      icon: Flame,
      unlocked: progress.streakDays >= 7,
      statusText: progress.streakDays >= 7 ? 'Unlocked' : `${progress.streakDays} / 7 days`,
    },
    {
      id: 'ach-2',
      title: 'Active Retrieval Champion',
      desc: 'Completed 10 or more timed practice quizzes with AI diagnostics.',
      icon: HelpCircle,
      unlocked: progress.quizzesTaken >= 10,
      statusText: progress.quizzesTaken >= 10 ? 'Unlocked' : `${progress.quizzesTaken} / 10 quizzes`,
    },
    {
      id: 'ach-3',
      title: 'Dedicated Focus Hours',
      desc: 'Logged at least 5 hours of focused study sessions.',
      icon: Sparkles,
      unlocked: progress.totalHoursStudied >= 5 || studySessions.length >= 5,
      statusText:
        progress.totalHoursStudied >= 5 ? 'Unlocked' : `${progress.totalHoursStudied} / 5 hrs`,
    },
    {
      id: 'ach-4',
      title: 'Syllabus Momentum Milestone',
      desc: 'Completed 12 or more scheduled study tasks.',
      icon: Target,
      unlocked: progress.completedTasksCount >= 12,
      statusText:
        progress.completedTasksCount >= 12 ? 'Unlocked' : `${progress.completedTasksCount} / 12 tasks`,
    },
  ];

  const unlockedStudyCount = studyMilestones.filter((m) => m.unlocked).length;

  return (
    <div className="space-y-6">
      {/* User-Created Goals Header & Form */}
      <StudioPanel className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Personal &amp; Academic Goals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track target dates, measurable step progress, and completed milestones with explicit confirmation
            </p>
          </div>
          {editingGoalId === null && (
            <button
              type="button"
              onClick={openNewGoal}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          )}
        </div>

        {editingGoalId !== null && (
          <form
            onSubmit={handleSaveGoal}
            className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/70 dark:bg-[#16263D]/60 p-4 sm:p-5 space-y-4"
            noValidate
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingGoalId === 'new' ? 'Create New Goal' : 'Edit Goal'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingGoalId(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {errors.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1"
              >
                {errors.map((err) => (
                  <p key={err} className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="goal-title" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Goal Title <span className="text-rose-600">*</span>
                </label>
                <input
                  id="goal-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Complete Algorithms Problem Set"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="goal-category" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Category
                </label>
                <select
                  id="goal-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {GOAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="goal-status" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Status
                </label>
                <select
                  id="goal-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as StudentGoalStatus })
                  }
                  className={inputClass}
                >
                  {GOAL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="goal-target-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Target Date (optional)
                </label>
                <input
                  id="goal-target-date"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="goal-completed-steps" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Completed Steps (optional)
                </label>
                <input
                  id="goal-completed-steps"
                  type="number"
                  min={0}
                  value={form.completedSteps}
                  onChange={(e) => setForm({ ...form, completedSteps: e.target.value })}
                  placeholder="e.g. 2"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="goal-total-steps" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Total Steps (optional)
                </label>
                <input
                  id="goal-total-steps"
                  type="number"
                  min={1}
                  value={form.totalSteps}
                  onChange={(e) => setForm({ ...form, totalSteps: e.target.value })}
                  placeholder="e.g. 5"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            {form.status === 'Completed' && (
              <div className="max-w-xs">
                <label htmlFor="goal-completed-at" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Completion Date
                </label>
                <input
                  id="goal-completed-at"
                  type="date"
                  value={form.completedAt || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, completedAt: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="goal-description" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="goal-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Define what success looks like for this goal."
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="goal-notes" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Progress Notes (optional)
                </label>
                <textarea
                  id="goal-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Capture milestones reached, blockers, or reflections."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingGoalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Goal'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Active / In Progress / Paused Goals */}
        {activeGoals.length === 0 ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {goals.length === 0
                ? 'No goals created yet. Add an academic, exam, or skill milestone to track your progress.'
                : 'No active goals remaining.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const hasSteps = Boolean(goal.totalSteps && goal.totalSteps > 0);
              const stepsDone = goal.completedSteps || 0;
              const stepsTotal = goal.totalSteps || 0;
              const allStepsReached = hasSteps && stepsDone >= stepsTotal;

              return (
                <div
                  key={goal.id}
                  className="p-4 sm:p-5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {goal.title}
                        </h4>
                        <StatusIndicator label={goal.status} tone={statusTone(goal.status)} />
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {goal.category}
                        {goal.targetDate ? ` · Target: ${goal.targetDate}` : ''}
                      </p>
                      {goal.description && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                          {goal.description}
                        </p>
                      )}
                      {goal.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          Note: {goal.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={`Change status for ${goal.title}`}
                        value={goal.status}
                        disabled={saving}
                        onChange={(e) =>
                          handleStatusChange(goal, e.target.value as StudentGoalStatus)
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {GOAL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal, 'Completed')}
                        disabled={saving}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>

                      <button
                        type="button"
                        aria-label={`Edit ${goal.title}`}
                        onClick={() => openEditGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        aria-label={`Delete ${goal.title}`}
                        onClick={() => handleDeleteGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {hasSteps && (
                    <div className="pt-2 border-t border-[#E5E1D6] dark:border-[#1E2F47] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          Step Progress: {stepsDone} / {stepsTotal}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={saving || stepsDone <= 0}
                            onClick={() => handleAdjustSteps(goal, -1)}
                            aria-label={`Decrease progress for ${goal.title}`}
                            className="px-2 py-1 rounded-md border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            disabled={saving || stepsDone >= stepsTotal}
                            onClick={() => handleAdjustSteps(goal, 1)}
                            aria-label={`Increase progress for ${goal.title}`}
                            className="px-2 py-1 rounded-md border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                          >
                            +1 step
                          </button>
                        </div>
                      </div>
                      <ProgressMeter
                        value={stepsDone}
                        max={stepsTotal}
                        tone="teal"
                        label={`${goal.title} step progress`}
                      />
                      {allStepsReached && (
                        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                          <span className="text-teal-700 dark:text-teal-300 font-medium">
                            All {stepsTotal} steps finished. Ready to mark this goal completed?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(goal, 'Completed')}
                            className="px-3 py-1 rounded-lg bg-lime-700 hover:bg-lime-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Confirm Completion</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </StudioPanel>

      {/* Separate Completed Goals & Milestones Section */}
      <StudioPanel className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Completed Goals &amp; Milestones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Goals explicitly confirmed as completed — edit or reopen anytime
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-lime-700 dark:text-lime-400 tabular-nums">
            {completedGoals.length} Completed
          </span>
        </div>

        {completedGoals.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No completed personal goals yet.
          </p>
        ) : (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-xl border border-lime-300/60 dark:border-lime-500/30 bg-[#F7F5EF] dark:bg-[#16263D] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {goal.title}
                    </h4>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {goal.category}
                    {goal.completedAt ? ` · Completed on ${goal.completedAt}` : ''}
                    {goal.totalSteps
                      ? ` · Steps: ${goal.completedSteps ?? goal.totalSteps}/${goal.totalSteps}`
                      : ''}
                  </p>
                  {goal.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">{goal.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleStatusChange(goal, 'In Progress')}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit ${goal.title}`}
                    onClick={() => openEditGoal(goal)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${goal.title}`}
                    onClick={() => handleDeleteGoal(goal)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </StudioPanel>

      {/* Recorded Study Activity Milestones (existing StudyMate system milestones) */}
      <StudioPanel className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recorded Study Activity Milestones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Derived from your actual logged study streaks, quizzes, and completed tasks
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 font-mono tabular-nums">
            {unlockedStudyCount} / {studyMilestones.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {studyMilestones.map((ach) => {
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  ach.unlocked
                    ? 'bg-[#F7F5EF] dark:bg-[#16263D] border-teal-500/40'
                    : 'bg-[#F7F5EF]/60 dark:bg-[#0B1626] border-[#E5E1D6] dark:border-[#1E2F47] opacity-80'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    ach.unlocked
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-[#EFECE3] dark:bg-[#16263D] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {ach.title}
                    </h4>
                    <StatusIndicator
                      label={ach.statusText}
                      tone={ach.unlocked ? 'lime' : 'neutral'}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {ach.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </StudioPanel>
    </div>
  );
};
