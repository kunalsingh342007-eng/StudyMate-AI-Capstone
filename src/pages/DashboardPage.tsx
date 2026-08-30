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
          {/* Weak Topics Prioritization Box */}
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#0B1720] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Focus Areas / Weak Topics
            </h3>
            <p className="text-xs text-[#6B747A]">
              Identified from your self-assessment and quiz diagnostics.
            </p>

            {progress.weakTopicsIdentified.length > 0 ? (
              <div className="space-y-2 pt-1">
                {progress.weakTopicsIdentified.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-rose-950 truncate">{topic}</span>
                    <Link
                      to={`/explain?topic=${encodeURIComponent(topic)}`}
                      className="text-[11px] font-bold text-rose-700 hover:text-rose-900 whitespace-nowrap"
                    >
                      Study &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E2DDD2] text-xs text-[#6B747A] text-center">
                No weak topics flagged yet. Take a quiz to diagnose knowledge gaps!
              </div>
            )}
          </div>

          {/* Recommended Next Task Box */}
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-[#1A5C7A] uppercase tracking-wider block font-mono">
              Study Protocol
            </span>
            <h4 className="text-sm font-bold text-[#0B1720]">Active Recall & Spaced Practice</h4>
            <p className="text-xs text-[#6B747A] leading-relaxed">
              After finishing your priority focus block, spend 10 minutes writing down key formulas without looking at notes, then test with a 4-question practice quiz.
            </p>
            <div className="pt-1">
              <Link
                to="/quiz"
                className="text-xs font-bold text-[#1A5C7A] hover:text-[#207297] flex items-center gap-1"
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

