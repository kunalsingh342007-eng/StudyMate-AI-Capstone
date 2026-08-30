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
import { Quiz, QuizResult, StudyLevel } from '../types';
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

  const handleQuizSubmit = (userAnswers: { [questionId: string]: string }) => {
    if (!currentQuiz) return;

    let score = 0;
    const total = currentQuiz.questions.length;

    currentQuiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const percentage = Math.round((score / total) * 100);

    let recommendation = '';
    if (percentage === 100) {
      recommendation = `Flawless score! You have solid mastery of ${currentQuiz.topic}. Try advancing to ${currentQuiz.difficulty === 'Advanced' ? 'higher-level competitive problems' : 'Advanced difficulty'}.`;
    } else if (percentage >= 75) {
      recommendation = `Strong conceptual foundation! Review the explanations for your missed questions and attempt a 5-minute active recall recap.`;
    } else if (percentage >= 50) {
      recommendation = `Good effort. We detected knowledge gaps in ${currentQuiz.topic}. Use the Explain Topic module to review step-by-step mechanisms and analogies before retaking.`;
    } else {
      recommendation = `Foundational revision recommended. Study the full topic breakdown in the Explainer module, focus on common mistakes, and retry in 24 hours.`;
    }

    const result: QuizResult = {
      id: `result-${Date.now()}`,
      quizId: currentQuiz.id,
      subject: currentQuiz.subject,
      topic: currentQuiz.topic,
      difficulty: currentQuiz.difficulty,
      score,
      totalQuestions: total,
      percentage,
      userAnswers,
      completedAt: new Date().toISOString(),
      improvementRecommendation: recommendation,
    };

    saveQuizResult(result);
    setCurrentResult(result);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD2] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B747A] font-mono">
            ACTIVE RECALL PRACTICE
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1720] tracking-tight">
            Practice Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B747A] mt-1">
            Rigorous multiple-choice questions with answer shielding, diagnostics, and deep explanations
          </p>
        </div>

        {quizHistory.length > 0 && !currentQuiz && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0B1720] bg-white border border-[#E2DDD2] hover:bg-slate-50 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <History className="w-4 h-4 text-[#1A5C7A]" />
            {showHistory ? 'Configure New Quiz' : `Quiz History (${quizHistory.length})`}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateQuiz()}
            className="text-xs font-semibold text-rose-800 underline hover:text-rose-950"
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
        />
      ) : showHistory ? (
        /* Quiz History Table */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Quiz Performance</h2>
          <div className="space-y-3">
            {quizHistory.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{q.topic}</span>
                    <Badge variant={q.percentage >= 70 ? 'success' : 'danger'} size="sm">
                      {q.percentage}%
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {q.subject} &bull; {q.difficulty} &bull; {new Date(q.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600">
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
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
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
                placeholder="e.g. Computer Science, Economics"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
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
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
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
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
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
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
              >
                <option value={3}>3 Questions (Quick check)</option>
                <option value={4}>4 Questions (Standard practice)</option>
                <option value={6}>6 Questions (Deep review)</option>
                <option value={8}>8 Questions (Full module exam)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Answer key is strictly shielded during active quiz
            </span>
            <button
              id="generate-quiz-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
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
