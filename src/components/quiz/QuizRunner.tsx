import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Send, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { Quiz, QuizQuestion, ConfidenceLevel } from '../../types';
import { Badge } from '../ui/Common';

interface QuizRunnerProps {
  quiz: Quiz;
  onSubmit: (
    userAnswers: { [questionId: string]: string },
    confidenceMap?: { [questionId: string]: ConfidenceLevel }
  ) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quiz, onSubmit, onCancel, isSubmitting = false }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string }>({});
  const [confidenceMap, setConfidenceMap] = useState<{ [questionId: string]: ConfidenceLevel }>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQ: QuizQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentIdx === totalQuestions - 1;

  const handleSelectOption = (option: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
    // Default confidence to Medium if not already set
    if (!confidenceMap[currentQ.id]) {
      setConfidenceMap((prev) => ({
        ...prev,
        [currentQ.id]: 'Medium',
      }));
    }
    setValidationError(null);
  };

  const handleNext = () => {
    if (!userAnswers[currentQ.id]) {
      setValidationError('Please select an option to continue.');
      return;
    }
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
    // Verify all answered
    const unanswered = quiz.questions.filter((q) => !userAnswers[q.id]);
    if (unanswered.length > 0) {
      setValidationError(`Please answer all questions before submitting (${unanswered.length} remaining).`);
      return;
    }
    onSubmit(userAnswers, confidenceMap);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {quiz.subject}
            </Badge>
            <Badge variant="default" size="sm">
              {quiz.difficulty} Level
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{quiz.topic}</h2>
        </div>

        {/* Progress Pill */}
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500">
            Question {currentIdx + 1} of {totalQuestions}
          </span>
          <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {validationError && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Current Question */}
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-200">
            {currentIdx + 1}
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options List */}
        <fieldset className="space-y-2.5">
          <legend className="sr-only">Answer options for question {currentIdx + 1}</legend>
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userAnswers[currentQ.id] === option;
            const letter = String.fromCharCode(65 + optIdx);

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1">{option}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
              </button>
            );
          })}
        </fieldset>

        {/* Metacognitive Confidence Selector */}
        <div className="pt-2 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              How confident are you in this answer?
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Metacognitive calibration</span>
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
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? level === 'High'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                        : level === 'Medium'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-1 ring-indigo-600'
                        : 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
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
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Cancel Quiz
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scoring Assessment...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit & Score
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
