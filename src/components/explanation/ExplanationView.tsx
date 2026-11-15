import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Layers,
  Code,
  AlertTriangle,
  FileText,
  HelpCircle,
  Check,
  Copy,
  MessageSquare,
  Send,
  BookmarkPlus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { TopicExplanation } from '../../types';
import { StatusIndicator } from '../ui/Common';

interface ExplanationViewProps {
  data: TopicExplanation;
  onAskFollowUp?: (question: string) => Promise<void> | void;
  isFollowUpLoading?: boolean;
  onSaveAsNote?: (data: TopicExplanation) => void;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  data,
  onAskFollowUp,
  isFollowUpLoading = false,
  onSaveAsNote,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [revealedHints, setRevealedHints] = useState<{ [idx: number]: boolean }>({});
  const [revealedAnswers, setRevealedAnswers] = useState<{ [idx: number]: boolean }>({});
  const [followUpText, setFollowUpText] = useState('');
  const [savedNote, setSavedNote] = useState(false);

  const steps = Array.isArray((data as any).stepStepExplanation)
    ? (data as any).stepStepExplanation
    : data.stepByStepExplanation || [];

  const copyExample = () => {
    if (data.example.codeOrFormula) {
      navigator.clipboard.writeText(data.example.codeOrFormula);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || !onAskFollowUp) return;
    const q = followUpText.trim();
    setFollowUpText('');
    await onAskFollowUp(q);
  };

  const handleSaveNote = () => {
    if (onSaveAsNote) {
      onSaveAsNote(data);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Core Overview + Interactive Action Strip */}
      <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
              Concept Studio Breakdown
            </span>
            <StatusIndicator label={`${data.level} Level`} tone="teal" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSaveAsNote && (
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savedNote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Saved to Notes</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Save Summary</span>
                  </>
                )}
              </button>
            )}

            <Link
              to={`/quiz?topic=${encodeURIComponent(data.topic)}`}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Practice This Concept</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {data.topic}
        </h2>

        <div className="p-4 sm:p-5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed">
          {data.simpleExplanation}
        </div>
      </div>

      {/* 2. Real-World Analogy */}
      <section
        aria-labelledby="analogy-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-amber-300/60 dark:border-amber-500/30 p-6 sm:p-7"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 id="analogy-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Intuition &amp; Real-World Analogy
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {data.realWorldAnalogy}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Step-by-Step Progression */}
      <section
        aria-labelledby="steps-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-7 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="steps-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>Step-by-Step Conceptual Progression</span>
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {steps.length} steps
          </span>
        </div>

        {/* Stepper Selector Bar */}
        {steps.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {steps.map((s: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStepIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeStepIdx === idx
                    ? 'bg-[#0A1628] dark:bg-teal-600 text-white'
                    : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                }`}
              >
                Step {s.stepNumber || idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {steps.map((step: any, idx: number) => {
            const isFocused = activeStepIdx === idx;
            return (
              <div
                key={step.stepNumber || idx}
                onClick={() => setActiveStepIdx(idx)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  isFocused
                    ? 'bg-[#F7F5EF] dark:bg-[#16263D] border-teal-500/50 dark:border-teal-500/50'
                    : 'bg-white dark:bg-[#0F1D32] border-[#E5E1D6] dark:border-[#1E2F47] hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 tabular-nums ${
                        isFocused
                          ? 'bg-teal-600 text-white'
                          : 'bg-[#EFECE3] dark:bg-[#16263D] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {step.stepNumber || idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h4>
                  </div>
                  {idx < steps.length - 1 && isFocused && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStepIdx(idx + 1);
                      }}
                      className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Applied Example / Code / Formula */}
      <section
        aria-labelledby="example-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-7 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="example-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>Applied Example: {data.example.title}</span>
          </h3>

          {data.example.codeOrFormula && (
            <button
              type="button"
              onClick={copyExample}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] cursor-pointer"
              aria-label="Copy example code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          )}
        </div>

        {data.example.codeOrFormula && (
          <div className="rounded-xl bg-[#0A1628] p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-100 overflow-x-auto border border-[#1E2F47]">
            <pre tabIndex={0}>
              <code>{data.example.codeOrFormula}</code>
            </pre>
          </div>
        )}

        <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
            Detailed Walkthrough
          </span>
          {data.example.explanation}
        </div>
      </section>

      {/* 5. Common Mistakes */}
      <section
        aria-labelledby="mistakes-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-7 space-y-4"
      >
        <h3 id="mistakes-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" aria-hidden="true" />
          <span>Common Pitfalls &amp; How to Avoid Them</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.commonMistakes.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] space-y-2.5"
            >
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                Pitfall #{idx + 1}: {item.mistake}
              </span>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-slate-100">Why it happens: </strong>
                {item.whyItHappens}
              </div>
              <div className="text-xs text-teal-900 dark:text-teal-200 bg-teal-50/80 dark:bg-teal-950/40 p-2.5 rounded-lg border border-teal-200/70 dark:border-teal-800/50 font-medium leading-relaxed">
                <strong>How to avoid: </strong>
                {item.howToAvoid}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Quick Revision Notes */}
      <section
        aria-labelledby="notes-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-7 space-y-3"
      >
        <h3 id="notes-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <span>Quick Revision Takeaways</span>
        </h3>
        <ul className="space-y-2.5 pt-1">
          {data.quickRevisionNotes.map((note, idx) => (
            <li
              key={idx}
              className="p-3.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-3"
            >
              <span className="w-5 h-5 rounded-md bg-[#0A1628] dark:bg-teal-600 text-white flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5 tabular-nums">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Active Recall Practice Questions + Interactive Hint/Answer Controls */}
      <section
        aria-labelledby="practice-heading"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-7 space-y-4"
      >
        <div>
          <h3 id="practice-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>Active Recall Check</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reveal a hint first if needed, then verify your reasoning against the complete answer.
          </p>
        </div>

        <div className="space-y-4">
          {data.practiceQuestions.map((q, idx) => {
            const hasHint = !!revealedHints[idx];
            const hasAnswer = !!revealedAnswers[idx];
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#0A1628] dark:bg-teal-600/30 text-white dark:text-teal-200 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    Q{idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 pt-0.5">
                    {q.question}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pl-8">
                  <button
                    type="button"
                    onClick={() => setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                    aria-expanded={hasHint}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{hasHint ? 'Hide Hint' : 'Give Me a Hint'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 cursor-pointer"
                    aria-expanded={hasAnswer}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{hasAnswer ? 'Hide Answer' : 'Check Answer'}</span>
                  </button>
                </div>

                {hasHint && (
                  <div className="ml-8 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Hint: </strong>
                    {q.hint}
                  </div>
                )}

                {hasAnswer && (
                  <div className="ml-8 p-3.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                    <strong className="text-teal-800 dark:text-teal-300">Answer: </strong>
                    {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Follow-up Learning Action Bar */}
      {onAskFollowUp && (
        <section
          aria-label="Ask a follow-up question"
          className="bg-[#0A1628] dark:bg-[#0F1D32] text-white rounded-2xl border border-[#1E2F47] p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm sm:text-base font-bold">Ask a Follow-up Question</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Scoped to {data.topic}
            </span>
          </div>

          <form onSubmit={handleFollowUpSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder={`e.g. How does ${data.topic} behave in edge cases or large inputs?`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#07101E] border border-[#1E2F47] text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={isFollowUpLoading || !followUpText.trim()}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFollowUpLoading ? 'Explaining...' : 'Ask Follow-up'}</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
