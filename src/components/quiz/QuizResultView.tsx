import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { Quiz, QuizResult } from '../../types';
import { Badge } from '../ui/Common';

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
  useEffect(() => {
    if (result.percentage >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore confetti errors in test environments
      }
    }
  }, [result.percentage]);

  const isPassing = result.percentage >= 70;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Score Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
          {result.percentage >= 80 ? (
            <Trophy className="w-8 h-8 text-amber-500" />
          ) : isPassing ? (
            <Award className="w-8 h-8 text-indigo-600" />
          ) : (
            <HelpCircle className="w-8 h-8 text-slate-500" />
          )}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Quiz Completed!</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {quiz.subject} &bull; {quiz.topic} ({quiz.difficulty} Level)
          </p>
        </div>

        {/* Big Score Box */}
        <div className="inline-flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 min-w-[200px]">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {result.percentage}%
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            {result.score} of {result.totalQuestions} Questions Correct
          </span>
        </div>

        {/* Improvement Recommendation */}
        <div className="text-left p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs sm:text-sm text-slate-800 space-y-1">
          <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Personalized Study Recommendation:
          </span>
          <p className="text-slate-700 leading-relaxed pl-5.5">{result.improvementRecommendation}</p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <RotateCcw className="w-4 h-4" /> Retake This Quiz
          </button>

          <button
            type="button"
            onClick={onNewQuiz}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            Generate New Quiz <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Detailed Answer Breakdown</h3>

        {quiz.questions.map((q, idx) => {
          const userAnswer = result.userAnswers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                isCorrect ? 'bg-white border-emerald-200/80 shadow-xs' : 'bg-white border-rose-200/80 shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                </div>

                <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Correct
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                    </>
                  )}
                </Badge>
              </div>

              {/* Options Review */}
              <div className="space-y-1.5 pl-8 text-xs sm:text-sm">
                {q.options.map((opt, optIdx) => {
                  const isUserSelection = userAnswer === opt;
                  const isAnswer = q.correctAnswer === opt;

                  let optClass = 'bg-slate-50 border-slate-200 text-slate-600';
                  if (isAnswer) {
                    optClass = 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold';
                  } else if (isUserSelection && !isCorrect) {
                    optClass = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-2 ${optClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs opacity-75">{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                      </div>
                      {isAnswer && <span className="text-xs font-bold text-emerald-700">Correct Answer</span>}
                      {isUserSelection && !isAnswer && <span className="text-xs font-bold text-rose-700">Your Answer</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Callout */}
              <div className="mt-3 ml-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900 block mb-0.5">Explanation:</strong>
                {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
