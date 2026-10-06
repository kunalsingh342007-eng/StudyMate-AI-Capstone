import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Quiz, QuizResult, MistakeExplanation } from '../../types';
import { Badge } from '../ui/Common';
import { ApiClient } from '../../services/api/apiClient';
import { StorageService } from '../../services/storage/storageService';

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
  const [diagnosingQuestionId, setDiagnosingQuestionId] = useState<string | null>(null);
  const [mistakeExplanations, setMistakeExplanations] = useState<{ [qId: string]: MistakeExplanation }>({});
  const [revealedPracticeAnswers, setRevealedPracticeAnswers] = useState<{ [qId: string]: boolean }>({});
  const [diagnosisError, setDiagnosisError] = useState<{ [qId: string]: string }>({});

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

  const handleDiagnoseMistake = async (q: any) => {
    if (mistakeExplanations[q.id]) {
      // Toggle off if already open
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

      // Cache into storage if mistake exists
      const existingMistakes = StorageService.getMistakes();
      const match = existingMistakes.find((m) => m.questionId === q.id || m.questionText === q.question);
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

        {/* Confidence Calibration Bar */}
        {confidenceInsights && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Metacognitive Calibration
              </span>
              <span className="text-slate-500 font-normal">{confidenceInsights.overallAlignment}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/80">
                <span className="block font-bold text-emerald-800 text-sm">
                  {confidenceInsights.strongMasteryCount}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Strong Mastery</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/80">
                <span className="block font-bold text-rose-800 text-sm">
                  {confidenceInsights.misconceptionsCount}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">Misconceptions</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80">
                <span className="block font-bold text-amber-800 text-sm">
                  {confidenceInsights.unconfidentCount}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Uncertain / Low Conf</span>
              </div>
            </div>
          </div>
        )}

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
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </h4>

                    {/* Metacognitive Alignment Badge */}
                    {q.alignment && (
                      <div className="mt-1 flex items-center gap-1.5">
                        {q.alignment === 'Misconception' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Misconception: High Confidence + Wrong
                          </span>
                        )}
                        {q.alignment === 'Strong Mastery' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Strong Mastery: High Confidence + Correct
                          </span>
                        )}
                        {q.alignment === 'Lucky Guess' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                            <Lightbulb className="w-3 h-3 text-sky-600" />
                            Knowledge Present: Low Confidence + Correct
                          </span>
                        )}
                        {q.alignment === 'Foundational Gap' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <HelpCircle className="w-3 h-3 text-slate-500" />
                            Foundational Gap: Low/Medium Confidence + Wrong
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
                {q.options.map((opt: string, optIdx: number) => {
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

              {/* Standard Explanation Callout */}
              {q.explanation && (
                <div className="mt-3 ml-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900 block mb-0.5">Explanation:</strong>
                  {q.explanation}
                </div>
              )}

              {/* AI Mistake Diagnosis Action for Incorrect Questions */}
              {!isCorrect && (
                <div className="mt-3 ml-8 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDiagnoseMistake(q)}
                    disabled={isDiagnosing}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5"
                  >
                    {isDiagnosing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Diagnosing Misconception...
                      </>
                    ) : mistakeExp ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Close AI Mistake Diagnosis
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Diagnose Mistake with AI
                      </>
                    )}
                  </button>

                  {diagnosisError[q.id] && (
                    <p className="text-xs text-rose-600 mt-1">{diagnosisError[q.id]}</p>
                  )}

                  {/* 6-Part Pedagogical Mistake Breakdown Card */}
                  {mistakeExp && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-900 text-white space-y-3.5 text-xs sm:text-sm animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                          <BookOpen className="w-3.5 h-3.5" />
                          Deep Mistake Diagnosis
                        </span>
                        <span className="text-[11px] text-slate-400">Pedagogical Learning Loop</span>
                      </div>

                      {/* 1. Misunderstood Concept */}
                      <div>
                        <strong className="text-indigo-200 block text-xs font-semibold uppercase tracking-wider">
                          1. Core Misunderstanding
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whatWasMisunderstood}</p>
                      </div>

                      {/* 2. Why Selected Answer was Wrong */}
                      <div>
                        <strong className="text-rose-300 block text-xs font-semibold uppercase tracking-wider">
                          2. Why Selected Answer Was Incorrect
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whySelectedWasWrong}</p>
                      </div>

                      {/* 3. Why Correct Concept Works */}
                      <div>
                        <strong className="text-emerald-300 block text-xs font-semibold uppercase tracking-wider">
                          3. Why The Correct Principle Holds
                        </strong>
                        <p className="text-slate-200 mt-0.5">{mistakeExp.whyCorrectWorks}</p>
                      </div>

                      {/* 4. Simple Real-World Example */}
                      <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                        <strong className="text-sky-300 block text-xs font-semibold uppercase tracking-wider mb-0.5">
                          4. Intuitive Example / Analogy
                        </strong>
                        <p className="text-slate-300 text-xs leading-relaxed">{mistakeExp.simpleExample}</p>
                      </div>

                      {/* 5. Key Actionable Takeaway */}
                      <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800">
                        <strong className="text-indigo-300 block text-xs font-semibold uppercase tracking-wider mb-0.5">
                          5. Key Revision Takeaway
                        </strong>
                        <p className="text-indigo-100 font-medium text-xs">{mistakeExp.keyTakeaway}</p>
                      </div>

                      {/* 6. Follow-up Practice Question */}
                      {mistakeExp.followUpQuestion && (
                        <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 space-y-2">
                          <strong className="text-amber-300 block text-xs font-semibold uppercase tracking-wider">
                            6. Follow-Up Practice Drill
                          </strong>
                          <p className="text-white text-xs font-medium">
                            {mistakeExp.followUpQuestion.question}
                          </p>

                          <div className="space-y-1 pt-1">
                            {mistakeExp.followUpQuestion.options.map((opt, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-slate-900 border border-slate-700/80 text-xs text-slate-300 flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                {revealedPracticeAnswers[q.id] && opt === mistakeExp.followUpQuestion?.correctAnswer && (
                                  <span className="text-[11px] font-bold text-emerald-400">Correct Answer</span>
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
                            className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            {revealedPracticeAnswers[q.id] ? 'Hide Answer & Hint' : 'Reveal Answer & Explanation'}
                          </button>

                          {revealedPracticeAnswers[q.id] && (
                            <p className="text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
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
