import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import { Quiz, QuizQuestion, ConfidenceLevel, QuizAnswerResponse } from '../../types';
import { ApiClient } from '../../services/api/apiClient';
import { ProgressMeter, StatusIndicator } from '../ui/Common';

interface QuizRunnerProps {
  quiz: Quiz;
  onSubmit: (
    userAnswers: { [questionId: string]: string },
    confidenceMap?: { [questionId: string]: ConfidenceLevel }
  ) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  quiz,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string }>({});
  const [confidenceMap, setConfidenceMap] = useState<{ [questionId: string]: ConfidenceLevel }>({});
  const [checkedFeedback, setCheckedFeedback] = useState<{ [questionId: string]: QuizAnswerResponse }>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQ: QuizQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentIdx === totalQuestions - 1;

  // Keyboard navigation: 1-4 selects option, ArrowLeft / ArrowRight moves between questions
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' && currentIdx < totalQuestions - 1) {
        setCurrentIdx((i) => i + 1);
        setValidationError(null);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((i) => i - 1);
        setValidationError(null);
      } else {
        const num = Number(e.key);
        if (num >= 1 && num <= currentQ.options.length && !checkedFeedback[currentQ.id]) {
          handleSelectOption(currentQ.options[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentQ, checkedFeedback]);

  const handleSelectOption = (option: string) => {
    if (checkedFeedback[currentQ.id]) return; // Locked once individually checked
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
    if (!confidenceMap[currentQ.id]) {
      setConfidenceMap((prev) => ({
        ...prev,
        [currentQ.id]: 'Medium',
      }));
    }
    setValidationError(null);
  };

  const handleCheckAnswer = async () => {
    const selected = userAnswers[currentQ.id];
    if (!selected) {
      setValidationError('Select an answer before checking.');
      return;
    }

    setCheckingId(currentQ.id);
    setValidationError(null);
    try {
      const res = await ApiClient.answerQuizQuestion({
        quizId: quiz.id,
        questionId: currentQ.id,
        selectedAnswer: selected,
        sessionToken: quiz.sessionToken,
      });
      setCheckedFeedback((prev) => ({
        ...prev,
        [currentQ.id]: res,
      }));
    } catch (err: any) {
      setValidationError(err?.message || 'Could not verify answer right now. You can still submit the quiz.');
    } finally {
      setCheckingId(null);
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setValidationError(null);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setValidationError(null);
    }
  };

  const handleSubmitAll = () => {
    const unanswered = quiz.questions.filter((q) => !userAnswers[q.id]);
    if (unanswered.length > 0) {
      const firstUnansweredIdx = quiz.questions.findIndex((q) => !userAnswers[q.id]);
      if (firstUnansweredIdx !== -1) setCurrentIdx(firstUnansweredIdx);
      setValidationError(
        `Please answer all questions before submitting (${unanswered.length} remaining).`
      );
      return;
    }
    onSubmit(userAnswers, confidenceMap);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const currentCheck = checkedFeedback[currentQ.id];

  return (
    <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {quiz.subject}
            </span>
            <StatusIndicator label={`${quiz.difficulty} Level`} tone="neutral" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {quiz.topic}
          </h2>
        </div>

        <div className="w-full sm:w-44 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              Q{currentIdx + 1}/{totalQuestions}
            </span>
            <span>
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <ProgressMeter value={answeredCount} max={totalQuestions} tone="teal" />
        </div>
      </div>

      {/* Question Step Navigator */}
      <div className="flex items-center gap-1.5 flex-wrap" aria-label="Question navigator">
        {quiz.questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const isAnswered = !!userAnswers[q.id];
          const checked = checkedFeedback[q.id];

          let btnStyle =
            'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-600 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47]';
          if (checked) {
            btnStyle = checked.isCorrect
              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-400'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-400';
          } else if (isAnswered) {
            btnStyle =
              'bg-teal-600/15 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200 border-teal-500/40';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setCurrentIdx(idx);
                setValidationError(null);
              }}
              aria-current={isCurrent ? 'step' : undefined}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer tabular-nums ${btnStyle} ${
                isCurrent ? 'ring-2 ring-teal-500 dark:ring-teal-400' : ''
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {validationError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Current Question */}
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#0A1628] dark:bg-teal-600/25 text-white dark:text-teal-200 font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            {currentIdx + 1}
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options List */}
        <fieldset className="space-y-2.5">
          <legend className="sr-only">Answer options for question {currentIdx + 1}</legend>
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userAnswers[currentQ.id] === option;
            const letter = String.fromCharCode(65 + optIdx);
            const isCorrectOpt = currentCheck?.correctAnswer === option;
            const isWrongSelected = currentCheck && isSelected && !currentCheck.isCorrect;

            let cardStyle =
              'bg-[#F7F5EF]/50 dark:bg-[#16263D]/60 border-[#E5E1D6] dark:border-[#1E2F47] text-slate-800 dark:text-slate-200 hover:border-teal-500/60';
            if (currentCheck) {
              if (isCorrectOpt) {
                cardStyle =
                  'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100';
              } else if (isWrongSelected) {
                cardStyle =
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100';
              }
            } else if (isSelected) {
              cardStyle =
                'bg-teal-50/80 dark:bg-teal-950/40 border-teal-600 dark:border-teal-400 text-slate-950 dark:text-white ring-1 ring-teal-600 dark:ring-teal-400';
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(option)}
                disabled={!!currentCheck}
                className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer disabled:cursor-default ${cardStyle}`}
                aria-pressed={isSelected}
              >
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white'
                      : 'bg-white dark:bg-[#0F1D32] text-slate-600 dark:text-slate-300 border border-[#E5E1D6] dark:border-[#1E2F47]'
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {currentCheck ? (
                  isCorrectOpt ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  ) : isWrongSelected ? (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : null
                ) : (
                  isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                )}
              </button>
            );
          })}
        </fieldset>

        {/* Instant Check Explanation Box */}
        {currentCheck && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm space-y-1 ${
              currentCheck.isCorrect
                ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60 text-slate-800 dark:text-slate-200'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-slate-800 dark:text-slate-200'
            }`}
          >
            <p className="font-bold">
              {currentCheck.isCorrect
                ? 'Correct!'
                : `Incorrect — Correct Answer: ${currentCheck.correctAnswer}`}
            </p>
            <p className="leading-relaxed opacity-90">{currentCheck.explanation}</p>
          </div>
        )}

        {/* Metacognitive Confidence Selector */}
        <div className="p-4 bg-[#F7F5EF] dark:bg-[#16263D] rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Confidence Check</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Calibrates mastery score
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['Low', 'Medium', 'High'] as const).map((level) => {
              const currentLevel = confidenceMap[currentQ.id] || 'Medium';
              const isSelected = currentLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidenceMap((prev) => ({ ...prev, [currentQ.id]: level }))}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A1628] dark:bg-teal-600 text-white border-transparent'
                      : 'bg-white dark:bg-[#0F1D32] text-slate-600 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47] hover:border-teal-500/50'
                  }`}
                >
                  {level === 'Low' && 'Low (Unsure)'}
                  {level === 'Medium' && 'Medium (Fair)'}
                  {level === 'High' && 'High (Certain)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-4 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] rounded-xl flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Exit
          </button>
        </div>

        <div className="flex items-center gap-2">
          {userAnswers[currentQ.id] && !currentCheck && (
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={checkingId === currentQ.id}
              className="px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{checkingId === currentQ.id ? 'Checking...' : 'Check Answer'}</span>
            </button>
          )}

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scoring...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit &amp; Score</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
