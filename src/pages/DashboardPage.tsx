import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Clock,
  FileText,
  BarChart3,
  Flame,
  Plus,
  AlertTriangle,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ScheduleList } from '../components/dashboard/ScheduleList';
import { LearningMap } from '../components/dashboard/LearningMap';
import { NextBestAction } from '../components/dashboard/NextBestAction';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { CreateTaskModal } from '../components/planner/CreateTaskModal';
import { Banner } from '../components/layout/Banner';
import { StudyPlan, StudyTask, AdaptedPlanResponse, UserProfile } from '../types';
import { MasteryEngine } from '../services/learning/masteryEngine';
import { calculateProfileCompletion } from '../services/learning/profileUtils';
import { StorageService } from '../services/storage/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardPage: React.FC = () => {
  const {
    activePlan,
    savedPlans,
    progress,
    masteries,
    mistakes,
    spacedReviews,
    quizHistory,
    studySessions,
    notes,
    completeSpacedReview,
    updateTaskStatus,
    setActivePlan,
    addTaskToActivePlan,
    logStudySession,
    userProfile,
    saveUserProfile,
  } = useStorage();
  const { userProfile: authProfile, currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const activeUserProfile: UserProfile = useMemo(
    () => ({
      ...authProfile,
      ...userProfile,
      onboardingCompleted: Boolean(
        authProfile?.onboardingCompleted || userProfile?.onboardingCompleted || savedPlans.length > 0
      ),
    }),
    [authProfile, userProfile, savedPlans.length]
  );

  const firstName =
    (currentUser?.displayName || activeUserProfile.name || 'Student').split(' ')[0] || 'Student';

  const [adaptiveTargetTask, setAdaptiveTargetTask] = useState<StudyTask | null>(null);
  const [exploreWorkspace, setExploreWorkspace] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const syllabus = StorageService.getSyllabus();

  const shouldShowOnboarding =
    forceOnboarding ||
    (!activeUserProfile.onboardingCompleted && savedPlans.length === 0 && !exploreWorkspace);

  const weakAreas = MasteryEngine.detectWeakAreas(masteries, mistakes);
  const dueReviews = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue');

  const recommendations = MasteryEngine.generateRecommendations({
    masteries,
    dueReviews,
    weakAreas,
    activePlan,
    recentMistakes: mistakes,
    targetExamDate: activePlan?.examDate || activeUserProfile.targetExamDate,
  });

  const pendingTasksToday = activePlan
    ? activePlan.tasks.filter((t) => t.status === 'pending')
    : [];
  const priorityTask = pendingTasksToday[0] || null;
  const hasAnyTasks = Boolean(activePlan && activePlan.tasks.length > 0);

  const handleSaveOnboardingProgress = (partial: Partial<UserProfile>) => {
    saveUserProfile(partial);
    updateProfile(partial).catch(() => {});
  };

  const handleCompleteOnboardingPlan = (plan: StudyPlan, profileUpdates: Partial<UserProfile>) => {
    setActivePlan(plan);
    saveUserProfile(profileUpdates);
    updateProfile(profileUpdates).catch(() => {});
    setForceOnboarding(false);
    setExploreWorkspace(false);
    showToast({
      variant: 'success',
      title: `Study plan saved for ${plan.subject}`,
      description: `${plan.tasks.length} study sessions ready in your Learning Studio.`,
    });
  };

  const handleCompleteTask = (taskId: string, loggedMinutes?: number) => {
    if (!activePlan) return;
    const task = activePlan.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousStatus = task.status;
    const nextStatus = previousStatus === 'completed' ? 'pending' : 'completed';
    updateTaskStatus(taskId, nextStatus);

    if (nextStatus === 'completed' && loggedMinutes && loggedMinutes > 0) {
      logStudySession({
        topic: task.topic,
        subject: activePlan.subject,
        taskId: task.id,
        actualMinutes: loggedMinutes,
        date: new Date().toISOString().split('T')[0],
        notes: task.subtopic,
      });
    }

    showToast({
      variant: nextStatus === 'completed' ? 'success' : 'info',
      title: nextStatus === 'completed' ? `Completed: ${task.topic}` : `Reopened: ${task.topic}`,
      description:
        nextStatus === 'completed' && loggedMinutes
          ? `Logged ${loggedMinutes} focused minutes.`
          : undefined,
      action: {
        label: 'Undo',
        onClick: () => updateTaskStatus(taskId, previousStatus),
      },
    });
  };

  const handleTaskStatusChange = (taskId: string, status: 'pending' | 'completed' | 'missed') => {
    const task = activePlan?.tasks.find((t) => t.id === taskId);
    const previousStatus = task?.status || 'pending';
    updateTaskStatus(taskId, status);

    if (task) {
      showToast({
        variant: 'info',
        title: `Task marked ${status}`,
        description: task.topic,
        action: {
          label: 'Undo',
          onClick: () => updateTaskStatus(taskId, previousStatus),
        },
      });
    }
  };

  const handlePlanAdapted = (adapted: AdaptedPlanResponse) => {
    if (!activePlan) return;
    const snapshot = activePlan;
    setActivePlan({
      ...activePlan,
      tasks: adapted.updatedTasks,
    });
    showToast({
      variant: 'success',
      title: 'Schedule adapted',
      description: adapted.redistributionSummary,
      action: {
        label: 'Undo',
        onClick: () => setActivePlan(snapshot),
      },
    });
  };

  // Real Recent Activity synthesized solely from actual persisted user records
  const recentActivities = useMemo(() => {
    const items: {
      id: string;
      title: string;
      desc: string;
      timestamp: number;
      type: 'quiz' | 'session' | 'note';
      route: string;
    }[] = [];

    quizHistory.slice(0, 3).forEach((q) => {
      items.push({
        id: `quiz-${q.id}`,
        title: `Practice Quiz: ${q.topic}`,
        desc: `Scored ${q.percentage}% (${q.score}/${q.totalQuestions}) · ${q.difficulty}`,
        timestamp: new Date(q.completedAt).getTime() || 0,
        type: 'quiz',
        route: `/quiz?topic=${encodeURIComponent(q.topic)}`,
      });
    });

    studySessions.slice(0, 3).forEach((s) => {
      items.push({
        id: `session-${s.id}`,
        title: `Focus Session: ${s.topic}`,
        desc: `${s.actualMinutes} min logged${s.notes ? ` · ${s.notes}` : ''}`,
        timestamp: new Date(s.completedAt).getTime() || 0,
        type: 'session',
        route: `/planner`,
      });
    });

    notes.slice(0, 2).forEach((n) => {
      items.push({
        id: `note-${n.id}`,
        title: `Study Note: ${n.title}`,
        desc: n.subject,
        timestamp: new Date(n.updatedAt).getTime() || 0,
        type: 'note',
        route: `/notes`,
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [quizHistory, studySessions, notes]);

  // Quick context chips derived strictly from user's own subjects/plan/reviews
  const contextualQuickActions = useMemo(() => {
    const actions: { label: string; to: string }[] = [];
    if (priorityTask) {
      actions.push({
        label: `Explain ${priorityTask.topic.split(':')[0]}`,
        to: `/explain?topic=${encodeURIComponent(priorityTask.topic)}`,
      });
      actions.push({
        label: `Quiz ${priorityTask.topic.split(':')[0]}`,
        to: `/quiz?topic=${encodeURIComponent(priorityTask.topic)}`,
      });
    } else if (activePlan?.topics[0]) {
      actions.push({
        label: `Explore ${activePlan.topics[0]}`,
        to: `/explain?topic=${encodeURIComponent(activePlan.topics[0])}`,
      });
    } else if (activeUserProfile.subjects && activeUserProfile.subjects.length > 0) {
      actions.push({
        label: `Explain ${activeUserProfile.subjects[0]}`,
        to: `/explain?topic=${encodeURIComponent(activeUserProfile.subjects[0])}`,
      });
      actions.push({
        label: `Quiz ${activeUserProfile.subjects[0]}`,
        to: `/quiz?topic=${encodeURIComponent(activeUserProfile.subjects[0])}`,
      });
    }
    if (dueReviews.length > 0) {
      actions.push({
        label: `Review ${dueReviews[0].topic}`,
        to: `/quiz?topic=${encodeURIComponent(dueReviews[0].topic)}`,
      });
    }
    if (actions.length === 0) {
      actions.push({ label: 'Explain a Concept', to: '/explain' });
      actions.push({ label: 'Take Practice Quiz', to: '/quiz' });
    }
    return actions.slice(0, 3);
  }, [priorityTask, activePlan, dueReviews, activeUserProfile.subjects]);

  const userEnteredWeakTopics = activeUserProfile.weakTopics || [];
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const assessedConceptsCount = Object.keys(masteries).length;
  const profileCompletion = useMemo(
    () => calculateProfileCompletion(activeUserProfile),
    [activeUserProfile]
  );
  const activePersonalGoals = useMemo(
    () => (activeUserProfile.goals || []).filter((g) => g.status !== 'Completed'),
    [activeUserProfile.goals]
  );
  const academicContextSubtitle = [
    activeUserProfile.degree?.trim(),
    activeUserProfile.branch?.trim(),
    activeUserProfile.institution?.trim(),
  ]
    .filter(Boolean)
    .join(' · ');

  if (shouldShowOnboarding) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Banner />
        <OnboardingFlow
          firstName={firstName}
          userProfile={activeUserProfile}
          onSaveProfileProgress={handleSaveOnboardingProgress}
          onCompletePlan={handleCompleteOnboardingPlan}
          onSkipToWorkspace={() => {
            setForceOnboarding(false);
            setExploreWorkspace(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      {/* Resume Onboarding Prompt if user skipped into empty workspace */}
      {!activeUserProfile.onboardingCompleted && savedPlans.length === 0 && (
        <div className="rounded-2xl bg-[#0A1628] dark:bg-[#0F1D32] border border-[#1E2F47] p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">Ready to personalize your Learning Studio?</p>
            <p className="text-xs text-slate-300">
              Complete the quick setup to generate or build a study plan tailored to your subjects and schedule.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setForceOnboarding(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create My Study Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* A. Personalized Welcome */}
      <section
        aria-label="Personalized Welcome"
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E5E1D6] dark:border-[#1E2F47]"
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400 block">
            Learning Studio &middot; {todayFormatted}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {getGreeting()}, {firstName}. What are you working on today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {activePlan
              ? `Active focus: ${activePlan.subject} (${activePlan.level})${
                  academicContextSubtitle ? ` · ${academicContextSubtitle}` : ''
                }`
              : syllabus
              ? `Syllabus loaded: ${syllabus.subject}`
              : activeUserProfile.subjects && activeUserProfile.subjects.length > 0
              ? `Your subjects: ${activeUserProfile.subjects.join(', ')}`
              : academicContextSubtitle
              ? academicContextSubtitle
              : 'Your studio starts fresh. Add a task, configure your subjects, or build a schedule.'}
          </p>
        </div>

        {/* Contextual Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {contextualQuickActions.map((act) => (
            <Link
              key={act.label}
              to={act.to}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
            >
              {act.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setShowCreateTaskModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Create Task</span>
          </button>
          <Link
            to="/planner"
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Study Plan</span>
          </Link>
        </div>
      </section>

      {/* B. Today's Learning Goal */}
      <PriorityCard
        task={priorityTask}
        onComplete={handleCompleteTask}
        examDate={activePlan?.examDate || activeUserProfile.targetExamDate}
        totalPendingToday={pendingTasksToday.length}
        hasAnyTasks={hasAnyTasks}
        onCreateTask={() => setShowCreateTaskModal(true)}
      />

      {/* C. Interactive Learning Map + D. Next Best Action + Weak Topics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <LearningMap activePlan={activePlan} syllabus={syllabus} masteries={masteries} />
        </div>

        <div className="xl:col-span-4 space-y-6">
          <NextBestAction recommendations={recommendations} />

          {/* Weak Topics Card (Real user-entered or quiz-detected weak areas only) */}
          <section
            aria-label="Weak Topics"
            className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-2.5">
              <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Weak Topics</span>
              </span>
              <Link
                to="/profile"
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Edit Profile
              </Link>
            </div>

            {weakAreas.length > 0 ? (
              <div className="space-y-2">
                {weakAreas.slice(0, 3).map((w) => (
                  <Link
                    key={w.topic}
                    to={w.actionRoute}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {w.topic}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
                      {w.mastery}%
                    </span>
                  </Link>
                ))}
              </div>
            ) : userEnteredWeakTopics.length > 0 ? (
              <div className="space-y-2">
                {userEnteredWeakTopics.slice(0, 4).map((topic) => (
                  <Link
                    key={topic}
                    to={`/explain?topic=${encodeURIComponent(topic)}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {topic}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 shrink-0">
                      Practice &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No weak topics identified yet. Add challenging topics in your study profile or complete a diagnostic quiz to pinpoint areas needing revision.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/profile"
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Add Weak Topics
                  </Link>
                  <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                  <Link
                    to="/quiz"
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Complete Assessment
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Spaced Review Due Callout (only shown if real due items exist) */}
          {dueReviews.length > 0 && (
            <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-amber-300/70 dark:border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Spaced Review Due</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                  {dueReviews.length} due
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Scheduled recall for <strong className="font-semibold text-slate-900 dark:text-white">{dueReviews[0].topic}</strong>: {dueReviews[0].concept}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/quiz?topic=${encodeURIComponent(dueReviews[0].topic)}`}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Start Recall Drill
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    completeSpacedReview(dueReviews[0].id, 'good');
                    showToast({
                      variant: 'success',
                      title: 'Review completed',
                      description: `Scheduled next interval for ${dueReviews[0].topic}.`,
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Mark Reviewed
                </button>
              </div>
            </div>
          )}

          {/* Student Profile & Active Goals Summary (truthful, separate from mastery) */}
          <section
            aria-label="Student Profile Summary"
            className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-2.5">
              <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Student Profile &amp; Goals</span>
              </span>
              <Link
                to="/profile"
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Open Profile
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Profile Details Saved</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {profileCompletion.percentage}%
              </span>
            </div>

            {activePersonalGoals.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Goals ({activePersonalGoals.length})
                </p>
                {activePersonalGoals.slice(0, 2).map((goal) => (
                  <Link
                    key={goal.id}
                    to="/profile?tab=goals"
                    className="block p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-teal-500/50 transition-colors truncate"
                  >
                    {goal.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No personal goals added yet.{' '}
                <Link
                  to="/profile?tab=goals"
                  className="font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  Add a goal
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>

      {/* E. Progress Overview (Real indicators only) */}
      <section aria-labelledby="progress-overview-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="progress-overview-heading" className="text-sm font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Progress Overview
          </h2>
          <Link
            to="/progress"
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <StatsGrid
          progress={progress}
          activePlan={activePlan}
          dueReviewsCount={dueReviews.length}
          assessedConceptsCount={assessedConceptsCount}
          targetExamDate={activeUserProfile.targetExamDate}
        />
      </section>

      {/* Schedule, Recent Activity & F. Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <ScheduleList
            plan={activePlan}
            onStatusChange={handleTaskStatusChange}
            onMissedClick={(task) => setAdaptiveTargetTask(task)}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* F. Quick Launch */}
          <section
            aria-label="Quick Launch"
            className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-3.5"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick Launch</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'AI Explainer', to: '/explain', icon: Sparkles },
                { label: 'Practice Quiz', to: '/quiz', icon: HelpCircle },
                { label: 'Study Planner', to: '/planner', icon: Calendar },
                { label: 'Progress', to: '/progress', icon: BarChart3 },
                { label: 'Study Notes', to: '/notes', icon: FileText },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className="p-3 rounded-xl bg-[#F7F5EF]/70 dark:bg-[#16263D]/70 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors flex items-center gap-2.5 group"
                  >
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {tool.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Real Recent Activity */}
          <section
            aria-label="Recent Activity"
            className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Activity</h3>
              <span className="text-[11px] font-mono text-slate-400">Saved History</span>
            </div>

            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2 leading-relaxed">
                No recorded activity yet. Complete a task, study session, practice quiz, or study note to see your real history here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => {
                  const Icon =
                    act.type === 'quiz' ? HelpCircle : act.type === 'session' ? Clock : FileText;
                  return (
                    <Link
                      key={act.id}
                      to={act.route}
                      className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-[#EFECE3] dark:bg-[#16263D] text-teal-700 dark:text-teal-300 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {act.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                            {act.timestamp > 0
                              ? new Date(act.timestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {act.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {adaptiveTargetTask && activePlan && (
        <AdaptiveModal
          isOpen={!!adaptiveTargetTask}
          onClose={() => setAdaptiveTargetTask(null)}
          missedTask={adaptiveTargetTask}
          currentPlan={activePlan}
          onPlanAdapted={handlePlanAdapted}
        />
      )}

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        defaultSubject={activePlan?.subject || activeUserProfile.subjects?.[0] || ''}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={(taskInput) => {
          addTaskToActivePlan(taskInput);
          showToast({
            variant: 'success',
            title: `Added task: ${taskInput.topic}`,
            description: 'Scheduled in your active study plan.',
          });
        }}
      />
    </div>
  );
};
