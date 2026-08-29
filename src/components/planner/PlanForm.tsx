import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, BookOpen, AlertCircle, Plus, X, Layers } from 'lucide-react';
import { StudyPlanRequest, StudyLevel } from '../../types';

interface PlanFormProps {
  onSubmit: (request: StudyPlanRequest) => Promise<void>;
  isLoading: boolean;
}

export const PlanForm: React.FC<PlanFormProps> = ({ onSubmit, isLoading }) => {
  const defaultExamDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [subject, setSubject] = useState('Operating Systems & Computer Architecture');
  const [topicsInput, setTopicsInput] = useState('Process Synchronization, Virtual Memory, CPU Scheduling, File Systems, Deadlocks, Cache Coherence');
  const [examDate, setExamDate] = useState(defaultExamDate);
  const [dailyHours, setDailyHours] = useState<number>(2.5);
  const [level, setLevel] = useState<StudyLevel>('Intermediate');
  const [weakTopicsInput, setWeakTopicsInput] = useState('Virtual Memory, Deadlocks');
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subject.trim()) {
      setFormError('Please enter a subject name.');
      return;
    }

    const parsedTopics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (parsedTopics.length === 0) {
      setFormError('Please enter at least one topic to study.');
      return;
    }

    const parsedWeakTopics = weakTopicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (dailyHours <= 0 || dailyHours > 16) {
      setFormError('Please enter realistic daily study hours (0.5 to 14 hours).');
      return;
    }

    try {
      await onSubmit({
        subject: subject.trim(),
        topics: parsedTopics,
        examDate,
        dailyHours,
        level,
        weakTopics: parsedWeakTopics,
        preferredDays: selectedDays,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate study plan.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Create New AI Study Schedule
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Claude will analyze your syllabus, balance spaced repetition, and allocate time based strictly on your available capacity.
        </p>
      </div>

      {formError && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Subject */}
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-subject" className="block text-xs font-semibold text-slate-900">
            Subject or Course Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="planner-subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms, Organic Chemistry, Microeconomics"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* Topics */}
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-topics" className="block text-xs font-semibold text-slate-900">
            Syllabus Topics (comma-separated) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="planner-topics"
            required
            rows={2}
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
            placeholder="e.g. Sorting, Binary Search Trees, Graphs, Dynamic Programming"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
          />
          <span className="text-[11px] text-slate-500 block">
            List individual modules or chapter titles. Claude breaks each into actionable subtopics.
          </span>
        </div>

        {/* Exam Date */}
        <div className="space-y-1.5">
          <label htmlFor="planner-exam-date" className="block text-xs font-semibold text-slate-900">
            Target Exam Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="planner-exam-date"
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Daily Available Hours */}
        <div className="space-y-1.5">
          <label htmlFor="planner-daily-hours" className="block text-xs font-semibold text-slate-900">
            Daily Available Study Hours <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="planner-daily-hours"
              type="number"
              min={0.5}
              max={14}
              step={0.5}
              required
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 1)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
            />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">hours / day</span>
          </div>
        </div>

        {/* Level */}
        <div className="space-y-1.5">
          <label htmlFor="planner-level" className="block text-xs font-semibold text-slate-900">
            Current Knowledge Level
          </label>
          <select
            id="planner-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as StudyLevel)}
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
          >
            <option value="Beginner">Beginner (Starting from scratch / fundamentals)</option>
            <option value="Intermediate">Intermediate (Familiar with core concepts)</option>
            <option value="Advanced">Advanced (Revision & exam-level problem solving)</option>
          </select>
        </div>

        {/* Weak Topics */}
        <div className="space-y-1.5">
          <label htmlFor="planner-weak-topics" className="block text-xs font-semibold text-slate-900">
            Weak Topics (prioritized for extra revision)
          </label>
          <input
            id="planner-weak-topics"
            type="text"
            value={weakTopicsInput}
            onChange={(e) => setWeakTopicsInput(e.target.value)}
            placeholder="e.g. Dynamic Programming, Red-Black Trees"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* Preferred Study Days */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-900">
            Preferred Study Days
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 hidden sm:block">
          Evidence-informed schedule with spaced repetition built-in
        </span>
        <button
          id="generate-plan-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Schedule...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Study Plan
            </>
          )}
        </button>
      </div>
    </form>
  );
};
