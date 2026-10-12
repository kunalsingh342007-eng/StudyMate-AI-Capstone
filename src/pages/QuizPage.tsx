import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Sparkles,
  Award,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { ApiClient } from '../services/api/apiClient';
import { useStorage } from '../hooks/useStorage';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { QuizResultView } from '../components/quiz/QuizResultView';
import { Banner } from '../components/layout/Banner';
import { Quiz, QuizResult, StudyLevel, ConfidenceLevel } from '../types';
import { Badge } from '../components/ui/Common';

export const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const { quizHistory, saveQuizResult, activePlan } = useStorage();

  const [subject, setSubject] = useState(activePlan?.subject || 'Computer Science');
  const [topic, setTopic] = useState(initialTopic || 'Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState<StudyLevel>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(4);

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

    try {
      const quiz = await ApiClient.generateQuiz({
        subject: subject.trim(),
        topic: topic.trim(),
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <Banner isDemoData={currentQuiz?.isDemoFallback} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
            ACTIVE RECALL PRACTICE &bull; DIAGNOSTIC TEST
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
            Practice Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rigorous multiple-choice questions with answer shielding, diagnostics, and deep explanations
          </p>
        </div>

        {quizHistory.length > 0 && !currentQuiz && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-purple-600" />
            {showHistory ? 'Configure New Quiz' : `Quiz History (${quizHistory.length})`}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateQuiz()}
            className="text-xs font-semibold text-rose-800 underline hover:text-rose-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Render State: 1. Setup Form, 2. Runner, 3. Result View */}
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
        /* Quiz History Table */
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#1E1B4B]">Recent Quiz Performance</h2>
          <div className="space-y-3">
            {quizHistory.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-3 hover:border-purple-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1E1B4B]">{q.topic}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        q.percentage >= 70
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {q.percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {q.subject} &bull; {q.difficulty} &bull; {new Date(q.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {q.score} / {q.totalQuestions} Correct
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Quiz Generation Form */
        <form
          onSubmit={handleGenerateQuiz}
          className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-5"
        >
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1E1B4B]">
              Customize Practice Assessment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates rigorous questions with distractor analysis and detailed explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="quiz-subject" className="block text-xs font-semibold text-slate-900">
                Subject
              </label>
              <input
                id="quiz-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Operating Systems"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
              />
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <label htmlFor="quiz-topic" className="block text-xs font-semibold text-slate-900">
                Topic <span className="text-rose-500">*</span>
              </label>
              <input
                id="quiz-topic"
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Search Trees, Dynamic Programming"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label htmlFor="quiz-diff" className="block text-xs font-semibold text-slate-900">
                Difficulty Level
              </label>
              <select
                id="quiz-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as StudyLevel)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              >
                <option value="Beginner">Beginner (Foundational definitions & rules)</option>
                <option value="Intermediate">Intermediate (Application & problem analysis)</option>
                <option value="Advanced">Advanced (Complex derivations & edge cases)</option>
              </select>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label htmlFor="quiz-count" className="block text-xs font-semibold text-slate-900">
                Number of Questions
              </label>
              <select
                id="quiz-count"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              >
                <option value={3}>3 Questions (Quick check)</option>
                <option value={4}>4 Questions (Standard practice)</option>
                <option value={6}>6 Questions (Deep review)</option>
                <option value={8}>8 Questions (Full module exam)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Answer key is strictly shielded during active quiz
            </span>
            <button
              id="generate-quiz-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Practice Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start AI Practice Quiz
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
