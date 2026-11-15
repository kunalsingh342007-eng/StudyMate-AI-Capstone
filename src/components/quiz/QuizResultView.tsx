import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Award,
  BookOpen,
  ChevronUp,
} from 'lucide-react';
import { Quiz, QuizResult, MistakeExplanation } from '../../types';
import { StatusIndicator } from '../ui/Common';
import { ApiClient } from '../../services/api/apiClient';
import { StorageService } from '../../services/storage/storageService';
import { useAuth } from '../../context/AuthContext';

interface QuizResultViewProps {
  quiz: Quiz;
  result: QuizResult;
  onRetake: () => void;
  onNewQuiz: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  result,
  onRetake,
  onNewQuiz,
}) => {
  const { preferences } = useAuth();
  const [diagnosingQuestionId, setDiagnosingQuestionId] = useState<string | null>(null);
  const [mistakeExplanations, setMistakeExplanations] = useState<{ [qId: string]: MistakeExplanation }>({});
  const [revealedPracticeAnswers, setRevealedPracticeAnswers] = useState<{ [qId: string]: boolean }>({});
  const [diagnosisError, setDiagnosisError] = useState<{ [qId: string]: string }>({});

  useEffect(() => {
    const prefersReducedMotion =
      preferences.reducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    if (result.percentage >= 80 && !prefersReducedMotion) {
      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti errors in test environments
      }
    }
  }, [result.percentage, preferences.reducedMotion]);

  const handleDiagnoseMistake = async (q: any) => {
    if (mistakeExplanations[q.id]) {
      const copy = { ...mistakeExplanations };
      delete copy[q.id];
      setMistakeExplanations(copy);
      return;
    }

    setDiagnosingQuestionId(q.id);
    setDiagnosisError((prev) => ({ ...prev, [q.id]: '' }));

    try {
      const explanation = await ApiClient.explainMistake({
        topic: quiz.topic,
        question: q.question,
        selectedAnswer: q.selectedAnswer,
        correctAnswer: q.correctAnswer,
        difficulty: quiz.difficulty,
        confidence: q.confidence,
      });

      setMistakeExplanations((prev) => ({
        ...prev,
        [q.id]: explanation,
      }));

      const existingMistakes = StorageService.getMistakes();
      const match = existingMistakes.find(
        (m) => m.questionId === q.id || m.questionText === q.question
      );
      if (match) {
        StorageService.updateMistakeExplanation(match.id, explanation);
      }
    } catch (err: any) {
      setDiagnosisError((prev) => ({
        ...prev,
        [q.id]: err.message || 'Could not diagnose this mistake right now. Please try again.',
      }));
    } finally {
      setDiagnosingQuestionId(null);
    }
  };

  const isPassing = result.percentage >= 70;
  const confidenceInsights = result.confidenceInsights;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Score Summary Card */}
      <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47]">
          {result.percentage >= 80 ? (
            <Trophy className="w-7 h-7 text-amber-500" />
          ) : isPassing ? (
            <Award className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          ) : (
            <HelpCircle className="w-7 h-7 text-slate-500 dark:text-slate-400" />
          )}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Assessment Complete
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {quiz.subject} &middot; {quiz.topic} ({quiz.difficulty})
          </p>
        </div>

        {/* Big Score Box */}
        <div className="inline-flex flex-col items-center justify-center px-8 py-5 rounded-2xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47]">
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {result.percentage}%
          </div>
          <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
            {result.score} of {result.totalQuestions} correct
          </span>
        </div>

        {/* Confidence Calibration Bar */}
        {confidenceInsights && (
          <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>Metacognitive Calibration</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {confidenceInsights.overallAlignment}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs tabular-nums">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47]">
                <span className="block font-bold text-teal-700 dark:text-teal-300 text-sm">
                  {confidenceInsights.strongMasteryCount}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Strong Mastery</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47]">
                <span className="block font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {confidenceInsights.misconceptionsCount}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Misconceptions</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47]">
                <span className="block font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {confidenceInsights.unconfidentCount}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Low Confidence</span>
              </div>
            </div>
          </div>
        )}

        {/* Improvement Recommendation */}
        <div className="text-left p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-1">
          <span className="font-semibold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Recommended Next Step</span>
          </span>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5.5">
            {result.improvementRecommendation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onRetake}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>

          <Link
            to={`/explain?topic=${encodeURIComponent(quiz.topic)}`}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-950/60 rounded-xl flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Review in AI Explainer</span>
          </Link>

          <button
            type="button"
            onClick={onNewQuiz}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>New Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Detailed Answer Breakdown
        </h3>

        {((result.reviewQuestions && result.reviewQuestions.length > 0)
          ? result.reviewQuestions
          : quiz.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              selectedAnswer: result.userAnswers[q.id] || '',
              isCorrect: false,
              correctAnswer: '',
              explanation: 'Explanations are verified by the server upon submission.',
            }))
        ).map((q: any, idx: number) => {
          const userAnswer = q.selectedAnswer;
          const isCorrect = q.isCorrect;
          const isDiagnosing = diagnosingQuestionId === q.id;
          const mistakeExp = mistakeExplanations[q.id];

          return (
            <div
              key={q.id}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span
                    className={`w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                      isCorrect
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {q.question}
                    </h4>
                    {q.alignment && (
                      <div className="mt-1">
                        <StatusIndicator
                          label={q.alignment}
                          tone={
                            q.alignment === 'Strong Mastery'
                              ? 'lime'
                              : q.alignment === 'Misconception'
                              ? 'rose'
                              : q.alignment === 'Lucky Guess'
                              ? 'teal'
                              : 'amber'
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <StatusIndicator
                  label={isCorrect ? 'Correct' : 'Incorrect'}
                  tone={isCorrect ? 'lime' : 'rose'}
                />
              </div>

              {/* Options Review */}
              <div className="space-y-1.5 pl-8 text-xs sm:text-sm">
                {q.options.map((opt: string, optIdx: number) => {
                  const isUserSelection = userAnswer === opt;
                  const isAnswer = q.correctAnswer === opt;

                  let optClass =
                    'bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 border-[#E5E1D6] dark:border-[#1E2F47] text-slate-600 dark:text-slate-300';
                  if (isAnswer) {
                    optClass =
                      'bg-teal-50 dark:bg-teal-950/40 border-teal-400/70 text-teal-950 dark:text-teal-100 font-semibold';
                  } else if (isUserSelection && !isCorrect) {
                    optClass =
                      'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 line-through';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-2 ${optClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs opacity-75">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswer && (
                        <span className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      )}
                      {isUserSelection && !isAnswer && (
                        <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ml-8 p-3 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">
                    Explanation
                  </strong>
                  {q.explanation}
                </div>
              )}

              {!isCorrect && (
                <div className="ml-8 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDiagnoseMistake(q)}
                    disabled={isDiagnosing}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1628] dark:bg-teal-600 hover:bg-[#16263D] dark:hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDiagnosing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Diagnosing Mistake...</span>
                      </>
                    ) : mistakeExp ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide AI Mistake Diagnosis</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                        <span>Diagnose Mistake with AI</span>
                      </>
                    )}
                  </button>

                  {diagnosisError[q.id] && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                      {diagnosisError[q.id]}
                    </p>
                  )}

                  {mistakeExp && (
                    <div className="mt-3 p-4 rounded-xl bg-[#0A1628] text-white border border-[#1E2F47] space-y-3 text-xs sm:text-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono font-bold text-teal-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Deep Mistake Diagnosis</span>
                        </span>
                      </div>

                      <div>
                        <strong className="text-teal-300 block text-xs uppercase tracking-wider">
                          1. Core Misunderstanding
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whatWasMisunderstood}</p>
                      </div>

                      <div>
                        <strong className="text-rose-300 block text-xs uppercase tracking-wider">
                          2. Why Selected Option Was Wrong
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whySelectedWasWrong}</p>
                      </div>

                      <div>
                        <strong className="text-lime-300 block text-xs uppercase tracking-wider">
                          3. Why The Correct Principle Holds
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whyCorrectWorks}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0F1D32] border border-[#1E2F47]">
                        <strong className="text-sky-300 block text-xs uppercase tracking-wider mb-0.5">
                          4. Intuitive Example
                        </strong>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {mistakeExp.simpleExample}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-teal-950/60 border border-teal-700/50">
                        <strong className="text-teal-300 block text-xs uppercase tracking-wider mb-0.5">
                          5. Key Revision Takeaway
                        </strong>
                        <p className="text-teal-100 font-medium text-xs">{mistakeExp.keyTakeaway}</p>
                      </div>

                      {mistakeExp.followUpQuestion && (
                        <div className="p-3 rounded-lg bg-[#0F1D32] border border-[#1E2F47] space-y-2">
                          <strong className="text-amber-300 block text-xs uppercase tracking-wider">
                            6. Follow-Up Drill
                          </strong>
                          <p className="text-white text-xs font-medium">
                            {mistakeExp.followUpQuestion.question}
                          </p>
                          <div className="space-y-1 pt-1">
                            {mistakeExp.followUpQuestion.options.map((opt, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-[#0A1628] border border-[#1E2F47] text-xs text-slate-300 flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                {revealedPracticeAnswers[q.id] &&
                                  opt === mistakeExp.followUpQuestion?.correctAnswer && (
                                    <span className="text-[11px] font-bold text-teal-400">
                                      Correct Answer
                                    </span>
                                  )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPracticeAnswers((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                            className="mt-1 text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                          >
                            {revealedPracticeAnswers[q.id]
                              ? 'Hide Answer'
                              : 'Reveal Answer & Explanation'}
                          </button>
                          {revealedPracticeAnswers[q.id] && (
                            <p className="text-xs text-slate-300 bg-[#0A1628] p-2 rounded border border-[#1E2F47]">
                              {mistakeExp.followUpQuestion.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
