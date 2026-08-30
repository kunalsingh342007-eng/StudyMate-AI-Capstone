import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, BookOpen, AlertCircle, ArrowRight, Lightbulb, History } from 'lucide-react';
import { ApiClient } from '../services/api/apiClient';
import { ExplanationView } from '../components/explanation/ExplanationView';
import { Banner } from '../components/layout/Banner';
import { TopicExplanation, StudyLevel } from '../types';

export const ExplainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [topic, setTopic] = useState(initialTopic || 'Explain recursion in C++');
  const [level, setLevel] = useState<StudyLevel>('Intermediate');
  const [subjectContext, setSubjectContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presetTopics = [
    'Explain recursion in C++',
    'How B-Trees work in Databases',
    'Gradient Descent in Machine Learning',
    'TCP 3-Way Handshake vs UDP',
    'CAP Theorem in Distributed Systems',
    'Memory Management & Garbage Collection',
  ];

  const handleExplain = async (customTopic?: string) => {
    const targetTopic = customTopic || topic;
    if (!targetTopic.trim()) {
      setError('Please enter a topic to explain.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await ApiClient.explainTopic({
        topic: targetTopic.trim(),
        level,
        subjectContext: subjectContext.trim() || undefined,
      });
      setExplanation(res);
    } catch (err: any) {
      setError(err.message || 'We could not explain this topic right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      handleExplain(initialTopic);
    }
  }, [initialTopic]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <Banner isDemoData={explanation?.isDemoFallback} />

      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B747A] font-mono">
          UNDERSTAND ANY TOPIC
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1720] tracking-tight">
          Topic Explainer
        </h1>
        <p className="text-xs sm:text-base text-[#6B747A] max-w-xl mx-auto leading-relaxed">
          Break down any difficult concept with intuitive analogies, step-by-step logic, code examples, common traps, and instant recall questions.
        </p>
      </div>

      {/* Search / Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExplain();
        }}
        className="bg-white rounded-2xl border border-[#E2DDD2] p-6 shadow-xs space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="explain-topic-input" className="block text-xs font-bold text-[#0B1720] uppercase font-mono">
            What topic would you like explained? <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="explain-topic-input"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Explain recursion in C++, B-Trees, Dynamic Programming..."
              className="flex-1 text-sm px-4 py-3 rounded-xl border border-[#D5CFBE] bg-white text-[#0B1720] focus:outline-[#1A5C7A] focus:border-[#1A5C7A]"
            />
            <button
              id="explain-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  Explain Concept
                </>
              )}
            </button>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Depth Level:</span>
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                id={`level-btn-${lvl.toLowerCase()}`}
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  level === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500">
            Structured into 7 pedagogical concept layers
          </div>
        </div>

        {/* Preset Topic Chips */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Explorations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetTopics.map((pt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(pt);
                  handleExplain(pt);
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors"
              >
                {pt}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Error Notice */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleExplain()}
            className="text-xs font-semibold text-rose-800 underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-20 bg-slate-100 rounded" />
          <div className="h-32 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      )}

      {/* Structured 7-Section Explanation View */}
      {explanation && !isLoading && <ExplanationView data={explanation} />}
    </div>
  );
};
