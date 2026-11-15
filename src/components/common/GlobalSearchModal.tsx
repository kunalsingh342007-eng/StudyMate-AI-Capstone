import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Calendar, HelpCircle, FileText, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { TopicMastery } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activePlan, notes, masteries } = useStorage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedTasks = activePlan
    ? activePlan.tasks
        .filter(
          (t) =>
            t.topic.toLowerCase().includes(q) ||
            t.subtopic.toLowerCase().includes(q) ||
            t.learningObjective.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
    )
    .slice(0, 4);

  const matchedTopics = (Object.values(masteries) as TopicMastery[])
    .filter((m) => m.topic.toLowerCase().includes(q))
    .slice(0, 4);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Studio Search"
        className="bg-white dark:bg-[#0F1D32] rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E5E1D6] dark:border-[#1E2F47] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-[#E5E1D6] dark:border-[#1E2F47] gap-3">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, daily tasks, study notes, or ask AI..."
            className="w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16263D] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Quick Navigation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect('/planner')}
                  className="p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-left border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Study Planner</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">View schedule &amp; daily tasks</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/explain')}
                  className="p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-left border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0A1628] dark:bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Explainer</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Break down complex concepts</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/quiz')}
                  className="p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-left border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-lime-600 text-white flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Practice Quiz</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Test recall &amp; diagnose gaps</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/notes')}
                  className="p-3 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] text-left border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Study Notes</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Review &amp; edit summaries</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {matchedNotes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Study Notes
              </span>
              {matchedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleSelect('/notes')}
                  className="w-full p-2.5 rounded-xl hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {note.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{note.subject}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {matchedTasks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Study Schedule Tasks
              </span>
              {matchedTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleSelect('/planner')}
                  className="w-full p-2.5 rounded-xl hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        task.status === 'completed' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {task.topic}: {task.subtopic}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {task.day} · {task.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {matchedTopics.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
                Assessed Concepts
              </span>
              {matchedTopics.map((m) => (
                <button
                  key={m.topic}
                  type="button"
                  onClick={() => handleSelect(`/explain?topic=${encodeURIComponent(m.topic)}`)}
                  className="w-full p-2.5 rounded-xl hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {m.topic}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        Mastery: {m.score}% · {m.level}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold group-hover:underline shrink-0">
                    Explain &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}

          {q && matchedNotes.length === 0 && matchedTasks.length === 0 && matchedTopics.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved items found for &quot;{query}&quot;
              </p>
              <button
                type="button"
                onClick={() => handleSelect(`/explain?topic=${encodeURIComponent(query)}`)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Explore &quot;{query}&quot; in AI Explainer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F7F5EF] dark:bg-[#0A1628] border-t border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Press ESC to close</span>
          <span className="font-mono font-medium text-teal-700 dark:text-teal-400">
            StudyMate AI Studio
          </span>
        </div>
      </div>
    </div>
  );
};
