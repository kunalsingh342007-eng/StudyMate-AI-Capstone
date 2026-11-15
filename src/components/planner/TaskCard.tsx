import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { StudyTask } from '../../types';
import { StatusIndicator } from '../ui/Common';

interface TaskCardProps {
  task: StudyTask;
  onStatusChange: (taskId: string, status: 'pending' | 'completed' | 'missed') => void;
  onMissedClick: (task: StudyTask) => void;
  onSaveNotes: (taskId: string, notes: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onMissedClick,
  onSaveNotes,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(task.notes || '');

  const isCompleted = task.status === 'completed';
  const isMissed = task.status === 'missed';

  const priorityTone =
    task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'neutral';

  const handleSaveNotes = () => {
    onSaveNotes(task.id, noteText);
    setEditingNotes(false);
  };

  return (
    <article
      className={`rounded-2xl border transition-colors ${
        isCompleted
          ? 'bg-[#F7F5EF] dark:bg-[#0B1626] border-[#E5E1D6] dark:border-[#1E2F47] opacity-85'
          : isMissed
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
          : 'bg-white dark:bg-[#0F1D32] border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/40 dark:hover:border-teal-500/40'
      }`}
      aria-labelledby={`task-title-${task.id}`}
    >
      <div className="p-5 sm:p-6">
        {/* Metadata row (unboxed typographic separators) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{task.day}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="font-mono tabular-nums">{task.date}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {task.durationMinutes} min
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <StatusIndicator label={`${task.priority} priority`} tone={priorityTone} />
            <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">&middot;</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{task.difficulty}</span>
          </div>
        </div>

        {/* Title & Completion toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <h3
              id={`task-title-${task.id}`}
              className={`text-base sm:text-lg font-bold leading-snug ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.topic}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-400">
              {task.subtopic}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStatusChange(task.id, isCompleted ? 'pending' : 'completed')}
            className={`shrink-0 p-2 rounded-xl border transition-colors cursor-pointer ${
              isCompleted
                ? 'bg-lime-600 text-white border-lime-600 hover:bg-lime-700'
                : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-400 dark:text-slate-500 border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400'
            }`}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            aria-label={isCompleted ? `Mark ${task.topic} as pending` : `Mark ${task.topic} as completed`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Learning Objective */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <Target className="w-4 h-4 text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Objective: </span>
            {task.learningObjective}
          </div>
        </div>

        {isMissed && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Session missed</strong>: {task.missedReason || 'Schedule conflict'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMissedClick(task)}
              className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:opacity-80 cursor-pointer whitespace-nowrap"
            >
              Re-adjust Plan
            </button>
          </div>
        )}

        {/* Collapsible Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] space-y-3.5 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Spaced Revision Task
              </span>
              <p className="text-slate-600 dark:text-slate-300 pl-5 leading-relaxed">{task.revisionTask}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                Practice Recommendation
              </span>
              <p className="text-slate-600 dark:text-slate-300 pl-5 leading-relaxed">
                {task.practiceRecommendation}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Study Notes
                </span>
                {!editingNotes && (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    className="text-xs text-teal-700 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                  >
                    {task.notes ? 'Edit notes' : '+ Add notes'}
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write quick formulas, key questions, or reminders..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-3 py-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : task.notes ? (
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 italic">
                  &ldquo;{task.notes}&rdquo;
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 font-medium flex items-center gap-1 rounded px-1 cursor-pointer"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Hide revision & practice details
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> View revision & practice recommendations
              </>
            )}
          </button>

          {!isCompleted && !isMissed && (
            <button
              type="button"
              onClick={() => onMissedClick(task)}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium flex items-center gap-1 rounded px-1 cursor-pointer whitespace-nowrap"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Missed session?
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
