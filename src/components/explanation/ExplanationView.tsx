import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  Layers,
  Code,
  AlertTriangle,
  FileText,
  HelpCircle,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';
import { TopicExplanation } from '../../types';
import { Badge } from '../ui/Common';

interface ExplanationViewProps {
  data: TopicExplanation;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({ data }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [revealedHints, setRevealedHints] = useState<{ [idx: number]: boolean }>({});
  const [revealedAnswers, setRevealedAnswers] = useState<{ [idx: number]: boolean }>({});

  const copyExample = () => {
    if (data.example.codeOrFormula) {
      navigator.clipboard.writeText(data.example.codeOrFormula);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Topic Deep Dive
            </span>
            <span className="text-slate-300">&bull;</span>
            <Badge variant="primary" size="sm">
              {data.level} Level
            </Badge>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {data.topic}
        </h1>

        {/* 1. Simple Explanation */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed">
          <p className="font-normal">{data.simpleExplanation}</p>
        </div>
      </div>

      {/* 2. Real-World Analogy */}
      <section aria-labelledby="analogy-heading" className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white rounded-2xl border border-amber-200/80 p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Lightbulb className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 id="analogy-heading" className="text-base sm:text-lg font-bold text-amber-950">
              Intuition & Real-World Analogy
            </h2>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed pt-1">
              {data.realWorldAnalogy}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Step-by-Step Explanation */}
      <section aria-labelledby="steps-heading" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h2 id="steps-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          Step-by-Step Conceptual Progression
        </h2>

        <div className="space-y-3 pt-2">
          {data.stepStepExplanation ? (
            // fallback safety
            data.stepStepExplanation.map((s: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-700">Step {s.stepNumber || i + 1}: {s.title}</span>
                <p className="text-xs sm:text-sm text-slate-700 mt-1">{s.description}</p>
              </div>
            ))
          ) : (
            data.stepByStepExplanation.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">{step.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                  {step.description}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Concrete Example / Code / Formula */}
      <section aria-labelledby="example-heading" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="example-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            Applied Example: {data.example.title}
          </h2>

          {data.example.codeOrFormula && (
            <button
              type="button"
              onClick={copyExample}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
              aria-label="Copy example code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          )}
        </div>

        {data.example.codeOrFormula && (
          <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs sm:text-sm text-slate-100 overflow-x-auto shadow-inner border border-slate-800">
            <pre tabIndex={0}><code>{data.example.codeOrFormula}</code></pre>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <span className="font-semibold text-indigo-950 block mb-1">Detailed Walkthrough:</span>
          {data.example.explanation}
        </div>
      </section>

      {/* 5. Common Mistakes */}
      <section aria-labelledby="mistakes-heading" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h2 id="mistakes-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" aria-hidden="true" />
          Common Traps & How to Avoid Them
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {data.commonMistakes.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-rose-50/30 border border-rose-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
                Trap #{idx + 1}: {item.mistake}
              </span>
              <div className="text-xs text-slate-600">
                <strong className="text-slate-800">Why it happens:</strong> {item.whyItHappens}
              </div>
              <div className="text-xs text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-100 font-medium">
                <strong>How to avoid:</strong> {item.howToAvoid}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Quick Revision Notes */}
      <section aria-labelledby="notes-heading" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-3">
        <h2 id="notes-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          High-Yield Revision Bullet Points
        </h2>
        <ul className="space-y-2 pt-2">
          {data.quickRevisionNotes.map((note, idx) => (
            <li
              key={idx}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Active Recall Practice Questions */}
      <section aria-labelledby="practice-heading" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h2 id="practice-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          Active Recall Practice Questions
        </h2>
        <p className="text-xs text-slate-500 -mt-2">
          Test your immediate understanding before moving to the next topic.
        </p>

        <div className="space-y-4 pt-2">
          {data.practiceQuestions.map((q, idx) => {
            const hasHint = revealedHints[idx];
            const hasAnswer = revealedAnswers[idx];
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    Q{idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 pt-0.5">{q.question}</p>
                </div>

                <div className="flex items-center gap-3 pl-8">
                  <button
                    type="button"
                    onClick={() => toggleHint(idx)}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    aria-expanded={hasHint}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {hasHint ? 'Hide Hint' : 'Show Hint'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAnswer(idx)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    aria-expanded={hasAnswer}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {hasAnswer ? 'Hide Answer' : 'Reveal Complete Answer'}
                  </button>
                </div>

                {hasHint && (
                  <div className="ml-8 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Hint:</strong> {q.hint}
                  </div>
                )}

                {hasAnswer && (
                  <div className="ml-8 p-3 rounded bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-medium">
                    <strong>Answer:</strong> {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
