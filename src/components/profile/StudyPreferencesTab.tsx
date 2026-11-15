import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Edit2,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { UpcomingExamItem, UserProfile } from '../../types';
import { StudioPanel } from '../ui/Common';

interface StudyPreferencesTabProps {
  profile: UserProfile;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const STUDY_TIME_WINDOWS = [
  'Early Morning (5am–8am)',
  'Morning (8am–12pm)',
  'Afternoon (12pm–5pm)',
  'Evening (5pm–9pm)',
  'Late Night (9pm–1am)',
  'Flexible',
];

const inputClass =
  'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

export const StudyPreferencesTab: React.FC<StudyPreferencesTabProps> = ({
  profile,
  onSaveProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [subjectsInput, setSubjectsInput] = useState((profile.subjects || []).join(', '));
  const [weakTopicsInput, setWeakTopicsInput] = useState((profile.weakTopics || []).join(', '));
  const [dailyGoalHours, setDailyGoalHours] = useState(
    profile.dailyGoalHours && profile.dailyGoalHours > 0 ? profile.dailyGoalHours : 2
  );
  const [preferredStudyDays, setPreferredStudyDays] = useState<string[]>(
    profile.preferredStudyDays && profile.preferredStudyDays.length > 0
      ? profile.preferredStudyDays
      : []
  );
  const [preferredStudyTime, setPreferredStudyTime] = useState(profile.preferredStudyTime || '');
  const [targetExam, setTargetExam] = useState(profile.targetExam || '');
  const [targetExamDate, setTargetExamDate] = useState(profile.targetExamDate || '');
  const [learningGoal, setLearningGoal] = useState(profile.learningGoal || '');
  const [careerInterest, setCareerInterest] = useState(profile.careerInterest || '');
  const [timetable, setTimetable] = useState(profile.timetable || '');
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExamItem[]>(
    profile.upcomingExams || []
  );

  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamSubject, setNewExamSubject] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setSubjectsInput((profile.subjects || []).join(', '));
      setWeakTopicsInput((profile.weakTopics || []).join(', '));
      setDailyGoalHours(
        profile.dailyGoalHours && profile.dailyGoalHours > 0 ? profile.dailyGoalHours : 2
      );
      setPreferredStudyDays(profile.preferredStudyDays || []);
      setPreferredStudyTime(profile.preferredStudyTime || '');
      setTargetExam(profile.targetExam || '');
      setTargetExamDate(profile.targetExamDate || '');
      setLearningGoal(profile.learningGoal || '');
      setCareerInterest(profile.careerInterest || '');
      setTimetable(profile.timetable || '');
      setUpcomingExams(profile.upcomingExams || []);
      setError(null);
    }
  }, [profile, isEditing]);

  const toggleDay = (day: string) => {
    setPreferredStudyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddUpcomingExam = () => {
    if (!newExamName.trim() || !newExamDate) {
      setError('Enter both an exam name and date before adding.');
      return;
    }
    setError(null);
    setUpcomingExams((prev) => [
      ...prev,
      {
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: newExamName.trim(),
        date: newExamDate,
        ...(newExamSubject.trim() ? { subject: newExamSubject.trim() } : {}),
      },
    ]);
    setNewExamName('');
    setNewExamDate('');
    setNewExamSubject('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = Number(dailyGoalHours);
    if (!Number.isFinite(hoursNum) || hoursNum < 0.5 || hoursNum > 16) {
      setError('Daily study availability must be between 0.5 and 16 hours.');
      return;
    }

    const parsedSubjects = subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedWeakTopics = weakTopicsInput
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    setError(null);
    setSaving(true);
    try {
      await onSaveProfile({
        subjects: parsedSubjects,
        weakTopics: parsedWeakTopics,
        dailyGoalHours: hoursNum,
        preferredStudyDays,
        preferredStudyTime: preferredStudyTime.trim(),
        targetExam: targetExam.trim(),
        targetExamDate,
        learningGoal: learningGoal.trim(),
        careerInterest: careerInterest.trim(),
        timetable: timetable.trim(),
        upcomingExams,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save study preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <StudioPanel className="p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6" noValidate>
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Study Preferences &amp; Exam Targets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synced directly with your Study Planner, Dashboard, and onboarding profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pref-subjects" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Subjects &amp; Topics (comma-separated)
              </label>
              <input
                id="pref-subjects"
                type="text"
                value={subjectsInput}
                onChange={(e) => setSubjectsInput(e.target.value)}
                placeholder="e.g. Data Structures, Linear Algebra, Macroeconomics"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="pref-weak-topics" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Weak Topics &amp; Revision Priorities (comma-separated)
              </label>
              <input
                id="pref-weak-topics"
                type="text"
                value={weakTopicsInput}
                onChange={(e) => setWeakTopicsInput(e.target.value)}
                placeholder="e.g. Dynamic Programming, Eigenvalues"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pref-daily-hours" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Daily Availability (Hours)
              </label>
              <input
                id="pref-daily-hours"
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div>
              <label htmlFor="pref-study-time" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Preferred Time of Day
              </label>
              <select
                id="pref-study-time"
                value={preferredStudyTime}
                onChange={(e) => setPreferredStudyTime(e.target.value)}
                className={inputClass}
              >
                <option value="">Select preferred window</option>
                {STUDY_TIME_WINDOWS.map((win) => (
                  <option key={win} value={win}>
                    {win}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pref-career-interest" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Career Target
              </label>
              <input
                id="pref-career-interest"
                type="text"
                value={careerInterest}
                onChange={(e) => setCareerInterest(e.target.value)}
                placeholder="e.g. Research Scientist, Full-Stack Engineer"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Preferred Study Days
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const selected = preferredStudyDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600 dark:border-teal-600'
                        : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pref-target-exam" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Primary Exam / Target Name
              </label>
              <input
                id="pref-target-exam"
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                placeholder="e.g. Semester 6 Finals, GATE"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="pref-target-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Primary Exam Target Date
              </label>
              <input
                id="pref-target-date"
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div>
              <label htmlFor="pref-learning-goal" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Learning Goal
              </label>
              <input
                id="pref-learning-goal"
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="e.g. Score 90%+ in core subjects"
                className={inputClass}
              />
            </div>
          </div>

          {/* Additional Upcoming Exams */}
          <div className="border-t border-[#E5E1D6] dark:border-[#1E2F47] pt-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Additional Upcoming Exams (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-4">
                <label htmlFor="new-exam-name" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Name
                </label>
                <input
                  id="new-exam-name"
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="e.g. Midterm II"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new-exam-subject" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject (optional)
                </label>
                <input
                  id="new-exam-subject"
                  type="text"
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new-exam-date" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  id="new-exam-date"
                  type="date"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddUpcomingExam}
                  className="w-full px-3 py-2 rounded-xl bg-[#EFECE3] dark:bg-[#16263D] hover:bg-[#E5E1D6] dark:hover:bg-[#1E2F47] text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {upcomingExams.length > 0 && (
              <ul className="divide-y divide-[#E5E1D6] dark:divide-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl">
                {upcomingExams.map((ex) => (
                  <li
                    key={ex.id}
                    className="px-3.5 py-2 flex items-center justify-between gap-2 text-xs tabular-nums"
                  >
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">{ex.name}</strong>
                      {ex.subject ? ` · ${ex.subject}` : ''} &middot; {ex.date}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove exam ${ex.name}`}
                      onClick={() =>
                        setUpcomingExams((prev) => prev.filter((item) => item.id !== ex.id))
                      }
                      className="text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="pref-timetable" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              College / Work Timetable Constraints (optional)
            </label>
            <textarea
              id="pref-timetable"
              rows={2}
              value={timetable}
              onChange={(e) => setTimetable(e.target.value)}
              placeholder="e.g. Classes Mon–Fri 9am–3pm; lab on Wednesday afternoons"
              className={`${inputClass} leading-relaxed`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Study Preferences'}</span>
            </button>
          </div>
        </form>
      </StudioPanel>
    );
  }

  return (
    <StudioPanel className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Study Preferences &amp; Exam Targets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shared with your Study Planner and Dashboard — updating here does not reset your plans
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          <span>Edit Study Preferences</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="space-y-3">
          <div>
            <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Subjects &amp; Topics
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {profile.subjects && profile.subjects.length > 0
                ? profile.subjects.join(' · ')
                : 'No subjects configured yet'}
            </p>
          </div>

          <div>
            <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Weak Topics &amp; Revision Priorities
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {profile.weakTopics && profile.weakTopics.length > 0
                ? profile.weakTopics.join(' · ')
                : 'None listed yet'}
            </p>
          </div>

          <div>
            <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Career Target &amp; Learning Goal
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {[profile.careerInterest, profile.learningGoal].filter(Boolean).join(' · ') ||
                'Not set'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Study Availability &amp; Schedule
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium tabular-nums">
              {profile.dailyGoalHours > 0 ? `${profile.dailyGoalHours} hrs/day` : 'Daily hours unset'}
              {profile.preferredStudyTime ? ` · ${profile.preferredStudyTime}` : ''}
            </p>
            {profile.preferredStudyDays && profile.preferredStudyDays.length > 0 && (
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Days: {profile.preferredStudyDays.join(', ')}
              </p>
            )}
          </div>

          <div>
            <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Primary Target Exam
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium tabular-nums">
              {profile.targetExam || 'Not set'}
              {profile.targetExamDate ? ` · ${profile.targetExamDate}` : ''}
            </p>
          </div>

          {profile.timetable && (
            <div>
              <span className="block font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Timetable Constraints
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {profile.timetable}
              </p>
            </div>
          )}
        </div>
      </div>

      {profile.upcomingExams && profile.upcomingExams.length > 0 && (
        <div className="pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Additional Upcoming Exams</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.upcomingExams.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 text-xs tabular-nums"
              >
                <p className="font-bold text-slate-900 dark:text-slate-100">{ex.name}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {ex.subject ? `${ex.subject} · ` : ''}
                  {ex.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </StudioPanel>
  );
};
