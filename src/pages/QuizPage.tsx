import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, History, AlertCircle } from 'lucide-react';
import { ApiClient } from '../services/api/apiClient';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResultView } from '../components/quiz/QuizResultView';
import { Banner } from '../components/layout/Banner';
import { Quiz, QuizResult, StudyLevel, ConfidenceLevel } from '../types';
import { PageHeader, StatusIndicator } from '../components/ui/Common';

export const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const { quizHistory, saveQuizResult, activePlan, userProfile } = useStorage();
  const { preferences } = useAuth();
  const { showToast } = useToast();

  const [subject, setSubject] = useState(
    activePlan?.subject || userProfile.subjects?.[0] || ''
  );
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<StudyLevel>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(4);

  const userSuggestedTopics = Array.from(
    new Set([
      ...(activePlan?.topics || []),
      ...(userProfile.weakTopics || []),
    ].filter(Boolean))
  ).slice(0, 6);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerateQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic for the quiz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentResult(null);

    const langSuffix =
      preferences.interfaceLanguage && preferences.interfaceLanguage !== 'English'
        ? ` (in ${preferences.interfaceLanguage})`
        : '';

    try {
      const quiz = await ApiClient.generateQuiz({
        subject: `${subject.trim()}${langSuffix}`,
        topic: `${topic.trim()}${langSuffix}`,
        difficulty,
        questionCount,
      });
      setCurrentQuiz(quiz);
    } catch (err: any) {
      setError(err.message || 'We could not generate your quiz right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = async (
    userAnswers: { [questionId: string]: string },
    confidenceMap?: { [questionId: string]: ConfidenceLevel }
  ) => {
    if (!currentQuiz) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const serverResult = await ApiClient.submitQuiz({
        quizId: currentQuiz.id,
        userAnswers,
        confidenceMap,
        sessionToken: currentQuiz.sessionToken,
      });

      const result: QuizResult = {
        id: `result-${Date.now()}`,
        quizId: serverResult.quizId,
        subject: serverResult.subject,
        topic: serverResult.topic,
        difficulty: serverResult.difficulty,
        score: serverResult.score,
        totalQuestions: serverResult.totalQuestions,
        percentage: serverResult.percentage,
        userAnswers: serverResult.userAnswers,
        completedAt: serverResult.completedAt,
        improvementRecommendation: serverResult.improvementRecommendation,
        reviewQuestions: serverResult.reviewQuestions,
        confidenceMap,
        confidenceInsights: serverResult.confidenceInsights,
      };

      saveQuizResult(result);
      setCurrentResult(result);
      showToast({
        variant: result.percentage >= 70 ? 'success' : 'info',
        title: `Quiz scored: ${result.percentage}%`,
        description: `${result.score}/${result.totalQuestions} correct · Mastery updated.`,
      });
    } catch (err: any) {
      setError(err?.message || 'We could not score your quiz right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setCurrentResult(null);
  };

  const handleNewQuiz = () => {
    setCurrentQuiz(null);
    setCurrentResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <Banner isDemoData={currentQuiz?.isDemoFallback} />

      <PageHeader
        eyebrow="Active Recall Studio"
        title="Practice Quizzes"
        description="Test recall with server-verified questions, confidence calibration, instant checks, and AI mistake diagnostics."
        actions={
          quizHistory.length > 0 && !currentQuiz ? (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{showHistory ? 'New Quiz' : `History (${quizHistory.length})`}</span>
            </button>
          ) : undefined
        }
      />

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateQuiz()}
            className="text-xs font-semibold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {currentResult && currentQuiz ? (
        <QuizResultView
          quiz={currentQuiz}
          result={currentResult}
          onRetake={handleRetake}
          onNewQuiz={handleNewQuiz}
        />
      ) : currentQuiz ? (
        <QuizRunner
          quiz={currentQuiz}
          onSubmit={handleQuizSubmit}
          onCancel={handleNewQuiz}
          isSubmitting={isSubmitting}
        />
      ) : showHistory ? (
        <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Recent Quiz History
          </h2>
          <div className="space-y-2.5">
            {quizHistory.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 border border-[#E5E1D6] dark:border-[#1E2F47] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {q.topic}
                    </span>
                    <StatusIndicator
                      label={`${q.percentage}%`}
                      tone={q.percentage >= 70 ? 'lime' : 'rose'}
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {q.subject} &middot; {q.difficulty} &middot;{' '}
                    {new Date(q.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {q.score} / {q.totalQuestions} correct
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleGenerateQuiz}
          className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 space-y-5"
        >
          <div className="border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Configure Practice Session
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose subject, concept focus, and difficulty to generate a server-shielded assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="quiz-subject"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Subject
              </label>
              <input
                id="quiz-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Operating Systems"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-topic"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Topic <span className="text-rose-500">*</span>
              </label>
              <input
                id="quiz-topic"
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter any topic you want to test yourself on..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>

            {userSuggestedTopics.length > 0 && (
              <div className="sm:col-span-2 space-y-1.5">
                <span className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Pick From Your Plan &amp; Weak Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {userSuggestedTopics.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTopic(item)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        topic === item
                          ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600 dark:border-teal-600'
                          : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-200 border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-diff"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Difficulty Level
              </label>
              <select
                id="quiz-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as StudyLevel)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              >
                <option value="Beginner">Beginner (Foundational concepts)</option>
                <option value="Intermediate">Intermediate (Application &amp; analysis)</option>
                <option value="Advanced">Advanced (Edge cases &amp; derivations)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-count"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Number of Questions
              </label>
              <select
                id="quiz-count"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              >
                <option value={3}>3 Questions (Quick check)</option>
                <option value={4}>4 Questions (Standard practice)</option>
                <option value={6}>6 Questions (Deep review)</option>
                <option value={8}>8 Questions (Module exam)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Answer keys remain server-shielded until checked or submitted
            </span>
            <button
              id="generate-quiz-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
