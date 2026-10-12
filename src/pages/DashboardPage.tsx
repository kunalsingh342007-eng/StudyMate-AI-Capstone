import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ScheduleList } from '../components/dashboard/ScheduleList';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { Banner } from '../components/layout/Banner';
import { StudyTask, AdaptedPlanResponse, TopicMastery } from '../types';
import { MasteryEngine } from '../services/learning/masteryEngine';

export const DashboardPage: React.FC = () => {
  const {
    activePlan,
    progress,
    masteries,
    mistakes,
    spacedReviews,
    completeSpacedReview,
    updateTaskStatus,
    setActivePlan,
    userProfile,
  } = useStorage();
  const [adaptiveTargetTask, setAdaptiveTargetTask] = useState<StudyTask | null>(null);

  // Compute actual weak areas with deterministic urgency & priority
  const weakAreas = MasteryEngine.detectWeakAreas(masteries, mistakes);

  // Filter due spaced reviews
  const dueReviews = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue');

  // Pedagogical recommendations
  const recommendations = MasteryEngine.generateRecommendations({
    masteries,
    dueReviews,
    weakAreas,
    activePlan,
    recentMistakes: mistakes,
    targetExamDate: activePlan?.examDate || userProfile.targetExamDate,
  });

  // Determine today's priority task (first pending high/medium priority task)
  const priorityTask = activePlan
    ? activePlan.tasks.find((t) => t.status === 'pending') || null
    : null;

  const handleCompleteTask = (taskId: string) => {
    const task = activePlan?.tasks.find((t) => t.id === taskId);
    if (task) {
      updateTaskStatus(taskId, task.status === 'completed' ? 'pending' : 'completed');
    }
  };

  const handleTaskStatusChange = (taskId: string, status: 'pending' | 'completed' | 'missed') => {
    updateTaskStatus(taskId, status);
  };

  const handleMissedClick = (task: StudyTask) => {
    setAdaptiveTargetTask(task);
  };

  const handlePlanAdapted = (adapted: AdaptedPlanResponse) => {
    if (activePlan) {
      setActivePlan({
        ...activePlan,
        tasks: adapted.updatedTasks,
      });
    }
  };

  // Date formatting
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate exam days remaining
  const targetDateStr = activePlan?.examDate || userProfile.targetExamDate;
  const examDaysLeft = targetDateStr
    ? Math.max(0, Math.ceil((new Date(targetDateStr).getTime() - new Date().getTime()) / 86400000))
    : 18;

  // Recent activity items
  const recentActivities = [
    {
      id: 'act-1',
      title: 'Completed Quiz: Operating Systems',
      desc: 'Scored 80% · Identified 1 conceptual mistake in CPU burst estimation.',
      time: '2 hours ago',
      icon: HelpCircle,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'act-2',
      title: 'Logged 45 min Study Session',
      desc: 'Dynamic Programming: 1D State Transitions & Memoization.',
      time: 'Yesterday',
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'act-3',
      title: 'Created Study Note',
      desc: 'Database Transactions & ACID Properties cheatsheet.',
      time: '2 days ago',
      icon: FileText,
      color: 'text-pink-600 bg-pink-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      {/* 1. Personalized Greeting Header & Motivational Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
              ACADEMIC DASHBOARD &bull; {todayFormatted}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight mt-1">
            Welcome back, {userProfile.name.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            You are preparing for <strong className="text-[#1E1B4B]">{activePlan?.subject || userProfile.targetExam || 'Semester Finals'}</strong> &bull; {examDaysLeft} days remaining
          </p>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/explain"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-2xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Ask Explainer</span>
          </Link>

          <Link
            to="/quiz"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-2xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Practice Quiz</span>
          </Link>

          <Link
            to="/planner"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-2xl flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </Link>
        </div>
      </div>

      {/* Motivational Learning Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-purple-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Daily Academic Motivation</span>
          </div>
          <p className="text-sm sm:text-base font-semibold leading-relaxed">
            &quot;Consistency beats intensity. 45 focused minutes today builds long-term neural recall far better than a 10-hour cram session tomorrow.&quot;
          </p>
        </div>
        <Link
          to="/planner"
          className="px-4 py-2 rounded-xl bg-white text-purple-900 hover:bg-purple-50 text-xs font-bold self-start sm:self-auto shrink-0 transition-colors shadow-xs"
        >
          View Today&apos;s Plan &rarr;
        </Link>
      </div>

      {/* 2. Key Metrics Grid (Streak, Tasks, Countdown, Hours, Quizzes, Weak Areas) */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Study Progress Metrics
        </h2>
        <StatsGrid progress={progress} activePlan={activePlan} />
      </section>

      {/* 3. Priority Card (What should I study today?) */}
      <PriorityCard
        task={priorityTask}
        onComplete={handleCompleteTask}
        examDate={activePlan?.examDate || userProfile.targetExamDate}
      />

      {/* 4. Main Two-Column Layout: Schedule & Weak Topics / Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schedule List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ScheduleList
            plan={activePlan}
            onStatusChange={handleTaskStatusChange}
            onMissedClick={handleMissedClick}
          />

          {/* Quick Action Cards Grid */}
          <div className="bg-white rounded-3xl border border-purple-100/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1B4B]">Quick Learning Tools</h3>
              <span className="text-xs font-semibold text-purple-600">Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/planner"
                className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100/60 text-center transition-colors group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Study Plan</span>
              </Link>

              <Link
                to="/explain"
                className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100/60 text-center transition-colors group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">AI Explainer</span>
              </Link>

              <Link
                to="/quiz"
                className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100/60 text-center transition-colors group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Start Quiz</span>
              </Link>

              <Link
                to="/notes"
                className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100/60 text-center transition-colors group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Study Notes</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Mastery, Weak Topics & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spaced Review Due Alert */}
          {dueReviews.length > 0 && (
            <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                  Spaced Recall Due Today
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950">
                  {dueReviews.length} Due
                </span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                Memory consolidation scheduled for <strong className="font-semibold">{dueReviews[0].topic}</strong>. Rapid retrieval cements long-term mastery.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Link
                  to={`/quiz?topic=${encodeURIComponent(dueReviews[0].topic)}`}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors flex items-center gap-1 shadow-xs"
                >
                  Recall Drill &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => completeSpacedReview(dueReviews[0].id, 'good')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 transition-colors cursor-pointer"
                >
                  Mark Done
                </button>
              </div>
            </div>
          )}

          {/* Topic-Wise Mastery Overview */}
          <div className="bg-white rounded-3xl border border-purple-100/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  Topic Mastery Levels
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculated from quiz scores & retention</p>
              </div>
              <Link to="/progress" className="text-xs font-bold text-purple-600 hover:text-purple-700">
                Details &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {(Object.values(masteries) as TopicMastery[]).slice(0, 4).map((m) => (
                <div key={m.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{m.topic}</span>
                    <span
                      className={`font-bold ${
                        m.level === 'Mastered'
                          ? 'text-emerald-600'
                          : m.level === 'Needs Practice'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {m.score}% &bull; {m.level}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.level === 'Mastered'
                          ? 'bg-emerald-500'
                          : m.level === 'Needs Practice'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics Prioritization Box */}
          <div className="bg-white rounded-3xl border border-purple-100/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
              <h3 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Priority Weak Areas
              </h3>
              <span className="text-[11px] font-bold text-rose-600 uppercase font-mono">
                {weakAreas.length} Flagged
              </span>
            </div>

            {weakAreas.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {weakAreas.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F8F7FC] border border-purple-100 flex items-center justify-between gap-2"
                  >
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-[#1E1B4B] truncate">{item.topic}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.recommendedAction}</p>
                    </div>
                    <Link
                      to={`/quiz?topic=${encodeURIComponent(item.topic)}`}
                      className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shrink-0 transition-colors"
                    >
                      Drill Quiz
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No weak topics detected. Great job keeping your mastery high!</p>
            )}
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-3xl border border-purple-100/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
              <h3 className="text-sm font-bold text-[#1E1B4B]">Recent Activity</h3>
              <span className="text-[11px] text-slate-400">Past 3 Days</span>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${act.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Rescheduling Modal */}
      {adaptiveTargetTask && activePlan && (
        <AdaptiveModal
          isOpen={!!adaptiveTargetTask}
          onClose={() => setAdaptiveTargetTask(null)}
          missedTask={adaptiveTargetTask}
          currentPlan={activePlan}
          onPlanAdapted={handlePlanAdapted}
        />
      )}
    </div>
  );
};
