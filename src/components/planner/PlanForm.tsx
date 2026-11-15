import React, { useState } from 'react';
import { Sparkles, BookOpen, AlertCircle, Wrench } from 'lucide-react';
import { StudyPlanRequest, StudyLevel } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PlanFormProps {
  onSubmit: (request: StudyPlanRequest) => Promise<void>;
  isLoading: boolean;
  onManualMode?: () => void;
}

export const PlanForm: React.FC<PlanFormProps> = ({ onSubmit, isLoading, onManualMode }) => {
  const { preferences, userProfile } = useAuth();

  const defaultHours =
    userProfile.dailyGoalHours && userProfile.dailyGoalHours > 0
      ? userProfile.dailyGoalHours
      : preferences.dailyStudyGoalMinutes
      ? Math.round((preferences.dailyStudyGoalMinutes / 60) * 10) / 10
      : 2;

  const dayCodeToFull: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  const initialDays =
    userProfile.preferredStudyDays && userProfile.preferredStudyDays.length > 0
      ? userProfile.preferredStudyDays
      : preferences.preferredStudyDays
      ? preferences.preferredStudyDays
          .split(',')
          .map((d) => dayCodeToFull[d.trim()] || d.trim())
          .filter(Boolean)
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const [subject, setSubject] = useState(
    userProfile.subjects && userProfile.subjects.length > 0
      ? userProfile.subjects.join(', ')
      : userProfile.targetExam || ''
  );
  const [topicsInput, setTopicsInput] = useState('');
  const [examDate, setExamDate] = useState(
    userProfile.targetExamDate || ''
  );
  const [dailyHours, setDailyHours] = useState<number>(defaultHours);
  const [level, setLevel] = useState<StudyLevel>('Intermediate');
  const [weakTopicsInput, setWeakTopicsInput] = useState(
    (userProfile.weakTopics || []).join(', ')
  );
  const [learningGoal, setLearningGoal] = useState(userProfile.learningGoal || '');
  const [timetable, setTimetable] = useState(userProfile.timetable || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
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
      setFormError('Please enter a subject or skill to study.');
      return;
    }

    const parsedTopics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (parsedTopics.length === 0) {
      setFormError('Please enter at least one topic or module to schedule.');
      return;
    }

    if (!examDate) {
      setFormError('Please choose your target exam date or deadline so sessions fit your timeline.');
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
        learningGoal: learningGoal.trim() || undefined,
        timetable: timetable.trim() || undefined,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate study plan.');
    }
  };

  const inputClass =
    'w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 dark:focus:border-teal-400 transition-colors';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 shadow-2xs space-y-6"
    >
      <div className="border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
            <span>Create Study Schedule</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Generate a personalized study schedule from your own subjects, target deadline, and daily study capacity—and review before saving.
          </p>
        </div>

        {onManualMode && (
          <button
            type="button"
            onClick={onManualMode}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Build Schedule Manually</span>
          </button>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-subject" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Subject or Course Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="planner-subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Organic Chemistry, Linear Algebra, World History, Python"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-topics" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Syllabus Topics or Units (comma-separated) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="planner-topics"
            required
            rows={2}
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
            placeholder="e.g. Chapter 1 Foundations, Thermodynamics, Reaction Kinetics, Spectroscopy"
            className={inputClass}
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            List the chapters, skills, or exam modules you want to cover.
          </span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="planner-exam-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Target Exam or Goal Date <span className="text-rose-500">*</span>
          </label>
          <input
            id="planner-exam-date"
            type="date"
            required
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            Used to pace sessions and spaced revision before your deadline.
          </span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="planner-daily-hours" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
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
              className={`${inputClass} tabular-nums`}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              hours / day
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            Keeps each day realistic so you avoid overload.
          </span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="planner-level" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Current Knowledge Level
          </label>
          <select
            id="planner-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as StudyLevel)}
            className={inputClass}
          >
            <option value="Beginner">Beginner (Starting from scratch / fundamentals)</option>
            <option value="Intermediate">Intermediate (Familiar with core concepts)</option>
            <option value="Advanced">Advanced (Revision &amp; exam-level problem solving)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="planner-weak-topics" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Weak Topics (optional, prioritized for extra revision)
          </label>
          <input
            id="planner-weak-topics"
            type="text"
            value={weakTopicsInput}
            onChange={(e) => setWeakTopicsInput(e.target.value)}
            placeholder="e.g. Stereochemistry, Hypothesis Testing"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-learning-goal" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Learning Goal (optional)
          </label>
          <input
            id="planner-learning-goal"
            type="text"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            placeholder="e.g. Score 85%+ on midterms or finish fundamentals in 4 weeks"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="planner-timetable" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Existing College / Work Timetable (optional)
          </label>
          <textarea
            id="planner-timetable"
            rows={2}
            value={timetable}
            onChange={(e) => setTimetable(e.target.value)}
            placeholder="e.g. Classes Mon-Fri 9am-3pm; free evenings after 6pm and Saturday mornings"
            className={inputClass}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Preferred Study Days
          </span>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600 dark:border-teal-600'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-600 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/50'
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

      <div className="pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          You will review and edit the generated schedule before anything is saved.
        </span>
        <button
          id="generate-plan-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Draft...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Draft Schedule</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

