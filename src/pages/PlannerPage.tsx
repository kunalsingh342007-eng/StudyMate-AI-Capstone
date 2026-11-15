import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Wrench,
  ListPlus,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiClient } from '../services/api/apiClient';
import { PlanForm } from '../components/planner/PlanForm';
import { PlanReviewPanel } from '../components/planner/PlanReviewPanel';
import { ManualScheduleBuilder } from '../components/planner/ManualScheduleBuilder';
import { CreateTaskModal } from '../components/planner/CreateTaskModal';
import { TaskCard } from '../components/planner/TaskCard';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { Banner } from '../components/layout/Banner';
import { PageHeader, StudioPanel, ProgressMeter } from '../components/ui/Common';
import { StudyPlan, StudyPlanRequest, StudyTask, AdaptedPlanResponse, TaskPriority } from '../types';

export const PlannerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activePlan,
    savedPlans,
    userProfile,
    setActivePlan,
    addTaskToActivePlan,
    updateTaskStatus,
    updateTaskNotes,
    deletePlan,
    saveUserProfile,
  } = useStorage();
  const { updateProfile } = useAuth();
  const { showToast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(!activePlan);
  const [showManualBuilder, setShowManualBuilder] = useState(
    () => searchParams.get('mode') === 'manual'
  );
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(
    () => searchParams.get('action') === 'new-task'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftPlan, setDraftPlan] = useState<StudyPlan | null>(null);
  const [lastRequest, setLastRequest] = useState<StudyPlanRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [adaptiveTargetTask, setAdaptiveTargetTask] = useState<StudyTask | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const action = searchParams.get('action');
    if (mode === 'manual') {
      setShowManualBuilder(true);
      setShowCreateForm(false);
      setDraftPlan(null);
    }
    if (action === 'new-task') {
      setShowCreateTaskModal(true);
    }
  }, [searchParams]);

  const clearQueryParam = (param: string) => {
    if (searchParams.has(param)) {
      const next = new URLSearchParams(searchParams);
      next.delete(param);
      setSearchParams(next, { replace: true });
    }
  };

  const markOnboardingCompleteFromPlan = (plan: StudyPlan) => {
    const profilePatch = {
      onboardingCompleted: true,
      subjects:
        userProfile.subjects && userProfile.subjects.length > 0
          ? Array.from(new Set([...userProfile.subjects, plan.subject]))
          : [plan.subject],
      targetExamDate: plan.examDate,
      dailyGoalHours: plan.dailyHours,
      ...(plan.weakTopics?.length ? { weakTopics: plan.weakTopics } : {}),
      ...(plan.learningGoal ? { learningGoal: plan.learningGoal } : {}),
      ...(plan.timetable ? { timetable: plan.timetable } : {}),
    };
    saveUserProfile(profilePatch);
    updateProfile(profilePatch).catch(() => {});
  };

  const handleGeneratePlan = async (request: StudyPlanRequest) => {
    setIsGenerating(true);
    setErrorNotice(null);
    setLastRequest(request);
    try {
      const generatedPlan = await ApiClient.generateStudyPlan(request);
      setDraftPlan(generatedPlan);
      setShowCreateForm(false);
      setShowManualBuilder(false);
    } catch (err: any) {
      setErrorNotice(
        err.message ||
          'We could not generate your study plan right now. You can retry or create your schedule manually.'
      );
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateDraft = async () => {
    if (!lastRequest) return;
    setIsGenerating(true);
    setErrorNotice(null);
    try {
      const regenerated = await ApiClient.generateStudyPlan(lastRequest);
      setDraftPlan(regenerated);
    } catch (err: any) {
      setErrorNotice(
        err.message ||
          'Could not regenerate your draft right now. Your current draft is preserved—you can edit it or switch to manual mode.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptDraft = (finalizedPlan: StudyPlan) => {
    setActivePlan(finalizedPlan);
    markOnboardingCompleteFromPlan(finalizedPlan);
    setDraftPlan(null);
    setShowCreateForm(false);
    setShowManualBuilder(false);
    showToast(`Saved study plan for ${finalizedPlan.subject}`, 'success');
  };

  const handleSaveManualPlan = (manualPlan: StudyPlan) => {
    setActivePlan(manualPlan);
    markOnboardingCompleteFromPlan(manualPlan);
    setShowManualBuilder(false);
    setShowCreateForm(false);
    setDraftPlan(null);
    setErrorNotice(null);
    clearQueryParam('mode');
    showToast(`Saved manual study plan for ${manualPlan.subject}`, 'success');
  };

  const handleCreateSingleTask = (taskInput: {
    topic: string;
    subtopic?: string;
    date?: string;
    durationMinutes?: number;
    priority?: TaskPriority;
    learningObjective?: string;
    subjectName?: string;
  }) => {
    const updatedPlan = addTaskToActivePlan(taskInput);
    if (updatedPlan) {
      if (!userProfile.onboardingCompleted) {
        saveUserProfile({ onboardingCompleted: true });
        updateProfile({ onboardingCompleted: true }).catch(() => {});
      }
      setShowCreateForm(false);
      setShowManualBuilder(false);
      clearQueryParam('action');
      showToast(`Added "${taskInput.topic}" to your schedule`, 'success');
    }
  };

  const handleTaskStatusChange = (taskId: string, status: 'pending' | 'completed' | 'missed') => {
    const targetTask = activePlan?.tasks.find((t) => t.id === taskId);
    const previousStatus = targetTask?.status || 'pending';
    updateTaskStatus(taskId, status);
    if (targetTask) {
      showToast(
        status === 'completed'
          ? `Completed "${targetTask.topic}"`
          : `Moved "${targetTask.topic}" back to ${status}`,
        status === 'completed' ? 'success' : 'info',
        {
          label: 'Undo',
          onClick: () => updateTaskStatus(taskId, previousStatus),
        }
      );
    }
  };

  const handleSaveNotes = (taskId: string, notes: string) => {
    updateTaskNotes(taskId, notes);
    showToast('Task study notes saved', 'success');
  };

  const handlePlanAdapted = (adapted: AdaptedPlanResponse) => {
    if (activePlan) {
      const snapshot = { ...activePlan, tasks: [...activePlan.tasks] };
      setActivePlan({
        ...activePlan,
        tasks: adapted.updatedTasks,
      });
      showToast('Study schedule recalibrated around your capacity', 'success', {
        label: 'Undo',
        onClick: () => setActivePlan(snapshot),
      });
    }
  };

  const handleDeleteActivePlan = () => {
    if (!activePlan) return;
    const deletedSnapshot = activePlan;
    deletePlan(activePlan.id);
    setConfirmDeletePlan(false);
    showToast(`Deleted "${deletedSnapshot.subject}" plan`, 'info', {
      label: 'Undo',
      onClick: () => setActivePlan(deletedSnapshot),
    });
  };

  const filteredTasks = activePlan
    ? activePlan.tasks.filter((t) => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        return true;
      })
    : [];

  const completedCount = activePlan?.tasks.filter((t) => t.status === 'completed').length || 0;
  const totalCount = activePlan?.tasks.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      <PageHeader
        eyebrow="Adaptive Study Schedule"
        title="Study Planner"
        description="Personalized study sessions balanced against your exam date, daily capacity, and weak topics."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedPlans.length > 1 && activePlan && (
              <div className="flex items-center gap-2">
                <label htmlFor="saved-plan-select" className="sr-only">
                  Switch active study plan
                </label>
                <select
                  id="saved-plan-select"
                  value={activePlan.id}
                  onChange={(e) => {
                    const found = savedPlans.find((p) => p.id === e.target.value);
                    if (found) {
                      setActivePlan(found);
                      setShowCreateForm(false);
                      setShowManualBuilder(false);
                      setDraftPlan(null);
                      showToast(`Switched to ${found.subject}`, 'info');
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  {savedPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.subject} ({plan.examDate})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowCreateTaskModal(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ListPlus className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>Create Task</span>
            </button>

            {activePlan && !draftPlan && (
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setShowManualBuilder(false);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateForm ? 'View Current Plan' : 'New Study Plan'}</span>
              </button>
            )}
          </div>
        }
      />

      {errorNotice && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowManualBuilder(true);
                setShowCreateForm(false);
                setErrorNotice(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-rose-200 dark:border-rose-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-teal-600 flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Create Schedule Manually</span>
            </button>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-xs font-semibold text-rose-800 dark:text-rose-300 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {draftPlan ? (
        <div className="max-w-4xl mx-auto">
          <PlanReviewPanel
            proposedPlan={draftPlan}
            onAccept={handleAcceptDraft}
            onRegenerate={lastRequest ? handleRegenerateDraft : undefined}
            onCancel={() => {
              setDraftPlan(null);
              setShowCreateForm(true);
            }}
            isRegenerating={isGenerating}
          />
        </div>
      ) : showManualBuilder ? (
        <div className="max-w-4xl mx-auto">
          <ManualScheduleBuilder
            initialSubject={lastRequest?.subject || userProfile.subjects?.[0] || ''}
            initialTopics={lastRequest?.topics || []}
            initialExamDate={lastRequest?.examDate || userProfile.targetExamDate || ''}
            initialDailyHours={lastRequest?.dailyHours || userProfile.dailyGoalHours || 2}
            initialWeakTopics={lastRequest?.weakTopics || userProfile.weakTopics || []}
            initialPreferredDays={lastRequest?.preferredDays || userProfile.preferredStudyDays}
            initialLevel={lastRequest?.level || 'Intermediate'}
            initialLearningGoal={lastRequest?.learningGoal || userProfile.learningGoal || ''}
            initialTimetable={lastRequest?.timetable || userProfile.timetable || ''}
            onSavePlan={handleSaveManualPlan}
            onCancel={() => {
              setShowManualBuilder(false);
              clearQueryParam('mode');
              if (!activePlan) setShowCreateForm(true);
            }}
          />
        </div>
      ) : showCreateForm || !activePlan ? (
        <div className="max-w-4xl mx-auto">
          <PlanForm
            onSubmit={handleGeneratePlan}
            isLoading={isGenerating}
            onManualMode={() => {
              setShowManualBuilder(true);
              setShowCreateForm(false);
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Plan Overview Card */}
          <StudioPanel className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-[0.14em] font-mono">
                  {activePlan.isManual ? 'Manual Study Plan' : 'Active Study Plan'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {activePlan.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                    Exam: <strong className="text-slate-900 dark:text-slate-100">{activePlan.examDate}</strong>
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{activePlan.dailyHours} hours/day</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{activePlan.level} Level</span>
                </div>
                {activePlan.learningGoal && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    Goal: {activePlan.learningGoal}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:items-end gap-3 sm:min-w-[220px]">
                <div className="w-full space-y-1.5 sm:text-right">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                    {completedCount} of {totalCount} Tasks Completed
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {progressPercent}% Complete
                  </div>
                  <ProgressMeter value={progressPercent} tone="teal" label="Plan completion" />
                </div>

                {confirmDeletePlan ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rose-700 dark:text-rose-300 font-medium">Delete plan?</span>
                    <button
                      type="button"
                      onClick={handleDeleteActivePlan}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePlan(false)}
                      className="px-2.5 py-1 rounded-lg bg-[#EFECE3] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePlan(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Plan</span>
                  </button>
                )}
              </div>
            </div>

            {activePlan.assumptions && activePlan.assumptions.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <strong className="text-slate-900 dark:text-slate-100 font-semibold block">
                  Scheduling Notes &amp; Capacity Assumptions
                </strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {activePlan.assumptions.map((assump, i) => (
                    <li key={i}>{assump}</li>
                  ))}
                </ul>
              </div>
            )}
          </StudioPanel>

          {/* Filters Bar */}
          <StudioPanel className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" /> Status:
              </span>
              {(['all', 'pending', 'completed', 'missed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">Priority:</span>
              {(['all', 'High', 'Medium', 'Low'] as const).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFilterPriority(pr)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filterPriority === pr
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </StudioPanel>

          {/* Task Cards */}
          {filteredTasks.length > 0 ? (
            <div className="space-y-3.5">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusChange}
                  onMissedClick={(t) => setAdaptiveTargetTask(t)}
                  onSaveNotes={handleSaveNotes}
                />
              ))}
            </div>
          ) : (
            <StudioPanel className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No tasks match your active filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}
                className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </StudioPanel>
          )}
        </div>
      )}

      {adaptiveTargetTask && activePlan && (
        <AdaptiveModal
          task={adaptiveTargetTask}
          currentPlan={activePlan}
          isOpen={Boolean(adaptiveTargetTask)}
          onClose={() => setAdaptiveTargetTask(null)}
          onPlanAdapted={handlePlanAdapted}
        />
      )}

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        defaultSubject={activePlan?.subject || userProfile.subjects?.[0] || ''}
        onClose={() => {
          setShowCreateTaskModal(false);
          clearQueryParam('action');
        }}
        onCreateTask={handleCreateSingleTask}
      />
    </div>
  );
};

