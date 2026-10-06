import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { Badge } from '../components/ui/Common';
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

  const [activeTab, setActiveTab] = useState<'overview' | 'mastery' | 'mistakes' | 'spaced'>('overview');
  const [filterResolved, setFilterResolved] = useState(false);

  const totalTasks = activePlan?.tasks.length || progress.totalTasksCount || 1;
  const completedTasks = activePlan?.tasks.filter((t) => t.status === 'completed').length || progress.completedTasksCount || 0;
  const syllabusPercent = Math.round((completedTasks / totalTasks) * 100);

  // Compute rich weak areas and knowledge tree
  const weakAreas = MasteryEngine.detectWeakAreas(masteries, mistakes);
  const knowledgeTree = MasteryEngine.buildKnowledgeTree(activePlan, masteries);

  const displayedMistakes = mistakes.filter((m) => (filterResolved ? true : !m.resolved));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2DDD2] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B747A] font-mono">
            ACADEMIC ANALYTICS &bull; STUDY INTELLIGENCE
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1720] tracking-tight">
            Learning Progress & Mastery
          </h1>
          <p className="text-xs sm:text-sm text-[#6B747A] mt-1">
            Real-time tracking of topic mastery scores, mistake patterns, and spaced retrieval intervals
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mastery')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'mastery'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Knowledge Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mistakes')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'mistakes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mistakes
            {mistakes.filter((m) => !m.resolved).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {mistakes.filter((m) => !m.resolved).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spaced')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'spaced'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Spaced Queue
            {spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>STUDY STREAK</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{progress.streakDays} Days</div>
          <p className="text-[11px] text-slate-500">Consecutive days active</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TOTAL HOURS</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{progress.totalHoursStudied}h</div>
          <p className="text-[11px] text-slate-500">Dedicated focus time</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SYLLABUS PROGRESS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{syllabusPercent}%</div>
          <p className="text-[11px] text-slate-500">{completedTasks} of {totalTasks} tasks done</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AVERAGE QUIZ SCORE</span>
            <Award className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{progress.averageQuizScore}%</div>
          <p className="text-[11px] text-slate-500">Across {progress.quizzesTaken} assessments</p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Syllabus Breakdown & Weak Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Syllabus Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Active Syllabus Completion
                </h2>
                <span className="text-xs font-semibold text-indigo-600">{syllabusPercent}% Complete</span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${syllabusPercent}%` }}
                />
              </div>

              {activePlan ? (
                <div className="space-y-2 pt-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-600 font-medium pb-1 border-b border-slate-100">
                    <span>Subject: {activePlan.subject}</span>
                    <span>Exam: {activePlan.examDate}</span>
                  </div>

                  <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto">
                    {activePlan.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              task.status === 'completed'
                                ? 'bg-emerald-500'
                                : task.status === 'missed'
                                ? 'bg-rose-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className={`truncate font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.topic}: {task.subtopic}
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono flex-shrink-0 ml-2">{task.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active plan configured yet.</p>
              )}
            </div>

            {/* Weak Topics Detection Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    Prioritized Weak Areas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculated from accuracy, mistake counts, and exam urgency
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                  {weakAreas.length} Needs Review
                </span>
              </div>

              {weakAreas.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {weakAreas.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2"
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
                        <div className="flex items-center gap-2">
                          <Badge variant={item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'default'} size="sm">
                            {item.priority} Priority
                          </Badge>
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.mastery}% Mastery
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                        <span className="text-[11px] text-slate-500 truncate mr-2">
                          {item.recommendedAction}
                        </span>
                        <Link
                          to={item.actionRoute}
                          className="font-bold text-[#1A5C7A] hover:text-[#207297] flex items-center gap-0.5 whitespace-nowrap"
                        >
                          Remediate &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  No weak topics flagged! Your current topic masteries are above baseline thresholds.
                </p>
              )}
            </div>
          </div>

          {/* Quiz Performance Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Recent Practice Quiz Performance
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Score breakdown and diagnostic takeaways
                </p>
              </div>
              <Link
                to="/quiz"
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
              >
                Take New Quiz <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {quizHistory.length > 0 ? (
              <div className="space-y-3">
                {quizHistory.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{q.topic}</h3>
                        <Badge variant={q.percentage >= 70 ? 'success' : 'danger'} size="sm">
                          {q.percentage}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {q.subject} &bull; {q.difficulty} &bull; {new Date(q.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-800">{q.score} / {q.totalQuestions} Correct</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No quizzes completed yet. Test yourself on any topic in the AI Quiz section!
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE MAP (Hierarchical Topic Mastery) */}
      {activeTab === 'mastery' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Knowledge Map Hierarchy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic topic mastery scores computed from quiz accuracy, recency trend, study time, and confidence ratings
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                &ge;75% Mastered
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                50-74% Practice
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                &lt;50% Weak
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {knowledgeTree.map((node) => {
              const tm = masteries[node.name];
              const score = node.mastery;
              return (
                <div
                  key={node.id}
                  className="rounded-2xl border border-slate-200 p-5 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center font-mono">
                        {node.level}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{node.name}</h3>
                        <span className="text-[11px] text-slate-500">
                          {tm ? `${tm.attemptsCount} quiz attempts &bull; ${tm.accuracy}% accuracy` : 'No attempts logged'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 hidden sm:block h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {score}%
                      </span>
                      <Link
                        to={`/quiz?topic=${encodeURIComponent(node.name)}`}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                      >
                        Drill &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Subtopics Tree Branches */}
                  {node.subtopics && node.subtopics.length > 0 && (
                    <div className="pl-6 space-y-1.5 border-l-2 border-indigo-200 ml-3.5 pt-1">
                      {node.subtopics.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-800">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                sub.mastery >= 75
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : sub.mastery >= 50
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {sub.mastery}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MISTAKES & MISCONCEPTIONS NOTEBOOK */}
      {activeTab === 'mistakes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Mistakes & Misconceptions Notebook
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every quiz mistake is tracked with category tags, confidence levels, and resolution status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterResolved}
                  onChange={(e) => setFilterResolved(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show Resolved ({mistakes.filter((m) => m.resolved).length})
              </label>
            </div>
          </div>

          {displayedMistakes.length > 0 ? (
            <div className="space-y-4">
              {displayedMistakes.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    m.resolved
                      ? 'bg-slate-50/60 border-slate-200 opacity-70'
                      : 'bg-white border-rose-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{m.topic}</span>
                      <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        {m.mistakeCategory} Mistake
                      </span>
                      {m.confidence === 'High' && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          High Conf Misconception
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </span>
                      {!m.resolved ? (
                        <button
                          type="button"
                          onClick={() => resolveMistake(m.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 space-y-2 text-xs sm:text-sm">
                    <p className="font-semibold text-slate-900">{m.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-950">
                        <strong className="block text-rose-800 mb-0.5 font-bold">Your Selected Answer:</strong>
                        {m.selectedAnswer}
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                        <strong className="block text-emerald-800 mb-0.5 font-bold">Correct Answer:</strong>
                        {m.correctAnswer}
                      </div>
                    </div>

                    {m.explanation && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2">
                        <strong className="text-slate-900 block mb-0.5">Explanation:</strong>
                        {m.explanation}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Link
                        to={`/explain?topic=${encodeURIComponent(m.topic)}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Review Topic Breakdown &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-slate-700">No active mistakes in your review notebook!</p>
              <p className="text-slate-400">
                Incorrect quiz questions automatically flow here for deliberate reflection and remediation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SPACED REPETITION QUEUE */}
      {activeTab === 'spaced' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                Spaced Retrieval Queue (Leitner Schedule)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Algorithms schedule review intervals (1, 3, 7, 14, 30 days) to prevent forgetting curve decay
              </p>
            </div>

            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length} Items Due
            </span>
          </div>

          {spacedReviews.length > 0 ? (
            <div className="space-y-3">
              {spacedReviews.map((item) => {
                const isDue = item.dueStatus === 'due' || item.dueStatus === 'overdue';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isDue
                        ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.concept}</span>
                        <Badge variant={isDue ? 'warning' : 'default'} size="sm">
                          {isDue ? 'DUE NOW' : 'Scheduled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{item.reason}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 font-mono">
                        <span>Interval: {item.intervalDays}d</span>
                        <span>Level: Box {item.reviewCount + 1}</span>
                        <span>Target Date: {item.nextReviewAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/quiz?topic=${encodeURIComponent(item.topic)}`}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                      >
                        Practice Drill
                      </Link>
                      <button
                        type="button"
                        onClick={() => completeSpacedReview(item.id, 'good')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-slate-700">Your spaced retrieval queue is clear!</p>
              <p className="text-slate-400">
                As you complete practice quizzes and identify difficult questions, concepts will be placed into the Leitner schedule.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
