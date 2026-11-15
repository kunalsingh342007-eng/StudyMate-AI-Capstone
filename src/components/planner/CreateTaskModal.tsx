import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { TaskPriority } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  defaultSubject?: string;
  onClose: () => void;
  onCreateTask: (task: {
    topic: string;
    subtopic?: string;
    date?: string;
    durationMinutes?: number;
    priority?: TaskPriority;
    learningObjective?: string;
    subjectName?: string;
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  defaultSubject = '',
  onClose,
  onCreateTask,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [subjectName, setSubjectName] = useState(defaultSubject);
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [date, setDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [learningObjective, setLearningObjective] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError('Please enter a topic or task name.');
      return;
    }

    onCreateTask({
      subjectName: subjectName.trim() || undefined,
      topic: topic.trim(),
      subtopic: subtopic.trim() || undefined,
      date: date || todayStr,
      durationMinutes: Number(durationMinutes) || 45,
      priority,
      learningObjective: learningObjective.trim() || undefined,
    });

    setTopic('');
    setSubtopic('');
    setLearningObjective('');
    onClose();
  };

  const inputClass =
    'w-full text-sm px-3.5 py-2 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3.5">
          <h2 id="create-task-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Create Study Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create task dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="task-modal-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject (optional)
            </label>
            <input
              id="task-modal-subject"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Calculus II, Biology, Spanish"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="task-modal-topic" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Task or Topic Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-modal-topic"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Integration by Parts, Chapter 4 Review"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="task-modal-subtopic" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Specific Focus (optional)
            </label>
            <input
              id="task-modal-subtopic"
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g. Complete 10 practice problems"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="task-modal-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                id="task-modal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-modal-duration" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Minutes
              </label>
              <input
                id="task-modal-duration"
                type="number"
                min={10}
                max={360}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-modal-priority" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                id="task-modal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClass}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-modal-objective" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Goal for this session (optional)
            </label>
            <input
              id="task-modal-objective"
              type="text"
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              placeholder="e.g. Summarize definitions and solve 3 past questions"
              className={inputClass}
            />
          </div>

          <div className="pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
