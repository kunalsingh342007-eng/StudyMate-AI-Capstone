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
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ScheduleList } from '../components/dashboard/ScheduleList';
import { AdaptiveModal } from '../components/planner/AdaptiveModal';
import { Banner } from '../components/layout/Banner';
import { StudyTask, AdaptedPlanResponse } from '../types';

export const DashboardPage: React.FC = () => {
  const { activePlan, progress, updateTaskStatus, setActivePlan } = useStorage();
  const [adaptiveTargetTask, setAdaptiveTargetTask] = useState<StudyTask | null>(null);

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
    <div className="space-y-8 py-4 sm:py-6">
      <Banner isDemoData={activePlan?.isDemoFallback} />

      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalized evidence-based roadmap for {activePlan?.subject || 'your upcoming exams'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/explain"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Explain Concept
          </Link>

          <Link
            to="/quiz"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Take Practice Quiz
          </Link>

          <Link
            to="/planner"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
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

        {/* Right Sidebar: Weak Topics & AI Next Steps (1 col) */}
        <div className="space-y-6">
          {/* Weak Topics Prioritization Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Focus Areas / Weak Topics
            </h3>
            <p className="text-xs text-slate-500">
              Identified from your self-assessment and practice quiz errors.
            </p>

            {progress.weakTopicsIdentified.length > 0 ? (
              <div className="space-y-2 pt-1">
                {progress.weakTopicsIdentified.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-rose-950 truncate">{topic}</span>
                    <Link
                      to={`/explain?topic=${encodeURIComponent(topic)}`}
                      className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 whitespace-nowrap"
                    >
                      Study &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                No weak topics flagged yet. Take a quiz to diagnose knowledge gaps!
              </div>
            )}
          </div>

          {/* Recommended Next Task Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 sm:p-6 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
              Claude AI Recommendation
            </span>
            <h4 className="text-sm font-bold text-slate-900">Spaced Active Recall Protocol</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              After finishing your priority focus block, spend 10 minutes writing down key formulas without looking at notes, then test with a 4-question practice quiz.
            </p>
            <div className="pt-1">
              <Link
                to="/quiz"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Launch instant quiz on today's topic <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
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
