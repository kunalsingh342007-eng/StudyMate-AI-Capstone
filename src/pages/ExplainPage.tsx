import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, AlertCircle, BookOpen, HelpCircle, History } from 'lucide-react';
import { ApiClient } from '../services/api/apiClient';
import { ExplanationView } from '../components/explanation/ExplanationView';
import { Banner } from '../components/layout/Banner';
import { TopicExplanation, StudyLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../context/ToastContext';
import { PageHeader, Skeleton } from '../components/ui/Common';

type LearningMode = 'Standard Conceptual' | 'Analogy-First' | 'Exam & Code Focus';

export const ExplainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const { preferences } = useAuth();
  const { activePlan, userProfile, saveNote } = useStorage();
  const { showToast } = useToast();

  const [topic, setTopic] = useState(initialTopic);
  const [level, setLevel] = useState<StudyLevel>('Intermediate');
  const [learningMode, setLearningMode] = useState<LearningMode>('Standard Conceptual');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);
  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const presetTopics = activePlan?.topics?.length
    ? activePlan.topics.slice(0, 6)
    : userProfile.weakTopics?.length
    ? userProfile.weakTopics.slice(0, 6)
    : userProfile.subjects?.length
    ? userProfile.subjects.slice(0, 6)
    : [];

  const runExplain = async (targetTopic: string, followUpQuestion?: string) => {
    if (!targetTopic.trim()) {
      setError('Please enter a concept or question to explore.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const modeHint =
      learningMode === 'Analogy-First'
        ? 'Prioritize everyday intuition and clear real-world analogies before technical notation.'
        : learningMode === 'Exam & Code Focus'
        ? 'Emphasize exam traps, complexity analysis, and concrete runnable code or derivations.'
        : '';

    const languageInstruction =
      preferences.interfaceLanguage && preferences.interfaceLanguage !== 'English'
        ? `Provide the complete explanation in ${preferences.interfaceLanguage}.`
        : '';

    const followUpContext = followUpQuestion
      ? `Follow-up question about "${explanation?.topic || targetTopic}": ${followUpQuestion}`
      : '';

    const fullContext = [
      activePlan?.subject ? `Subject: ${activePlan.subject}` : '',
      modeHint,
      followUpContext,
      languageInstruction,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      const res = await ApiClient.explainTopic({
        topic: followUpQuestion
          ? `${explanation?.topic || targetTopic} — ${followUpQuestion}`
          : targetTopic.trim(),
        level,
        subjectContext: fullContext || undefined,
      });
      setExplanation(res);
      setRecentHistory((prev) =>
        [res.topic, ...prev.filter((t) => t.toLowerCase() !== res.topic.toLowerCase())].slice(0, 5)
      );
    } catch (err: any) {
      setError(err.message || 'We could not explain this topic right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      runExplain(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  const handleSaveAsNote = (data: TopicExplanation) => {
    const markdown = [
      `# ${data.topic} (${data.level})`,
      '',
      data.simpleExplanation,
      '',
      `## Intuition`,
      data.realWorldAnalogy,
      '',
      `## Key Revision Takeaways`,
      ...data.quickRevisionNotes.map((n) => `- ${n}`),
    ].join('\n');

    saveNote({
      id: `note-exp-${Date.now()}`,
      title: data.topic,
      subject: activePlan?.subject || userProfile.subjects?.[0] || 'Concept Studio',
      topic: data.topic,
      content: markdown,
      tags: ['AI Explainer', data.level],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    showToast({
      variant: 'success',
      title: 'Saved to Study Notes',
      description: `"${data.topic}" added to your Knowledge Vault.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <Banner isDemoData={explanation?.isDemoFallback} />

      <PageHeader
        eyebrow="Interactive Concept Studio"
        title="AI Topic Explainer"
        description="Explore difficult ideas with calibrated depth, analogies, worked examples, common traps, and interactive active-recall checks."
        actions={
          <Link
            to={`/quiz?topic=${encodeURIComponent(explanation?.topic || topic)}`}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Quiz This Concept</span>
          </Link>
        }
      />

      {/* Concept Studio Prompt Workspace */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runExplain(topic);
        }}
        className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="explain-topic-input"
            className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Concept or Question
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="explain-topic-input"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Recursion in C++, B-Trees, Dynamic Programming..."
              className="flex-1 text-sm px-4 py-3 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/50 dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
            />
            <button
              id="explain-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Concept</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Depth & Learning Mode Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47]">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Depth Level
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  id={`level-btn-${lvl.toLowerCase()}`}
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    level === lvl
                      ? 'bg-[#0A1628] dark:bg-teal-600 text-white'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Learning Mode
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['Standard Conceptual', 'Analogy-First', 'Exam & Code Focus'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLearningMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    learningMode === mode
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested & Recent Topics (Strictly User-Derived) */}
        {(presetTopics.length > 0 || recentHistory.length > 0) && (
          <div className="space-y-2 pt-1">
            {presetTopics.length > 0 && (
              <>
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {activePlan?.topics?.length
                    ? `From Your ${activePlan.subject} Plan`
                    : 'From Your Study Profile'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetTopics.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => {
                        setTopic(pt);
                        runExplain(pt);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-slate-700 dark:text-slate-200 border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors cursor-pointer"
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </>
            )}

          {recentHistory.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
                <History className="w-3 h-3" /> Session:
              </span>
              {recentHistory.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setTopic(item);
                    runExplain(item);
                  }}
                  className="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          </div>
        )}
      </form>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => runExplain(topic)}
            className="text-xs font-semibold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-700 dark:text-teal-400">
            <BookOpen className="w-4 h-4" />
            <span>Synthesizing structured explanation for &quot;{topic}&quot;...</span>
          </div>
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {/* Structured Interactive Explanation View */}
      {explanation && !isLoading && (
        <ExplanationView
          data={explanation}
          onAskFollowUp={(q) => runExplain(explanation.topic, q)}
          isFollowUpLoading={isLoading}
          onSaveAsNote={handleSaveAsNote}
        />
      )}
    </div>
  );
};
