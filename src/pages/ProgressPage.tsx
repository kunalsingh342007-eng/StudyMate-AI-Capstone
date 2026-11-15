import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../context/ToastContext';
import {
  PageHeader,
  StudioPanel,
  ProgressMeter,
  StatusIndicator,
  EmptyState,
} from '../components/ui/Common';
import { MasteryEngine } from '../services/learning/masteryEngine';

export const ProgressPage: React.FC = () => {
  const {
    progress,
    activePlan,
    quizHistory,
    masteries,
    mistakes,
    spacedReviews,
    resolveMistake,
    completeSpacedReview,
  } = useStorage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'mastery' | 'mistakes' | 'spaced'>('overview');
  const [filterResolved, setFilterResolved] = useState(false);

  const totalTasks = activePlan?.tasks.length || progress.totalTasksCount || 0;
  const completedTasks =
    activePlan?.tasks.filter((t) => t.status === 'completed').length || progress.completedTasksCount || 0;
  const syllabusPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const weakAreas = MasteryEngine.detectWeakAreas(masteries, mistakes);
  const knowledgeTree = MasteryEngine.buildKnowledgeTree(activePlan, masteries);

  const unresolvedMistakeCount = mistakes.filter((m) => !m.resolved).length;
  const dueReviewCount = spacedReviews.filter(
    (r) => r.dueStatus === 'due' || r.dueStatus === 'overdue'
  ).length;
  const displayedMistakes = mistakes.filter((m) => (filterResolved ? true : !m.resolved));

  const handleResolveMistake = (id: string, topic: string) => {
    resolveMistake(id);
    showToast(`Marked mistake in "${topic}" as resolved`, 'success');
  };

  const handleCompleteReview = (id: string, concept: string) => {
    completeSpacedReview(id, 'good');
    showToast(`Scheduled next spaced retrieval interval for "${concept}"`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Learning Analytics"
        title="Progress & Topic Mastery"
        description="Deterministic topic mastery scores, mistake diagnostics, and spaced retrieval schedules computed from your real sessions."
        actions={
          <div className="flex items-center gap-1 p-1 bg-[#EFECE3] dark:bg-[#16263D] rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold flex-wrap">
            {(
              [
                { id: 'overview', label: 'Overview', count: 0 },
                { id: 'mastery', label: 'Knowledge Map', count: 0 },
                { id: 'mistakes', label: 'Mistakes', count: unresolvedMistakeCount },
                { id: 'spaced', label: 'Spaced Queue', count: dueReviewCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-mono tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      />

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StudioPanel className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {progress.streakDays} Days
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Consecutive active days</p>
        </StudioPanel>

        <StudioPanel className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {progress.totalHoursStudied}h
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Logged focus hours</p>
        </StudioPanel>

        <StudioPanel className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Syllabus Progress</span>
            <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {syllabusPercent}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </StudioPanel>

        <StudioPanel className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Average Quiz Score</span>
            <Award className="w-4 h-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {progress.quizzesTaken > 0 ? `${progress.averageQuizScore}%` : '—'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Across {progress.quizzesTaken} assessment{progress.quizzesTaken === 1 ? '' : 's'}
          </p>
        </StudioPanel>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Syllabus Progress */}
            <StudioPanel className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                  <span>Active Syllabus Completion</span>
                </h2>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                  {syllabusPercent}% Complete
                </span>
              </div>

              <ProgressMeter value={syllabusPercent} tone="teal" label="Syllabus completion" />

              {activePlan ? (
                <div className="space-y-2.5 pt-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium pb-2 border-b border-[#E5E1D6] dark:border-[#1E2F47] tabular-nums">
                    <span>{activePlan.subject}</span>
                    <span>Exam: {activePlan.examDate}</span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {activePlan.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              task.status === 'completed'
                                ? 'bg-lime-500'
                                : task.status === 'missed'
                                ? 'bg-rose-500'
                                : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                          />
                          <span
                            className={`truncate font-medium ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.topic}: {task.subtopic}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
                          {task.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No active study plan configured yet.
                  </p>
                  <Link
                    to="/planner"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Create Study Plan <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </StudioPanel>

            {/* Prioritized Weak Areas */}
            <StudioPanel className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                    <span>Prioritized Weak Areas</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Derived from quiz accuracy, mistake counts, and exam urgency
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                  {weakAreas.length} flagged
                </span>
              </div>

              {weakAreas.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {weakAreas.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.topic}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusIndicator
                            label={`${item.priority} priority`}
                            tone={item.priority === 'High' ? 'rose' : item.priority === 'Medium' ? 'amber' : 'neutral'}
                          />
                          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {item.mastery}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate mr-2">
                          {item.recommendedAction}
                        </span>
                        <Link
                          to={item.actionRoute}
                          className="font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                        >
                          Remediate <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    No weak topics flagged right now.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete quizzes to surface specific topics needing deeper revision.
                  </p>
                </div>
              )}
            </StudioPanel>
          </div>

          {/* Quiz Performance Timeline */}
          <StudioPanel className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                  <span>Recent Practice Quiz Performance</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Score breakdown from completed assessments
                </p>
              </div>
              <Link
                to="/quiz"
                className="px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Take New Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {quizHistory.length > 0 ? (
              <div className="space-y-2.5">
                {quizHistory.slice(0, 6).map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{q.topic}</h3>
                        <StatusIndicator
                          label={`${q.percentage}%`}
                          tone={q.percentage >= 70 ? 'lime' : 'rose'}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {q.subject} &middot; {q.difficulty} &middot;{' '}
                        <span className="tabular-nums">{new Date(q.completedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {q.score} / {q.totalQuestions} Correct
                      </span>
                      <Link
                        to={`/quiz?topic=${encodeURIComponent(q.topic)}`}
                        className="font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
                      >
                        Retest
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No quizzes completed yet. Test yourself on any topic in the Practice Quiz studio.
                </p>
              </div>
            )}
          </StudioPanel>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE MAP */}
      {activeTab === 'mastery' && (
        <StudioPanel className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <span>Knowledge Map Hierarchy</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Topic mastery computed from quiz accuracy, recency, study time, and confidence ratings
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <StatusIndicator label=">=75% Mastered" tone="lime" />
              <StatusIndicator label="50–74% Practice" tone="amber" />
              <StatusIndicator label="<50% Needs Focus" tone="rose" />
            </div>
          </div>

          {knowledgeTree.length > 0 ? (
            <div className="space-y-4">
              {knowledgeTree.map((node) => {
                const tm = masteries[node.name];
                const score = node.mastery;
                const tone = score >= 75 ? 'lime' : score >= 50 ? 'amber' : 'rose';
                return (
                  <div
                    key={node.id}
                    className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 bg-[#F7F5EF] dark:bg-[#16263D] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-teal-700 dark:text-teal-400 font-bold text-xs flex items-center justify-center font-mono tabular-nums">
                          {node.level}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{node.name}</h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {tm ? `${tm.attemptsCount} quiz attempts · ${tm.accuracy}% accuracy` : 'No quiz attempts logged'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-28 hidden sm:block">
                          <ProgressMeter value={score} tone={tone} label={`${node.name} mastery`} />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {score}%
                        </span>
                        <Link
                          to={`/explain?topic=${encodeURIComponent(node.name)}`}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-lg transition-colors"
                        >
                          Explain
                        </Link>
                        <Link
                          to={`/quiz?topic=${encodeURIComponent(node.name)}`}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-colors"
                        >
                          Drill
                        </Link>
                      </div>
                    </div>

                    {node.subtopics && node.subtopics.length > 0 && (
                      <div className="pl-4 sm:pl-6 space-y-1.5 pt-1">
                        {node.subtopics.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {sub.name}
                              </span>
                            </div>
                            <StatusIndicator
                              label={`${sub.mastery}%`}
                              tone={sub.mastery >= 75 ? 'lime' : sub.mastery >= 50 ? 'amber' : 'rose'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title="No topics mapped yet"
              description="Generate a study plan or complete a practice quiz to populate your topic mastery hierarchy."
              action={
                <Link
                  to="/planner"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl"
                >
                  Create Study Plan
                </Link>
              }
            />
          )}
        </StudioPanel>
      )}

      {/* TAB 3: MISTAKES NOTEBOOK */}
      {activeTab === 'mistakes' && (
        <StudioPanel className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                <span>Mistakes & Misconceptions Notebook</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Incorrect quiz questions are tracked with mistake category, confidence, and resolution status
              </p>
            </div>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterResolved}
                onChange={(e) => setFilterResolved(e.target.checked)}
                className="rounded border-[#E5E1D6] dark:border-[#1E2F47] text-teal-700 focus:ring-teal-600"
              />
              <span>Show Resolved ({mistakes.filter((m) => m.resolved).length})</span>
            </label>
          </div>

          {displayedMistakes.length > 0 ? (
            <div className="space-y-4">
              {displayedMistakes.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-xl border transition-colors ${
                    m.resolved
                      ? 'bg-[#F7F5EF] dark:bg-[#0B1626] border-[#E5E1D6] dark:border-[#1E2F47] opacity-75'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{m.topic}</span>
                      <span aria-hidden="true" className="text-slate-400">&middot;</span>
                      <StatusIndicator label={`${m.mistakeCategory} mistake`} tone="rose" />
                      {m.confidence === 'High' && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">&middot;</span>
                          <StatusIndicator label="High confidence misconception" tone="amber" />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </span>
                      {!m.resolved ? (
                        <button
                          type="button"
                          onClick={() => handleResolveMistake(m.id, m.topic)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                          <span>Mark Resolved</span>
                        </button>
                      ) : (
                        <StatusIndicator label="Resolved" tone="lime" />
                      )}
                    </div>
                  </div>

                  <div className="pt-3 space-y-3 text-xs sm:text-sm">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{m.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200">
                        <strong className="block text-rose-800 dark:text-rose-300 mb-0.5 font-semibold">
                          Your Selected Answer
                        </strong>
                        {m.selectedAnswer}
                      </div>
                      <div className="p-3 rounded-lg bg-lime-50/70 dark:bg-lime-950/25 border border-lime-200 dark:border-lime-900/50 text-lime-950 dark:text-lime-200">
                        <strong className="block text-lime-800 dark:text-lime-300 mb-0.5 font-semibold">
                          Correct Answer
                        </strong>
                        {m.correctAnswer}
                      </div>
                    </div>

                    {m.explanation && (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">Explanation</strong>
                        {m.explanation}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-end gap-3">
                      <Link
                        to={`/explain?topic=${encodeURIComponent(m.topic)}`}
                        className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        Review in AI Explainer <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No active mistakes in your review notebook"
              description="Incorrect quiz questions automatically flow here for deliberate reflection and remediation."
            />
          )}
        </StudioPanel>
      )}

      {/* TAB 4: SPACED REPETITION QUEUE */}
      {activeTab === 'spaced' && (
        <StudioPanel className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <span>Spaced Retrieval Queue</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Leitner review intervals (1, 3, 7, 14, 30 days) scheduled to prevent forgetting decay
              </p>
            </div>

            <StatusIndicator
              label={`${dueReviewCount} item${dueReviewCount === 1 ? '' : 's'} due`}
              tone={dueReviewCount > 0 ? 'amber' : 'lime'}
            />
          </div>

          {spacedReviews.length > 0 ? (
            <div className="space-y-3">
              {spacedReviews.map((item) => {
                const isDue = item.dueStatus === 'due' || item.dueStatus === 'overdue';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDue
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                        : 'bg-[#F7F5EF] dark:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.concept}
                        </span>
                        <StatusIndicator
                          label={isDue ? 'Due now' : 'Scheduled'}
                          tone={isDue ? 'amber' : 'neutral'}
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.reason}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono tabular-nums">
                        <span>Interval: {item.intervalDays}d</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>Box {item.reviewCount + 1}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>Next review: {item.nextReviewAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        to={`/quiz?topic=${encodeURIComponent(item.topic)}`}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Practice Drill
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleCompleteReview(item.id, item.concept)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                        <span>Complete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<RotateCcw className="w-5 h-5" />}
              title="Your spaced retrieval queue is clear"
              description="As you complete practice quizzes and identify concepts for review, they are scheduled into your Leitner queue."
            />
          )}
        </StudioPanel>
      )}
    </div>
  );
};
