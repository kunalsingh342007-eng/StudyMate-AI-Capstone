import React from 'react';
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
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { Badge } from '../components/ui/Common';

export const ProgressPage: React.FC = () => {
  const { progress, activePlan, quizHistory } = useStorage();

  const totalTasks = activePlan?.tasks.length || progress.totalTasksCount || 1;
  const completedTasks = activePlan?.tasks.filter((t) => t.status === 'completed').length || progress.completedTasksCount || 0;
  const syllabusPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2DDD2] pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B747A] font-mono">
          ACADEMIC ANALYTICS
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1720] tracking-tight">
          Learning Progress
        </h1>
        <p className="text-xs sm:text-sm text-[#6B747A] mt-1">
          Real-time tracking of your study momentum, knowledge retention, and syllabus coverage
        </p>
      </div>

      {/* Top Overview Cards */}
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

              <div className="space-y-1.5 pt-1">
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

        {/* Knowledge Mastery & Weak Areas Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              Focus Areas vs Mastered Topics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuously updated from your quiz results and task completion.
            </p>
          </div>

          {/* Weak Topics */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              Needs Reinforcement ({progress.weakTopicsIdentified.length})
            </span>
            {progress.weakTopicsIdentified.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {progress.weakTopicsIdentified.map((topic, i) => (
                  <Link
                    key={i}
                    to={`/explain?topic=${encodeURIComponent(topic)}`}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    <span>{topic}</span>
                    <ArrowRight className="w-3 h-3 text-rose-600" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No weak topics currently flagged.</p>
            )}
          </div>

          {/* Mastered Topics */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Mastered Topics ({progress.masteredTopics.length})
            </span>
            {progress.masteredTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {progress.masteredTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Score &ge; 85% on practice quizzes to unlock mastered badges.
              </p>
            )}
          </div>
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
  );
};
