import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Filter,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { ApiClient } from '../services/api/apiClient';
import { PlanForm } from '../components/planner/PlanForm';
import { TaskCard } from '../components/planner/TaskCard';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { Banner } from '../components/layout/Banner';
import { StudyPlanRequest, StudyTask, AdaptedPlanResponse } from '../types';
import { Badge } from '../components/ui/Common';

export const PlannerPage: React.FC = () => {
  const {
    activePlan,
    savedPlans,
    setActivePlan,
    updateTaskStatus,
    updateTaskNotes,
    deletePlan,
  } = useStorage();

  const [showCreateForm, setShowCreateForm] = useState(!activePlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [adaptiveTargetTask, setAdaptiveTargetTask] = useState<StudyTask | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleGeneratePlan = async (request: StudyPlanRequest) => {
    setIsGenerating(true);
    setErrorNotice(null);
    try {
      const generatedPlan = await ApiClient.generateStudyPlan(request);
      setActivePlan(generatedPlan);
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorNotice(err.message || 'We could not generate your study plan right now. Please try again.');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskStatusChange = (taskId: string, status: 'pending' | 'completed' | 'missed') => {
    updateTaskStatus(taskId, status);
  };

  const handlePlanAdapted = (adapted: AdaptedPlanResponse) => {
    if (activePlan) {
      setActivePlan({
        ...activePlan,
        tasks: adapted.updatedTasks,
      });
    }
  };

  // Filter tasks
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
            SMART TIMETABLE &bull; ADAPTIVE ENGINE
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
            Study Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalized study schedule tailored to your available capacity and syllabus topics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activePlan && (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'View Current Plan' : 'Generate New Plan'}
            </button>
          )}
        </div>
      </div>

      {errorNotice && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-xs font-semibold text-rose-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generation Form or Current Plan View */}
      {showCreateForm || !activePlan ? (
        <div className="max-w-4xl mx-auto">
          <PlanForm onSubmit={handleGeneratePlan} isLoading={isGenerating} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Plan Overview Card */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100/80 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Active Study Plan
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-0.5">
                  {activePlan.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span>Target Exam: <strong className="text-slate-800">{activePlan.examDate}</strong></span>
                  <span>&bull;</span>
                  <span>{activePlan.dailyHours} hours/day</span>
                  <span>&bull;</span>
                  <span>{activePlan.level} Level</span>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="text-right sm:min-w-[180px]">
                <div className="text-xs font-semibold text-slate-500">
                  {completedCount} of {totalCount} Tasks Completed
                </div>
                <div className="text-lg font-bold text-[#1E1B4B]">{progressPercent}% Finished</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Assumptions & Notes */}
            {activePlan.assumptions && activePlan.assumptions.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-purple-100 text-xs text-slate-600 space-y-1">
                <strong className="text-slate-900 font-semibold">StudyMate AI Scheduling Assumptions:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {activePlan.assumptions.map((assump, i) => (
                    <li key={i}>{assump}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-purple-100 p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-purple-600" /> Status:
              </span>
              {(['all', 'pending', 'completed', 'missed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Priority:</span>
              {(['all', 'High', 'Medium', 'Low'] as const).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFilterPriority(pr)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    filterPriority === pr
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          {/* Task Cards Grid */}
          {filteredTasks.length > 0 ? (
            <div className="space-y-3.5">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusChange}
                  onMissedClick={(t) => setAdaptiveTargetTask(t)}
                  onSaveNotes={updateTaskNotes}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No tasks match your active filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}
                className="text-xs text-purple-600 font-semibold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Adaptive Modal when Missed is clicked */}
      {adaptiveTargetTask && activePlan && (
        <AdaptiveModal
          task={adaptiveTargetTask}
          currentPlan={activePlan}
          isOpen={Boolean(adaptiveTargetTask)}
          onClose={() => setAdaptiveTargetTask(null)}
          onPlanAdapted={handlePlanAdapted}
        />
      )}
    </div>
  );
};
