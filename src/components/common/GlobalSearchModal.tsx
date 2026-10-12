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

  // Search tasks in active plan
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

  // Search notes
  const matchedNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
    )
    .slice(0, 4);

  // Search masteries / topics
  const matchedTopics = (Object.values(masteries) as TopicMastery[])
    .filter((m) => m.topic.toLowerCase().includes(q))
    .slice(0, 4);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-purple-100/80 gap-3">
          <Search className="w-5 h-5 text-purple-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, daily tasks, study notes, or actions..."
            className="w-full text-base bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Actions if query is empty */}
          {!q && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect('/planner')}
                  className="p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 text-left border border-purple-100/60 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Study Planner</p>
                    <p className="text-[11px] text-slate-500">View timetable & daily tasks</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/explain')}
                  className="p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 text-left border border-purple-100/60 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">AI Explainer</p>
                    <p className="text-[11px] text-slate-500">Understand complex concepts</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/quiz')}
                  className="p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 text-left border border-purple-100/60 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Practice Quiz</p>
                    <p className="text-[11px] text-slate-500">Test your mastery with AI</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/notes')}
                  className="p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 text-left border border-purple-100/60 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Study Notes</p>
                    <p className="text-[11px] text-slate-500">Review & write summaries</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Matched Study Notes */}
          {matchedNotes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                Study Notes
              </span>
              {matchedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleSelect('/notes')}
                  className="w-full p-2.5 rounded-xl hover:bg-purple-50/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">{note.title}</p>
                      <p className="text-[11px] text-slate-500">{note.subject}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                Study Schedule Tasks
              </span>
              {matchedTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleSelect('/planner')}
                  className="w-full p-2.5 rounded-xl hover:bg-purple-50/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300'
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {task.topic}: {task.subtopic}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {task.day} · {task.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Matched Topics / Explainer */}
          {matchedTopics.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                Topics & Mastery
              </span>
              {matchedTopics.map((m) => (
                <button
                  key={m.topic}
                  type="button"
                  onClick={() => handleSelect(`/explain?topic=${encodeURIComponent(m.topic)}`)}
                  className="w-full p-2.5 rounded-xl hover:bg-purple-50/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 text-violet-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">{m.topic}</p>
                      <p className="text-[11px] text-slate-500">Mastery: {m.score}% · {m.level}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold group-hover:underline shrink-0">
                    Explain with AI &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* If no match */}
          {q && matchedNotes.length === 0 && matchedTasks.length === 0 && matchedTopics.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No matching items found for &quot;{query}&quot;</p>
              <button
                type="button"
                onClick={() => handleSelect(`/explain?topic=${encodeURIComponent(query)}`)}
                className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                Ask AI to explain &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-purple-100/60 flex items-center justify-between text-[11px] text-slate-600">
          <span>Tip: Press ESC to close</span>
          <span className="font-medium text-purple-700">StudyMate AI Academic Copilot</span>
        </div>
      </div>
    </div>
  );
};
