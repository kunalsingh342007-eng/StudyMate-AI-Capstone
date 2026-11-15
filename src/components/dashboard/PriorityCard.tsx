import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Play,
  Pause,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { StudyTask } from '../../types';
import { StatusIndicator } from '../ui/Common';

interface PriorityCardProps {
  task: StudyTask | null;
  onComplete?: (taskId: string, loggedMinutes?: number) => void;
  examDate?: string;
  totalPendingToday?: number;
  hasAnyTasks?: boolean;
  onCreateTask?: () => void;
}

export const PriorityCard: React.FC<PriorityCardProps> = ({
  task,
  onComplete,
  totalPendingToday,
  hasAnyTasks = false,
  onCreateTask,
}) => {
  const initialSeconds = (task?.durationMinutes || 45) * 60;
  const [sessionState, setSessionState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSessionState('idle');
    setSecondsLeft((task?.durationMinutes || 45) * 60);
  }, [task?.id, task?.durationMinutes]);

  useEffect(() => {
    if (sessionState !== 'active') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setSessionState('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (!task) {
    return (
      <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-7 sm:p-8 text-center space-y-4 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 flex items-center justify-center mx-auto">
          <Target className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {hasAnyTasks ? 'All Scheduled Tasks Completed' : 'No tasks yet'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {hasAnyTasks
              ? 'You finished every pending session in your current schedule. Add another task or create a new study plan when ready.'
              : 'Add your first study task or build a personalized schedule to start tracking focused study sessions.'}
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {onCreateTask ? (
            <button
              type="button"
              onClick={onCreateTask}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          ) : (
            <Link
              to="/planner?action=new-task"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Link>
          )}
          <Link
            to="/planner"
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Build Schedule</span>
          </Link>
          <Link
            to="/explain"
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Explain a Topic</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';
  const elapsedMinutes = Math.max(
    1,
    Math.round((initialSeconds - secondsLeft) / 60) || task.durationMinutes
  );

  const handleFinishSession = () => {
    setSessionState('idle');
    onComplete?.(task.id, sessionState === 'idle' ? task.durationMinutes : elapsedMinutes);
  };

  return (
    <section
      aria-label="Today's Learning Goal"
      className="bg-[#0A1628] dark:bg-[#0F1D32] rounded-2xl p-6 sm:p-8 text-white border border-[#1E2F47] shadow-lg"
    >
      <div className="space-y-5">
        {/* Top Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Today&apos;s Learning Goal
            </span>
            {typeof totalPendingToday === 'number' && totalPendingToday > 0 && (
              <span className="text-xs text-slate-400 tabular-nums">
                · {totalPendingToday} pending task{totalPendingToday === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{task.durationMinutes} min</span>
            </span>
            <StatusIndicator
              label={
                isCompleted
                  ? 'Completed'
                  : sessionState === 'active'
                  ? 'In Focus'
                  : sessionState === 'paused'
                  ? 'Paused'
                  : `${task.priority} Priority`
              }
              tone={
                isCompleted
                  ? 'lime'
                  : sessionState === 'active'
                  ? 'teal'
                  : task.priority === 'High'
                  ? 'amber'
                  : 'neutral'
              }
              className="text-slate-200"
            />
          </div>
        </div>

        {/* Main Objective & Interactive Focus Timer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {task.topic}
            </h2>
            <p className="text-sm sm:text-base font-medium text-teal-200">{task.subtopic}</p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl pt-1">
              <span className="text-slate-400 font-medium">Objective: </span>
              {task.learningObjective}
            </p>
          </div>

          {/* Live Session Timer Panel */}
          <div className="lg:col-span-4 rounded-xl bg-[#07101E] dark:bg-[#0A1628] border border-white/10 p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Focus Timer
              </span>
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() =>
                    setSessionState((s) => (s === 'active' ? 'paused' : 'active'))
                  }
                  className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label={sessionState === 'active' ? 'Pause focus timer' : 'Start focus timer'}
                >
                  {sessionState === 'active' ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{sessionState === 'paused' ? 'Resume' : 'Focus'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2.5">
            {onComplete && (
              <button
                type="button"
                onClick={handleFinishSession}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-lime-500/20 text-lime-200 border border-lime-400/30 hover:bg-lime-500/30'
                    : 'bg-white text-[#0A1628] hover:bg-slate-100'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-lime-400" />
                ) : (
                  <Check className="w-4 h-4 text-teal-700" />
                )}
                <span>{isCompleted ? 'Completed (Reopen)' : 'Continue & Complete'}</span>
              </button>
            )}

            <Link
              to="/planner"
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/8 hover:bg-white/14 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-300" />
              <span>Adjust Today&apos;s Plan</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/explain?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-medium text-teal-200 hover:text-white bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/25 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain Concept</span>
            </Link>

            <Link
              to={`/quiz?topic=${encodeURIComponent(task.topic)}`}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/8 hover:bg-white/14 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-300" />
              <span>Practice Quiz</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
