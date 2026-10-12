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
    <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {quiz.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
              {quiz.difficulty} Level
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1E1B4B]">{quiz.topic}</h2>
        </div>

        {/* Progress Pill */}
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500">
            Question {currentIdx + 1} of {totalQuestions}
          </span>
          <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {validationError && (
        <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Current Question */}
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
            {currentIdx + 1}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#1E1B4B] leading-snug">
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
                className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50/90 border-purple-600 text-purple-950 shadow-xs ring-1 ring-purple-600'
                    : 'bg-white border-purple-100 text-slate-700 hover:border-purple-300 hover:bg-purple-50/30'
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
              </button>
            );
          })}
        </fieldset>

        {/* Metacognitive Confidence Selector */}
        <div className="pt-2 p-4 bg-[#F8F7FC] rounded-2xl border border-purple-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              How confident are you in this answer?
            </span>
            <span className="text-[11px] text-purple-700 font-medium">Metacognitive calibration</span>
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
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    isSelected
                      ? level === 'High'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : level === 'Medium'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-purple-100 hover:bg-purple-50'
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
      <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel Quiz
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
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
