import React, { useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { StudyPlan, StudyTask, TaskPriority } from '../../types';
import { StudioPanel, StatusIndicator } from '../ui/Common';

interface PlanReviewPanelProps {
  proposedPlan: StudyPlan;
  onAccept: (editedPlan: StudyPlan) => void;
  onRegenerate?: () => void;
  onCancel: () => void;
  isRegenerating?: boolean;
}

export const PlanReviewPanel: React.FC<PlanReviewPanelProps> = ({
  proposedPlan,
  onAccept,
  onRegenerate,
  onCancel,
  isRegenerating = false,
}) => {
  const [subject, setSubject] = useState(proposedPlan.subject);
  const [examDate, setExamDate] = useState(proposedPlan.examDate);
  const [tasks, setTasks] = useState<StudyTask[]>(() =>
    proposedPlan.tasks.map((t) => ({ ...t }))
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalMinutes = tasks.reduce((sum, t) => sum + (Number(t.durationMinutes) || 0), 0);
  const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

  const handleTaskFieldChange = <K extends keyof StudyTask>(
    taskId: string,
    field: K,
    value: StudyTask[K]
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleAddCustomTask = () => {
    const newId = `task-review-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: StudyTask = {
      id: newId,
      date: todayStr,
      day: `Session ${tasks.length + 1}`,
      topic: proposedPlan.topics[0] || subject || 'Study Session',
      subtopic: 'Focused review & practice',
      durationMinutes: 45,
      priority: 'Medium',
      difficulty: proposedPlan.level,
      learningObjective: 'Review key ideas and complete recall questions.',
      revisionTask: 'Summarize key concepts in your own words.',
      practiceRecommendation: 'Solve 3-5 practice problems.',
      status: 'pending',
    };
    setTasks((prev) => [...prev, newTask]);
    setEditingTaskId(newId);
  };

  const handleConfirmAccept = () => {
    setValidationError(null);
    if (!subject.trim()) {
      setValidationError('Please provide a subject or plan title before saving.');
      return;
    }
    if (tasks.length === 0) {
      setValidationError('Add at least one study session before saving this plan.');
      return;
    }

    const sanitizedTasks = tasks.map((t) => ({
      ...t,
      topic: t.topic.trim() || subject.trim(),
      subtopic: t.subtopic.trim() || 'Study Session',
      durationMinutes: Math.max(10, Math.min(360, Number(t.durationMinutes) || 45)),
    }));

    const uniqueTopics = Array.from(
      new Set([
        ...proposedPlan.topics,
        ...sanitizedTasks.map((t) => t.topic),
      ].filter(Boolean))
    );

    const uniqueDates = new Set(sanitizedTasks.map((t) => t.date).filter(Boolean));

    const finalizedPlan: StudyPlan = {
      ...proposedPlan,
      subject: subject.trim(),
      examDate: examDate || proposedPlan.examDate,
      topics: uniqueTopics,
      tasks: sanitizedTasks,
      totalDays: Math.max(1, uniqueDates.size || proposedPlan.totalDays),
      totalStudyHours:
        Math.round((sanitizedTasks.reduce((s, t) => s + t.durationMinutes, 0) / 60) * 10) / 10,
    };

    onAccept(finalizedPlan);
  };

  const inputClass =
    'w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

  return (
    <StudioPanel className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
              Review Draft Schedule
            </span>
            <StatusIndicator
              label={proposedPlan.isManual ? 'Manual Draft' : 'AI Draft · Unsaved'}
              tone="amber"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Review Your Proposed Study Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Edit topics, session durations, or dates before saving. Nothing is saved until you accept.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={isRegenerating}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Plan Summary Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47]">
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="review-plan-subject" className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Plan Subject / Focus
          </label>
          <input
            id="review-plan-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="review-plan-date" className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Date
          </label>
          <input
            id="review-plan-date"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>

      {/* Assumptions */}
      {proposedPlan.assumptions && proposedPlan.assumptions.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F7F5EF]/60 dark:bg-[#0A1628]/60 border border-[#E5E1D6] dark:border-[#1E2F47] text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
            Schedule Assumptions
          </strong>
          <ul className="list-disc pl-4 space-y-0.5">
            {proposedPlan.assumptions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            Scheduled Sessions ({tasks.length} tasks &middot; {totalStudyHours}h total)
          </h3>
          <button
            type="button"
            onClick={handleAddCustomTask}
            className="px-3 py-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {tasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            return (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D]/60 space-y-3"
              >
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Topic
                      </label>
                      <input
                        type="text"
                        value={task.topic}
                        onChange={(e) => handleTaskFieldChange(task.id, 'topic', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Subtopic
                      </label>
                      <input
                        type="text"
                        value={task.subtopic}
                        onChange={(e) => handleTaskFieldChange(task.id, 'subtopic', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Date
                      </label>
                      <input
                        type="date"
                        value={task.date}
                        onChange={(e) => handleTaskFieldChange(task.id, 'date', e.target.value)}
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Minutes
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={360}
                        step={5}
                        value={task.durationMinutes}
                        onChange={(e) =>
                          handleTaskFieldChange(task.id, 'durationMinutes', Number(e.target.value) || 30)
                        }
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="px-2.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Priority
                      </label>
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          handleTaskFieldChange(task.id, 'priority', e.target.value as TaskPriority)
                        }
                        className={inputClass}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Learning Objective
                      </label>
                      <input
                        type="text"
                        value={task.learningObjective}
                        onChange={(e) =>
                          handleTaskFieldChange(task.id, 'learningObjective', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {task.date}
                        </span>
                        <span>&middot;</span>
                        <span>{task.day}</span>
                        <span>&middot;</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {task.durationMinutes} min
                        </span>
                        <span>&middot;</span>
                        <StatusIndicator
                          label={task.priority}
                          tone={
                            task.priority === 'High'
                              ? 'amber'
                              : task.priority === 'Medium'
                              ? 'teal'
                              : 'neutral'
                          }
                        />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {task.topic}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {task.subtopic} — {task.learningObjective}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(task.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        aria-label={`Remove ${task.topic}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Save Bar */}
      <div className="pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          You can adjust tasks, durations, or subjects anytime in the Study Planner.
        </span>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] cursor-pointer"
          >
            Discard Draft
          </button>
          <button
            type="button"
            onClick={handleConfirmAccept}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept &amp; Save Plan</span>
          </button>
        </div>
      </div>
    </StudioPanel>
  );
};
