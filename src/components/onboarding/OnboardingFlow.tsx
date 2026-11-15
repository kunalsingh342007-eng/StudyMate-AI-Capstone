import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  SkipForward,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import { StudyLevel, StudyPlan, StudyPlanRequest, UserProfile } from '../../types';
import { ApiClient } from '../../services/api/apiClient';
import { PlanReviewPanel } from '../planner/PlanReviewPanel';
import { ManualScheduleBuilder } from '../planner/ManualScheduleBuilder';
import { StudioPanel } from '../ui/Common';

interface OnboardingFlowProps {
  firstName: string;
  userProfile: UserProfile;
  onSaveProfileProgress: (partial: Partial<UserProfile>) => void;
  onCompletePlan: (plan: StudyPlan, profileUpdates: Partial<UserProfile>) => void;
  onSkipToWorkspace: () => void;
}

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  firstName,
  userProfile,
  onSaveProfileProgress,
  onCompletePlan,
  onSkipToWorkspace,
}) => {
  const initialStep =
    typeof userProfile.onboardingStep === 'number' &&
    userProfile.onboardingStep >= 0 &&
    userProfile.onboardingStep <= 5
      ? userProfile.onboardingStep
      : 0;

  const [step, setStep] = useState<number>(initialStep);

  // Step 1: Subjects or skills (Required)
  const [subjectsInput, setSubjectsInput] = useState<string>(
    (userProfile.subjects || []).join(', ')
  );

  // Step 2: Target exam date or learning goal (Required)
  const [targetExam, setTargetExam] = useState<string>(userProfile.targetExam || '');
  const [learningGoal, setLearningGoal] = useState<string>(userProfile.learningGoal || '');
  const [targetExamDate, setTargetExamDate] = useState<string>(
    userProfile.targetExamDate || ''
  );

  // Step 3: Available study time (Required)
  const [dailyHours, setDailyHours] = useState<number>(
    userProfile.dailyGoalHours && userProfile.dailyGoalHours > 0
      ? userProfile.dailyGoalHours
      : 2
  );
  const [preferredDays, setPreferredDays] = useState<string[]>(
    userProfile.preferredStudyDays && userProfile.preferredStudyDays.length > 0
      ? userProfile.preferredStudyDays
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );
  const [level, setLevel] = useState<StudyLevel>('Intermediate');

  // Step 4: Weak topics (Optional)
  const [weakTopicsInput, setWeakTopicsInput] = useState<string>(
    (userProfile.weakTopics || []).join(', ')
  );

  // Step 5: Existing college / work timetable (Optional)
  const [timetable, setTimetable] = useState<string>(userProfile.timetable || '');

  // Generation / Review / Fallback state
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [proposedPlan, setProposedPlan] = useState<StudyPlan | null>(null);
  const [showManualBuilder, setShowManualBuilder] = useState(false);

  const parsedSubjects = subjectsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedWeakTopics = weakTopicsInput
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  const persistPartial = (nextStep: number, extra: Partial<UserProfile> = {}) => {
    onSaveProfileProgress({
      subjects: parsedSubjects,
      targetExam: targetExam.trim(),
      learningGoal: learningGoal.trim(),
      targetExamDate: targetExamDate.trim(),
      dailyGoalHours: Number(dailyHours) || 2,
      preferredStudyDays: preferredDays,
      weakTopics: parsedWeakTopics,
      timetable: timetable.trim(),
      onboardingStep: nextStep,
      ...extra,
    });
  };

  const goToStep = (nextStep: number, extra: Partial<UserProfile> = {}) => {
    setStepError(null);
    persistPartial(nextStep, extra);
    setStep(nextStep);
  };

  const toggleDay = (day: string) => {
    if (preferredDays.includes(day)) {
      if (preferredDays.length <= 1) return;
      setPreferredDays(preferredDays.filter((d) => d !== day));
    } else {
      setPreferredDays([...preferredDays, day]);
    }
  };

  const handleNextFromStep1 = () => {
    if (parsedSubjects.length === 0) {
      setStepError('Please enter at least one subject or skill you want to study.');
      return;
    }
    goToStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!targetExamDate.trim() && !learningGoal.trim() && !targetExam.trim()) {
      setStepError(
        'Please enter either a target exam/milestone date or describe your learning goal.'
      );
      return;
    }
    goToStep(3);
  };

  const handleNextFromStep3 = () => {
    if (!dailyHours || dailyHours < 0.5 || dailyHours > 14) {
      setStepError('Please enter realistic daily study hours between 0.5 and 14.');
      return;
    }
    if (preferredDays.length === 0) {
      setStepError('Please select at least one study day per week.');
      return;
    }
    goToStep(4);
  };

  const buildEffectivePlanRequest = (overrideTimetable?: string): StudyPlanRequest => {
    const effectiveSubject =
      targetExam.trim() ||
      (parsedSubjects.length === 1
        ? parsedSubjects[0]
        : `${parsedSubjects[0]} & ${parsedSubjects.length - 1} more`);

    const fallbackTargetDate =
      targetExamDate.trim() ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    return {
      subject: effectiveSubject,
      topics: parsedSubjects,
      examDate: fallbackTargetDate,
      dailyHours: Number(dailyHours) || 2,
      level,
      weakTopics: parsedWeakTopics,
      preferredDays,
      ...(learningGoal.trim() ? { learningGoal: learningGoal.trim() } : {}),
      ...(overrideTimetable !== undefined
        ? overrideTimetable.trim()
          ? { timetable: overrideTimetable.trim() }
          : {}
        : timetable.trim()
        ? { timetable: timetable.trim() }
        : {}),
    };
  };

  const triggerPlanGeneration = async (overrideTimetable?: string) => {
    setStepError(null);
    setAiError(null);
    setShowManualBuilder(false);
    setIsGenerating(true);
    setStep(6);

    persistPartial(5, {
      timetable: overrideTimetable !== undefined ? overrideTimetable.trim() : timetable.trim(),
    });

    try {
      const request = buildEffectivePlanRequest(overrideTimetable);
      const plan = await ApiClient.generateStudyPlan(request);
      setProposedPlan(plan);
    } catch (err: any) {
      setProposedPlan(null);
      setAiError(
        err?.message ||
          'AI schedule generation failed or is currently unavailable. You can retry or build your schedule manually.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptPlan = (finalizedPlan: StudyPlan) => {
    onCompletePlan(finalizedPlan, {
      subjects: parsedSubjects,
      targetExam: targetExam.trim() || finalizedPlan.subject,
      learningGoal: learningGoal.trim(),
      targetExamDate: finalizedPlan.examDate,
      dailyGoalHours: Number(dailyHours) || finalizedPlan.dailyHours,
      preferredStudyDays: preferredDays,
      weakTopics: parsedWeakTopics,
      timetable: timetable.trim(),
      onboardingCompleted: true,
      onboardingStep: 6,
    });
  };

  const inputClass =
    'w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 dark:focus:border-teal-400 transition-colors';

  // Step 6: Generating / Review Draft / AI Failure + Manual Fallback
  if (step === 6) {
    if (showManualBuilder) {
      return (
        <div className="max-w-4xl mx-auto">
          <ManualScheduleBuilder
            initialSubject={targetExam.trim() || parsedSubjects[0] || ''}
            initialTopics={parsedSubjects}
            initialExamDate={targetExamDate}
            initialDailyHours={dailyHours}
            initialWeakTopics={parsedWeakTopics}
            initialPreferredDays={preferredDays}
            initialLevel={level}
            initialLearningGoal={learningGoal}
            initialTimetable={timetable}
            onSavePlan={handleAcceptPlan}
            onCancel={() => setShowManualBuilder(false)}
          />
        </div>
      );
    }

    if (isGenerating) {
      return (
        <div className="max-w-3xl mx-auto">
          <StudioPanel className="p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <div className="w-5 h-5 border-2 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Building Your Personalized Study Plan...
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Sequencing <strong className="text-slate-900 dark:text-slate-200">{parsedSubjects.join(', ')}</strong> around your {dailyHours}h/day capacity. You will review and approve the schedule before anything is saved.
              </p>
            </div>
          </StudioPanel>
        </div>
      );
    }

    if (proposedPlan) {
      return (
        <div className="max-w-4xl mx-auto">
          <PlanReviewPanel
            proposedPlan={proposedPlan}
            onAccept={handleAcceptPlan}
            onRegenerate={() => triggerPlanGeneration()}
            onCancel={() => {
              setProposedPlan(null);
              setStep(5);
            }}
            isRegenerating={isGenerating}
          />
        </div>
      );
    }

    // Honest AI Failure State with Retry + Manual Schedule Creation Option
    return (
      <div className="max-w-3xl mx-auto">
        <StudioPanel className="p-7 sm:p-9 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                AI Schedule Generation Failed
              </h2>
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 leading-relaxed" role="alert">
                {aiError}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your answers have been saved. StudyMate will never fabricate a fake AI schedule—you can retry AI generation or build your real schedule manually using your entered subjects and time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
            <button
              type="button"
              onClick={() => triggerPlanGeneration()}
              className="px-4 py-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Retry AI Generation</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualBuilder(true)}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Create Schedule Manually</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer ml-auto"
            >
              Back to Edit Inputs
            </button>
          </div>
        </StudioPanel>
      </div>
    );
  }

  // Step 0: Welcoming Onboarding Entry Screen (One Primary CTA)
  if (step === 0) {
    return (
      <div className="max-w-3xl mx-auto py-4 sm:py-8">
        <section
          aria-label="StudyMate Onboarding Welcome"
          className="bg-[#0A1628] dark:bg-[#0F1D32] text-white rounded-2xl border border-[#1E2F47] p-8 sm:p-10 shadow-xl space-y-6"
        >
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-teal-300 block">
              Personal Learning Studio &middot; Setup
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Welcome, {firstName}. Let&apos;s build your personal study studio.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Your workspace starts completely clean—no pre-filled schedules or placeholder scores. Answer a few short questions so StudyMate can create a plan tailored to your real subjects, timeline, and weekly availability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-[#07101E] dark:bg-[#0A1628] border border-white/10 space-y-1">
              <span className="font-semibold text-teal-300 block">1. Your Subjects</span>
              <span>Only topics you choose appear on your map and planner.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#07101E] dark:bg-[#0A1628] border border-white/10 space-y-1">
              <span className="font-semibold text-teal-300 block">2. Your Pace</span>
              <span>Respects your daily hours, exam date, and commitments.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#07101E] dark:bg-[#0A1628] border border-white/10 space-y-1">
              <span className="font-semibold text-teal-300 block">3. Review First</span>
              <span>Edit, regenerate, or build manually before saving.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create My Study Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSkipToWorkspace}
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white underline-offset-4 hover:underline cursor-pointer"
            >
              Explore empty workspace first
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Progressive Steps 1 to 5
  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-4">
      <StudioPanel className="p-6 sm:p-8 space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
              Step {step} of 5
            </span>
            <div className="w-40 sm:w-56 h-1.5 rounded-full bg-[#EFECE3] dark:bg-[#16263D] overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSkipToWorkspace}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Save &amp; finish later
          </button>
        </div>

        {stepError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* STEP 1: Subjects or skills */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>What subjects or skills are you studying?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Why we ask:</strong> Your subjects and key topics form your study schedule, concept map, and practice recommendations—so nothing unrelated appears in your studio.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-subjects" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Subjects or Topics (comma-separated) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="onboarding-subjects"
                rows={3}
                value={subjectsInput}
                onChange={(e) => setSubjectsInput(e.target.value)}
                placeholder="e.g. Organic Chemistry, Reaction Mechanisms, Stereochemistry — or Spanish Vocabulary, Verb Conjugation"
                className={inputClass}
              />
              {parsedSubjects.length > 0 && (
                <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                  Detected {parsedSubjects.length} subject/topic{parsedSubjects.length === 1 ? '' : 's'}:{' '}
                  {parsedSubjects.join(' · ')}
                </p>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Exam date, target date, or learning goal */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>What is your target date or learning goal?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Why we ask:</strong> Knowing your deadline or goal lets StudyMate pace revision intervals realistically without cramming everything into the last week.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="onboarding-target-exam" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Exam or Course Name
                </label>
                <input
                  id="onboarding-target-exam"
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. Biology Midterm, IELTS, Semester Finals"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="onboarding-exam-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Exam or Target Date
                </label>
                <input
                  id="onboarding-exam-date"
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="onboarding-learning-goal" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Learning Goal (required if no target date is set)
                </label>
                <input
                  id="onboarding-learning-goal"
                  type="text"
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. Score 85%+ on mock tests, or complete Chapters 1–6 fluently"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Available study time */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>How much study time do you have available?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Why we ask:</strong> Daily hours and preferred days ensure your schedule never exceeds your real capacity and leaves rest days intact.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="onboarding-daily-hours" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Daily Available Study Hours <span className="text-rose-500">*</span>
                </label>
                <input
                  id="onboarding-daily-hours"
                  type="number"
                  min={0.5}
                  max={14}
                  step={0.5}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value) || 1)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="onboarding-level" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Current Comfort Level
                </label>
                <select
                  id="onboarding-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as StudyLevel)}
                  className={inputClass}
                >
                  <option value="Beginner">Beginner (Building foundations)</option>
                  <option value="Intermediate">Intermediate (Core concepts)</option>
                  <option value="Advanced">Advanced (Revision &amp; problem solving)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Preferred Study Days <span className="text-rose-500">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const selected = preferredDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      aria-pressed={selected}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'bg-[#F7F5EF] dark:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Weak topics (Optional / Skippable) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Any weak topics or areas needing extra revision?
                </h2>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Optional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                If specific topics feel harder right now, list them so your plan schedules them earlier with extra practice. You can skip this and add weak topics later.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-weak-topics" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Weak or Priority Topics (comma-separated, optional)
              </label>
              <input
                id="onboarding-weak-topics"
                type="text"
                value={weakTopicsInput}
                onChange={(e) => setWeakTopicsInput(e.target.value)}
                placeholder="e.g. Stereochemistry, Integration by Parts"
                className={inputClass}
              />
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setWeakTopicsInput('');
                    goToStep(5, { weakTopics: [] });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip for now</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Existing College/Work Timetable (Optional / Skippable) */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Do you have an existing college or work timetable?
                </h2>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Optional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Share fixed classes, shifts, or busy hours so your generated plan avoids conflicts. Skip this if your schedule is flexible.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-timetable" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Existing Classes / Work Schedule (optional)
              </label>
              <textarea
                id="onboarding-timetable"
                rows={3}
                value={timetable}
                onChange={(e) => setTimetable(e.target.value)}
                placeholder="e.g. Mon–Fri 9:00 AM–2:30 PM classes; Tue/Thu 5:00 PM–7:00 PM part-time shift"
                className={inputClass}
              />
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTimetable('');
                    triggerPlanGeneration('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip &amp; Generate Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerPlanGeneration()}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Study Plan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </StudioPanel>
    </div>
  );
};
