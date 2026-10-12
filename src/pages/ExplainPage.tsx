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
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
          PEDAGOGICAL CONCEPT ENGINE
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1B4B] tracking-tight">
          AI Topic Explainer
        </h1>
        <p className="text-xs sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
          Break down complex algorithms, system architectures, and mathematical proofs into 7 intuitive pedagogical layers with code, traps, and practice recall.
        </p>
      </div>

      {/* Search / Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExplain();
        }}
        className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-xs space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="explain-topic-input" className="block text-xs font-bold text-slate-800 uppercase font-mono">
            What concept would you like explained? <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="explain-topic-input"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Explain recursion in C++, B-Trees, Dynamic Programming..."
              className="flex-1 text-sm px-4 py-3 rounded-2xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
            />
            <button
              id="explain-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-2xl shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  Explain Concept
                </>
              )}
            </button>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Depth Level:</span>
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                id={`level-btn-${lvl.toLowerCase()}`}
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  level === lvl
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-purple-700 font-medium">
            Structured into 7 pedagogical concept layers
          </div>
        </div>

        {/* Preset Topic Chips */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Suggested Core Topics:
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
                className="px-3 py-1 rounded-xl text-xs bg-[#F8F7FC] hover:bg-purple-100 hover:text-purple-800 text-slate-700 border border-purple-100 transition-colors cursor-pointer"
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
