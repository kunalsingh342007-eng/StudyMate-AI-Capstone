import React, { useState } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { StudyLevel, StudyPlan, StudyTask, TaskPriority } from '../../types';
import { StudioPanel } from '../ui/Common';

interface ManualScheduleBuilderProps {
  initialSubject?: string;
  initialTopics?: string[];
  initialExamDate?: string;
  initialDailyHours?: number;
  initialWeakTopics?: string[];
  initialPreferredDays?: string[];
  initialLevel?: StudyLevel;
  initialLearningGoal?: string;
  initialTimetable?: string;
  onSavePlan: (plan: StudyPlan) => void;
  onCancel: () => void;
}

interface DraftTaskRow {
  id: string;
  topic: string;
  subtopic: string;
  date: string;
  durationMinutes: number;
  priority: TaskPriority;
}

export const ManualScheduleBuilder: React.FC<ManualScheduleBuilderProps> = ({
  initialSubject = '',
  initialTopics = [],
  initialExamDate = '',
  initialDailyHours = 2,
  initialWeakTopics = [],
  initialPreferredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  initialLevel = 'Intermediate',
  initialLearningGoal = '',
  initialTimetable = '',
  onSavePlan,
  onCancel,
}) => {
  const defaultDate =
    initialExamDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [subject, setSubject] = useState(initialSubject);
  const [examDate, setExamDate] = useState(defaultDate);
  const [dailyHours, setDailyHours] = useState(initialDailyHours || 2);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<DraftTaskRow[]>(() => {
    if (initialTopics.length > 0) {
      return initialTopics.map((topic, idx) => {
        const d = new Date(Date.now() + idx * 86400000).toISOString().split('T')[0];
        const isWeak = initialWeakTopics.some(
          (w) => w.toLowerCase() === topic.toLowerCase()
        );
        return {
          id: `manual-task-${idx + 1}-${Date.now()}`,
          topic,
          subtopic: isWeak ? 'Priority revision & practice' : 'Core concepts & review',
          date: d,
          durationMinutes: Math.max(30, Math.min(120, Math.round((initialDailyHours || 1) * 60))),
          priority: isWeak ? 'High' : 'Medium',
        };
      });
    }
    return [
      {
        id: `manual-task-1-${Date.now()}`,
        topic: '',
        subtopic: '',
        date: todayStr,
        durationMinutes: 45,
        priority: 'Medium',
      },
    ];
  });

  const handleAddRow = () => {
    const nextDate = new Date(Date.now() + rows.length * 86400000).toISOString().split('T')[0];
    setRows((prev) => [
      ...prev,
      {
        id: `manual-task-${Date.now()}-${prev.length}`,
        topic: '',
        subtopic: '',
        date: nextDate,
        durationMinutes: 45,
        priority: 'Medium',
      },
    ]);
  };

  const handleUpdateRow = <K extends keyof DraftTaskRow>(
    id: string,
    field: K,
    value: DraftTaskRow[K]
  ) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Please enter a subject or study goal title.');
      return;
    }

    const validRows = rows.filter((r) => r.topic.trim().length > 0);
    if (validRows.length === 0) {
      setError('Please enter at least one study topic/session.');
      return;
    }

    const tasks: StudyTask[] = validRows.map((row) => {
      const parsed = new Date(`${row.date}T12:00:00`);
      const dayLabel = Number.isNaN(parsed.getTime())
        ? row.date
        : parsed.toLocaleDateString(undefined, { weekday: 'long' });

      return {
        id: row.id,
        date: row.date,
        day: dayLabel,
        topic: row.topic.trim(),
        subtopic: row.subtopic.trim() || 'Focused study session',
        durationMinutes: Math.max(10, Math.min(360, Number(row.durationMinutes) || 45)),
        priority: row.priority,
        difficulty: initialLevel,
        learningObjective: `Complete planned study session on ${row.topic.trim()}`,
        revisionTask: 'Summarize key concepts in your own words.',
        practiceRecommendation: 'Test yourself with a short practice quiz after reviewing.',
        status: 'pending',
      };
    });

    const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
    const uniqueTopics = Array.from(new Set(tasks.map((t) => t.topic)));
    const uniqueDays = new Set(tasks.map((t) => t.date)).size;

    const normalizedLevel: StudyLevel =
      initialLevel === 'Beginner' || initialLevel === 'Intermediate' || initialLevel === 'Advanced'
        ? initialLevel
        : 'Intermediate';

    const plan: StudyPlan = {
      id: `plan-manual-${Date.now()}`,
      createdAt: new Date().toISOString(),
      subject: subject.trim(),
      examDate: examDate || defaultDate,
      dailyHours: Math.max(0.5, Number(dailyHours) || 1),
      level: normalizedLevel,
      topics: uniqueTopics,
      weakTopics: initialWeakTopics,
      preferredDays: initialPreferredDays,
      tasks,
      totalDays: Math.max(1, uniqueDays),
      totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
      assumptions: [
        'Created manually by the student.',
        ...(initialTimetable ? [`Timetable note: ${initialTimetable}`] : []),
      ],
      ...(initialLearningGoal ? { learningGoal: initialLearningGoal } : {}),
      ...(initialTimetable ? { timetable: initialTimetable } : {}),
      isManual: true,
      isDemoFallback: false,
    };

    onSavePlan(plan);
  };

  const inputClass =
    'w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

  return (
    <StudioPanel className="p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400 block">
            Manual Schedule Builder
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Build Your Schedule Directly</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Configure your own topics, dates, and study durations without waiting on AI generation.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close manual builder"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="manual-subject" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Subject or Plan Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="manual-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Organic Chemistry Midterm, Calculus II"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-exam-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Target Date
            </label>
            <input
              id="manual-exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="manual-daily-hours" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Daily Target Hours
            </label>
            <input
              id="manual-daily-hours"
              type="number"
              min={0.5}
              max={14}
              step={0.5}
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 1)}
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study Sessions ({rows.length})
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="p-3.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#0A1628]/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Topic #{idx + 1} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={row.topic}
                    onChange={(e) => handleUpdateRow(row.id, 'topic', e.target.value)}
                    placeholder="e.g. Chapter 3: Derivatives"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Focus / Subtopic
                  </label>
                  <input
                    type="text"
                    value={row.subtopic}
                    onChange={(e) => handleUpdateRow(row.id, 'subtopic', e.target.value)}
                    placeholder="e.g. Chain rule practice"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
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
                    value={row.durationMinutes}
                    onChange={(e) =>
                      handleUpdateRow(row.id, 'durationMinutes', Number(e.target.value) || 30)
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="sm:col-span-1 flex items-center justify-end gap-1">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      aria-label={`Remove session ${idx + 1}`}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Manual Schedule</span>
          </button>
        </div>
      </form>
    </StudioPanel>
  );
};
