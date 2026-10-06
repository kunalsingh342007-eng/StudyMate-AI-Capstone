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
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ScheduleList } from '../components/dashboard/ScheduleList';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { Banner } from '../components/layout/Banner';
import { StudyTask, AdaptedPlanResponse } from '../types';
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
    targetExamDate: activePlan?.examDate,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD2] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B747A] font-mono">
            COMMAND CENTER
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1720] tracking-tight">
            Study Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#6B747A] mt-1">
            Personalized evidence-based roadmap for <strong className="text-[#0B1720]">{activePlan?.subject || 'your upcoming exams'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/explain"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#0B1720] bg-white border border-[#E2DDD2] hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#1A5C7A]" />
            Explain Concept
          </Link>

          <Link
            to="/quiz"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#0B1720] bg-white border border-[#E2DDD2] hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[#1A5C7A]" />
            Take Practice Quiz
          </Link>

          <Link
            to="/planner"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </Link>
        </div>
      </div>

      {/* 1. What should I study today? Priority Card */}
      <PriorityCard
        task={priorityTask}
        onComplete={handleCompleteTask}
        examDate={activePlan?.examDate}
      />

      {/* 2. Key Metrics Grid */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Study Progress Metrics
        </h2>
        <StatsGrid progress={progress} activePlan={activePlan} />
      </section>

      {/* 3. Schedule & Weak Topics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule List (2 cols) */}
        <div className="lg:col-span-2">
          <ScheduleList
            plan={activePlan}
            onStatusChange={handleTaskStatusChange}
            onMissedClick={handleMissedClick}
          />
        </div>

        {/* Right Sidebar: Weak Topics & Study Recommendations (1 col) */}
        <div className="space-y-6">
          {/* Spaced Review Due Alert (if any) */}
          {dueReviews.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Spaced Recall Due Today
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                  {dueReviews.length} Due
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Memory consolidation scheduled for <strong className="font-semibold">{dueReviews[0].topic}</strong>. Rapid 5-minute retrieval cements long-term retention.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Link
                  to={`/quiz?topic=${encodeURIComponent(dueReviews[0].topic)}`}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  Start Recall Drill &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => completeSpacedReview(dueReviews[0].id, 'good')}
                  className="px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:text-amber-950 transition-colors"
                >
                  Mark Reviewed
                </button>
              </div>
            </div>
          )}

          {/* Weak Topics Prioritization Box */}
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1720] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Your Weak Areas
              </h3>
              <span className="text-[11px] font-bold text-rose-600 uppercase font-mono">
                {weakAreas.length} Flagged
              </span>
            </div>
            <p className="text-xs text-[#6B747A]">
              Dynamic mastery scores updated from your quiz results and mistake frequency.
            </p>

            {weakAreas.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {weakAreas.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            item.priority === 'High'
                              ? 'bg-rose-500 ring-2 ring-rose-200'
                              : item.priority === 'Medium'
                              ? 'bg-amber-500 ring-2 ring-amber-200'
                              : 'bg-yellow-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-900 truncate">{item.topic}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.mastery}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                      <span>{item.mistakeCount > 0 ? `${item.mistakeCount} active mistake(s)` : 'Accuracy deficit'}</span>
                      <Link
                        to={item.actionRoute}
                        className="font-bold text-[#1A5C7A] hover:text-[#207297] flex items-center gap-0.5"
                      >
                        {item.mastery < 40 ? 'Review Breakdown' : 'Practice Drill'} &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E2DDD2] text-xs text-[#6B747A] text-center">
                All syllabus topics currently show stable mastery! Take an advanced quiz to test edge cases.
              </div>
            )}
          </div>

          {/* AI Recommended Next Action Card */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-[#1A5C7A] uppercase tracking-wider block font-mono">
                STUDY PROTOCOL &bull; {recommendations[0].priority} PRIORITY
              </span>
              <h4 className="text-sm font-bold text-[#0B1720]">{recommendations[0].title}</h4>
              <p className="text-xs text-[#6B747A] leading-relaxed">
                {recommendations[0].reason}
              </p>
              <div className="pt-1">
                <Link
                  to={recommendations[0].actionRoute}
                  className="text-xs font-bold text-[#1A5C7A] hover:text-[#207297] flex items-center gap-1"
                >
                  {recommendations[0].actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adaptive Modal when Missed is clicked */}
      {adaptiveTargetTask && activePlan && (
        <AdaptiveModal
          task={adaptiveTargetTask}
          currentPlan={activePlan}
          isOpen={Boolean(adaptiveTargetTask)}
          onClose={() => setAdaptiveTargetTask(null)}
          onPlanAdapted={handlePlanAdapted}
        />
      )}
    </div>
  );
};

