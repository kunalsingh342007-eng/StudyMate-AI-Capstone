import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Calendar,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../context/ToastContext';
import { PageHeader, StudioPanel, EmptyState } from '../components/ui/Common';
import { StudyNote } from '../types';

export const NotesPage: React.FC = () => {
  const { notes, saveNote, deleteNote, togglePinNote, activePlan, userProfile } = useStorage();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activeNote, setActiveNote] = useState<StudyNote | null>(notes[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const subjects = ['All', ...Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)))];

  const filteredNotes = notes.filter((note) => {
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.subject.toLowerCase().includes(q) ||
      note.tags.some((t) => t.toLowerCase().includes(q));
    return matchesSubject && matchesQuery;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleStartCreate = () => {
    setEditTitle('');
    setEditSubject(activePlan?.subject || userProfile.subjects?.[0] || '');
    setEditTopic('');
    setEditContent('');
    setEditTags('');
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleStartEdit = (note: StudyNote) => {
    setEditTitle(note.title);
    setEditSubject(note.subject);
    setEditTopic(note.topic || '');
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const tagsArray = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedNote: StudyNote = {
      id: isCreating ? `note-${Date.now()}` : activeNote ? activeNote.id : `note-${Date.now()}`,
      title: editTitle.trim(),
      subject: editSubject.trim() || 'General Studies',
      topic: editTopic.trim() || undefined,
      content: editContent,
      tags: tagsArray,
      isPinned: !isCreating && activeNote ? activeNote.isPinned : false,
      createdAt: !isCreating && activeNote ? activeNote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveNote(updatedNote);
    setActiveNote(updatedNote);
    setIsEditing(false);
    setIsCreating(false);
    showToast(isCreating ? 'Study note created' : 'Study note updated', 'success');
  };

  const handleDelete = (noteToDelete: StudyNote) => {
    deleteNote(noteToDelete.id);
    if (activeNote?.id === noteToDelete.id) {
      const remaining = notes.filter((n) => n.id !== noteToDelete.id);
      setActiveNote(remaining[0] || null);
    }
    showToast(`Deleted "${noteToDelete.title}"`, 'info', {
      label: 'Undo',
      onClick: () => {
        saveNote(noteToDelete);
        setActiveNote(noteToDelete);
      },
    });
  };

  const handleTogglePin = (note: StudyNote) => {
    togglePinNote(note.id);
    if (activeNote?.id === note.id) {
      setActiveNote({ ...note, isPinned: !note.isPinned });
    }
    showToast(note.isPinned ? 'Note unpinned' : 'Note pinned to top', 'info');
  };

  const inputClass =
    'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Knowledge Vault"
        title="Study Notes & Summaries"
        description="Organize revision sheets, conceptual takeaways, formulas, and AI explanation summaries."
        actions={
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-4">
          <StudioPanel className="p-3.5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by title, tag, or content..."
                aria-label="Search study notes"
                className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </StudioPanel>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {sortedNotes.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="No notes found"
                description="Create a revision note or adjust your subject and search filters."
                action={
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    + Add First Note
                  </button>
                }
              />
            ) : (
              sortedNotes.map((note) => {
                const isSelected = activeNote?.id === note.id && !isCreating;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNote(note);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer relative group ${
                      isSelected
                        ? 'bg-white dark:bg-[#0F1D32] border-teal-600 dark:border-teal-500 ring-2 ring-teal-600/15'
                        : 'bg-white dark:bg-[#0F1D32] hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                          {note.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                          <span className="truncate">{note.subject}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {note.content.replace(/[#*`_]/g, '')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(note);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          note.isPinned
                            ? 'text-amber-500 hover:text-slate-400'
                            : 'text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 focus:opacity-100'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                        aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E5E1D6] dark:border-[#1E2F47] text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        {new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-slate-500 dark:text-slate-400 font-mono truncate">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail / Editor Column */}
        <div className="lg:col-span-7">
          {isEditing ? (
            <StudioPanel className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider font-mono">
                    {isCreating ? 'New Study Note' : 'Edit Study Note'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Cancel editing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Dynamic Programming Recurrence Patterns"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      placeholder="e.g. Memoization & Tabulation"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. Algorithms, Formulas"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Content *
                  </label>
                  <textarea
                    rows={14}
                    required
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your study notes, formulas, step-by-step mechanisms, or code snippets..."
                    className={`${inputClass} font-mono leading-relaxed resize-y`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            </StudioPanel>
          ) : activeNote ? (
            <StudioPanel className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">
                      {activeNote.subject}
                    </span>
                    {activeNote.topic && (
                      <>
                        <span aria-hidden="true" className="text-slate-400">&middot;</span>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {activeNote.topic}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(activeNote)}
                    className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] transition-colors flex items-center gap-1.5 text-xs font-semibold border border-[#E5E1D6] dark:border-[#1E2F47] cursor-pointer"
                    title="Edit Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePin(activeNote)}
                    className={`p-2 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] transition-colors cursor-pointer ${
                      activeNote.isPinned
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D]'
                    }`}
                    title={activeNote.isPinned ? 'Unpin' : 'Pin to top'}
                    aria-label={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(activeNote)}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                    title="Delete Note"
                    aria-label="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Updated {new Date(activeNote.updatedAt).toLocaleDateString()}
                </span>
                {activeNote.tags.length > 0 && <span aria-hidden="true">&middot;</span>}
                {activeNote.tags.map((tag) => (
                  <span key={tag} className="font-mono text-teal-700 dark:text-teal-400">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </StudioPanel>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No Note Selected"
              description="Select a note from the list on the left or create a brand new revision sheet."
              action={
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Create Note
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
