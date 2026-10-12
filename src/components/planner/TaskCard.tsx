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
  Sparkles,
} from 'lucide-react';
import { StudyTask } from '../../types';
import { Badge } from '../ui/Common';

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

  const priorityVariants = {
    High: 'danger',
    Medium: 'warning',
    Low: 'default',
  } as const;

  const handleSaveNotes = () => {
    onSaveNotes(task.id, noteText);
    setEditingNotes(false);
  };

  return (
    <article
      className={`rounded-3xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-slate-50/80 border-purple-100/60 opacity-90'
          : isMissed
          ? 'bg-rose-50/30 border-rose-200'
          : 'bg-white border-purple-100/80 hover:border-purple-300 shadow-xs hover:shadow-md'
      }`}
      aria-labelledby={`task-title-${task.id}`}
    >
      <div className="p-5 sm:p-6">
        {/* Header meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{task.day}</span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-mono">{task.date}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={priorityVariants[task.priority]} size="sm">
              {task.priority} Priority
            </Badge>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Clock className="w-3 h-3 inline mr-1" />
              {task.durationMinutes} min
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
              {task.difficulty}
            </span>
          </div>
        </div>

        {/* Task Title & Subtopic */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <h3
              id={`task-title-${task.id}`}
              className={`text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug ${
                isCompleted ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.topic}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-purple-700">{task.subtopic}</p>
          </div>

          {/* Quick Check Action */}
          <button
            type="button"
            onClick={() => onStatusChange(task.id, isCompleted ? 'pending' : 'completed')}
            className={`shrink-0 p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                : 'bg-white text-slate-300 border-slate-300 hover:border-purple-600 hover:text-purple-600'
            }`}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            aria-label={isCompleted ? `Mark ${task.topic} as pending` : `Mark ${task.topic} as completed`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Learning Objective */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#F8F7FC] border border-purple-100 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
          <Target className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-900">Objective: </span>
            {task.learningObjective}
          </div>
        </div>

        {/* Missed session banner if marked */}
        {isMissed && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-rose-100/70 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Session missed</strong>: {task.missedReason || 'Schedule conflict'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMissedClick(task)}
              className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer"
            >
              Re-adjust Plan
            </button>
          </div>
        )}

        {/* Collapsible Details: Revision & Practice Recommendation */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-purple-100 space-y-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Spaced Revision Task:
              </span>
              <p className="text-slate-600 pl-5">{task.revisionTask}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                Practice Recommendation:
              </span>
              <p className="text-slate-600 pl-5">{task.practiceRecommendation}</p>
            </div>

            {/* Student Study Notes */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Your Study Notes:
                </span>
                {!editingNotes && (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 cursor-pointer shadow-xs"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : task.notes ? (
                <p className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 italic">
                  &quot;{task.notes}&quot;
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-3.5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-purple-700 font-medium flex items-center gap-1 rounded px-1 cursor-pointer"
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
              className="text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 rounded px-1 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Missed session?
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
