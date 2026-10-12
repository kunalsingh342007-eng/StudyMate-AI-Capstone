import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  BookOpen,
  Check,
  X,
  Share2,
  Folder,
  Sparkles,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { StudyNote } from '../types';

export const NotesPage: React.FC = () => {
  const { notes, saveNote, deleteNote, togglePinNote, activePlan } = useStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activeNote, setActiveNote] = useState<StudyNote | null>(notes[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for editing / creating
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  // Extract unique subjects
  const subjects = ['All', ...Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)))];

  // Filter notes
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

  // Sort: pinned first, then updated date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleStartCreate = () => {
    setEditTitle('');
    setEditSubject(activePlan?.subject || 'Computer Science Core');
    setEditTopic('');
    setEditContent('');
    setEditTags('Exam, Summary');
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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this study note?')) {
      deleteNote(id);
      if (activeNote?.id === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setActiveNote(remaining[0] || null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 font-mono">
            KNOWLEDGE VAULT &bull; ACTIVE RECALL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
            Study Notes & Summaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize revision sheets, algorithmic diagrams, code snippets, and conceptual takeaways
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartCreate}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Split Layout: Sidebar list + Detail/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Subject Filters */}
          <div className="bg-white p-3.5 rounded-3xl border border-purple-100/80 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-600 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by title, tag, or content..."
                className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-purple-100 bg-[#F8F7FC] text-slate-900 focus:outline-purple-600 focus:bg-white transition-all"
              />
            </div>

            {/* Subject pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSubject === sub
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50/70 text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Cards List */}
          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {sortedNotes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-purple-200">
                <FileText className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No notes found</p>
                <p className="text-xs text-slate-400 mt-1">Create a note or adjust search filters.</p>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition-colors"
                >
                  + Add First Note
                </button>
              </div>
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
                    className={`p-4 rounded-3xl border text-left transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-white border-purple-500 shadow-md shadow-purple-100 ring-2 ring-purple-500/20'
                        : 'bg-white hover:bg-purple-50/30 border-purple-100/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {note.isPinned && (
                            <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                              <Pin className="w-3 h-3 fill-amber-500" />
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wide truncate">
                            {note.subject}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1E1B4B] group-hover:text-purple-700 transition-colors truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {note.content.replace(/[#*`_]/g, '')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNote(note.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned
                            ? 'text-amber-500 hover:text-slate-400'
                            : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-purple-50 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium truncate"
                          >
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

        {/* Right Detail / Editor Column (7 cols) */}
        <div className="lg:col-span-7">
          {isEditing ? (
            /* Note Editor Form */
            <form
              onSubmit={handleSave}
              className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                  {isCreating ? 'Create New Study Note' : 'Edit Study Note'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Dynamic Programming Recurrence Patterns"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g. Computer Science Core"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic (Optional)</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="e.g. Memoization & Tabulation"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. Algorithms, Exam, Formulas"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content (Markdown Supported) *</label>
                <textarea
                  rows={14}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your study notes, formulas, step-by-step mechanisms, or code snippets here..."
                  className="w-full px-3.5 py-3 text-sm font-mono rounded-xl border border-purple-200 bg-[#FAF9FD] text-slate-900 focus:outline-purple-600 focus:bg-white leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          ) : activeNote ? (
            /* Note Detail View */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-purple-100/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold uppercase tracking-wider">
                      {activeNote.subject}
                    </span>
                    {activeNote.topic && (
                      <span className="text-xs text-slate-500 font-medium">
                        &bull; {activeNote.topic}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B]">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(activeNote)}
                    className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-purple-100"
                    title="Edit Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePinNote(activeNote.id)}
                    className={`p-2 rounded-xl border border-purple-100 transition-colors ${
                      activeNote.isPinned
                        ? 'text-amber-500 bg-amber-50'
                        : 'text-slate-600 hover:bg-purple-50'
                    }`}
                    title={activeNote.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(activeNote.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags & Metadata */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Updated {new Date(activeNote.updatedAt).toLocaleDateString()}
                </span>
                {activeNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-xl bg-[#F8F7FC] text-purple-800 text-xs font-semibold border border-purple-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Note Content Renderer */}
              <div className="prose prose-purple max-w-none text-slate-800 text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm space-y-3">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Note Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a note from the list on the left or create a brand new revision sheet.
              </p>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                + Create Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
