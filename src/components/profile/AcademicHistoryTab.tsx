import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  AcademicBoardRecord,
  SemesterResultRecord,
  UserProfile,
} from '../../types';
import { StudioPanel } from '../ui/Common';
import {
  calculateBoardPercentage,
  validateAcademicBoardRecord,
  validateSemesterResult,
} from '../../services/learning/profileUtils';

interface AcademicHistoryTabProps {
  profile: UserProfile;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const inputClass =
  'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

interface BoardFormState {
  board: string;
  school: string;
  stream: string;
  passingYear: string;
  marksObtained: string;
  maximumMarks: string;
  manualPercentage: string;
}

function boardToFormState(record?: AcademicBoardRecord): BoardFormState {
  return {
    board: record?.board || '',
    school: record?.school || '',
    stream: record?.stream || '',
    passingYear: record?.passingYear !== undefined ? String(record.passingYear) : '',
    marksObtained: record?.marksObtained !== undefined ? String(record.marksObtained) : '',
    maximumMarks: record?.maximumMarks !== undefined ? String(record.maximumMarks) : '',
    manualPercentage:
      record?.percentageSource === 'manual' && record?.percentage !== undefined
        ? String(record.percentage)
        : '',
  };
}

interface SemesterFormState {
  id?: string;
  semester: string;
  sgpa: string;
  cgpa: string;
  earnedCredits: string;
  resultYear: string;
  notes: string;
}

const EMPTY_SEMESTER_FORM: SemesterFormState = {
  semester: '',
  sgpa: '',
  cgpa: '',
  earnedCredits: '',
  resultYear: '',
  notes: '',
};

export const AcademicHistoryTab: React.FC<AcademicHistoryTabProps> = ({
  profile,
  onSaveProfile,
}) => {
  const [editingBoard, setEditingBoard] = useState<'class10' | 'class12' | null>(null);
  const [boardForm, setBoardForm] = useState<BoardFormState>(boardToFormState());
  const [boardErrors, setBoardErrors] = useState<string[]>([]);

  const [editingSemesterId, setEditingSemesterId] = useState<string | 'new' | null>(null);
  const [semesterForm, setSemesterForm] = useState<SemesterFormState>(EMPTY_SEMESTER_FORM);
  const [semesterErrors, setSemesterErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const class10 = profile.secondaryEducation;
  const class12 = profile.higherSecondaryEducation;
  const semesters = profile.semesterResults || [];
  const hasAnyRecord = Boolean(class10 || class12 || semesters.length > 0);

  const openBoardEditor = (kind: 'class10' | 'class12') => {
    setBoardErrors([]);
    setEditingBoard(kind);
    setBoardForm(boardToFormState(kind === 'class10' ? class10 : class12));
  };

  const liveMarksObtained =
    boardForm.marksObtained.trim() !== '' ? Number(boardForm.marksObtained) : undefined;
  const liveMaxMarks =
    boardForm.maximumMarks.trim() !== '' ? Number(boardForm.maximumMarks) : undefined;
  const liveAutoPercentage = calculateBoardPercentage(liveMarksObtained, liveMaxMarks);

  const handleSaveBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard) return;

    const marksObtained =
      boardForm.marksObtained.trim() !== '' ? Number(boardForm.marksObtained) : undefined;
    const maximumMarks =
      boardForm.maximumMarks.trim() !== '' ? Number(boardForm.maximumMarks) : undefined;
    const passingYear =
      boardForm.passingYear.trim() !== '' ? Number(boardForm.passingYear) : undefined;
    const manualPct =
      boardForm.manualPercentage.trim() !== '' ? Number(boardForm.manualPercentage) : undefined;

    const calculatedPct = calculateBoardPercentage(marksObtained, maximumMarks);
    const resolvedPct = calculatedPct !== undefined ? calculatedPct : manualPct;
    const percentageSource: AcademicBoardRecord['percentageSource'] =
      calculatedPct !== undefined ? 'calculated' : manualPct !== undefined ? 'manual' : undefined;

    const candidate: AcademicBoardRecord = {
      board: boardForm.board.trim(),
      school: boardForm.school.trim(),
      ...(editingBoard === 'class12' && boardForm.stream.trim()
        ? { stream: boardForm.stream.trim() }
        : {}),
      ...(passingYear !== undefined ? { passingYear } : {}),
      ...(marksObtained !== undefined ? { marksObtained } : {}),
      ...(maximumMarks !== undefined ? { maximumMarks } : {}),
      ...(resolvedPct !== undefined ? { percentage: resolvedPct, percentageSource } : {}),
      updatedAt: new Date().toISOString(),
    };

    const validationErrors = validateAcademicBoardRecord(candidate);
    if (validationErrors.length > 0) {
      setBoardErrors(validationErrors);
      return;
    }

    setBoardErrors([]);
    setSaving(true);
    try {
      await onSaveProfile(
        editingBoard === 'class10'
          ? { secondaryEducation: candidate }
          : { higherSecondaryEducation: candidate }
      );
      setEditingBoard(null);
    } catch (err: any) {
      setBoardErrors([err?.message || 'Failed to save academic record.']);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBoard = async (kind: 'class10' | 'class12') => {
    setSaving(true);
    try {
      await onSaveProfile(
        kind === 'class10'
          ? { secondaryEducation: null as unknown as undefined }
          : { higherSecondaryEducation: null as unknown as undefined }
      );
      if (editingBoard === kind) setEditingBoard(null);
    } catch (err: any) {
      setBoardErrors([err?.message || 'Could not remove record.']);
    } finally {
      setSaving(false);
    }
  };

  const openNewSemester = () => {
    setSemesterErrors([]);
    setEditingSemesterId('new');
    setSemesterForm(EMPTY_SEMESTER_FORM);
  };

  const openEditSemester = (rec: SemesterResultRecord) => {
    setSemesterErrors([]);
    setEditingSemesterId(rec.id);
    setSemesterForm({
      id: rec.id,
      semester: rec.semester,
      sgpa: rec.sgpa !== undefined ? String(rec.sgpa) : '',
      cgpa: rec.cgpa !== undefined ? String(rec.cgpa) : '',
      earnedCredits: rec.earnedCredits !== undefined ? String(rec.earnedCredits) : '',
      resultYear: rec.resultYear !== undefined ? String(rec.resultYear) : '',
      notes: rec.notes || '',
    });
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();

    const sgpa = semesterForm.sgpa.trim() !== '' ? Number(semesterForm.sgpa) : undefined;
    const cgpa = semesterForm.cgpa.trim() !== '' ? Number(semesterForm.cgpa) : undefined;
    const earnedCredits =
      semesterForm.earnedCredits.trim() !== '' ? Number(semesterForm.earnedCredits) : undefined;
    const resultYear =
      semesterForm.resultYear.trim() !== '' ? Number(semesterForm.resultYear) : undefined;

    const candidate: SemesterResultRecord = {
      id:
        semesterForm.id ||
        `sem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      semester: semesterForm.semester.trim(),
      ...(sgpa !== undefined ? { sgpa } : {}),
      ...(cgpa !== undefined ? { cgpa } : {}),
      ...(earnedCredits !== undefined ? { earnedCredits } : {}),
      ...(resultYear !== undefined ? { resultYear } : {}),
      ...(semesterForm.notes.trim() ? { notes: semesterForm.notes.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    const validationErrors = validateSemesterResult(candidate);
    if (validationErrors.length > 0) {
      setSemesterErrors(validationErrors);
      return;
    }

    const nextList =
      editingSemesterId === 'new'
        ? [...semesters, candidate]
        : semesters.map((s) => (s.id === editingSemesterId ? candidate : s));

    setSemesterErrors([]);
    setSaving(true);
    try {
      await onSaveProfile({ semesterResults: nextList });
      setEditingSemesterId(null);
      setSemesterForm(EMPTY_SEMESTER_FORM);
    } catch (err: any) {
      setSemesterErrors([err?.message || 'Failed to save semester result.']);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSemester = async (id: string) => {
    setSaving(true);
    try {
      await onSaveProfile({
        semesterResults: semesters.filter((s) => s.id !== id),
      });
      if (editingSemesterId === id) setEditingSemesterId(null);
    } catch (err: any) {
      setSemesterErrors([err?.message || 'Could not remove semester result.']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Honesty / Self-Reported Notice */}
      <div className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] px-4 py-3 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
        <p>
          Academic records stored here are <strong className="font-semibold">self-reported</strong>. Percentage is calculated only when valid marks obtained and maximum marks are entered; SGPA and CGPA are stored separately without automatic conversion.
        </p>
      </div>

      {/* Empty State Banner when completely fresh */}
      {!hasAnyRecord && editingBoard === null && editingSemesterId === null && (
        <StudioPanel className="p-8 text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#EFECE3] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No academic records added yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Add your Class 10, Class 12, or semester-wise university results whenever you are ready.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => openBoardEditor('class10')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Add Class 10</span>
            </button>
            <button
              type="button"
              onClick={() => openBoardEditor('class12')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Add Class 12</span>
            </button>
            <button
              type="button"
              onClick={openNewSemester}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Semester Result</span>
            </button>
          </div>
        </StudioPanel>
      )}

      {/* Board Editor Modal/Card */}
      {editingBoard && (
        <StudioPanel className="p-6 sm:p-8">
          <form onSubmit={handleSaveBoard} className="space-y-5" noValidate>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingBoard === 'class10'
                  ? 'Class 10 (Secondary Education)'
                  : 'Class 12 / Equivalent (Higher Secondary)'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBoard(null)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {boardErrors.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200 space-y-1"
              >
                {boardErrors.map((err) => (
                  <p key={err} className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="board-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Board
                </label>
                <input
                  id="board-name"
                  type="text"
                  value={boardForm.board}
                  onChange={(e) => setBoardForm({ ...boardForm, board: e.target.value })}
                  placeholder="e.g. CBSE, ICSE, State Board"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="board-school" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  School Name
                </label>
                <input
                  id="board-school"
                  type="text"
                  value={boardForm.school}
                  onChange={(e) => setBoardForm({ ...boardForm, school: e.target.value })}
                  placeholder="e.g. Delhi Public School"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {editingBoard === 'class12' && (
                <div>
                  <label htmlFor="board-stream" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Stream
                  </label>
                  <input
                    id="board-stream"
                    type="text"
                    value={boardForm.stream}
                    onChange={(e) => setBoardForm({ ...boardForm, stream: e.target.value })}
                    placeholder="e.g. Science (PCM), Commerce"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="board-passing-year" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Passing Year
                </label>
                <input
                  id="board-passing-year"
                  type="number"
                  min={1975}
                  max={2045}
                  value={boardForm.passingYear}
                  onChange={(e) => setBoardForm({ ...boardForm, passingYear: e.target.value })}
                  placeholder="e.g. 2022"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="board-marks-obtained" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Marks Obtained
                </label>
                <input
                  id="board-marks-obtained"
                  type="number"
                  min={0}
                  step="any"
                  value={boardForm.marksObtained}
                  onChange={(e) => setBoardForm({ ...boardForm, marksObtained: e.target.value })}
                  placeholder="e.g. 462"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="board-max-marks" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Maximum Marks
                </label>
                <input
                  id="board-max-marks"
                  type="number"
                  min={1}
                  step="any"
                  value={boardForm.maximumMarks}
                  onChange={(e) => setBoardForm({ ...boardForm, maximumMarks: e.target.value })}
                  placeholder="e.g. 500"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="board-percentage" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Percentage {liveAutoPercentage !== undefined ? '(Auto-calculated from marks)' : '(optional if marks not entered)'}
                </label>
                <input
                  id="board-percentage"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  readOnly={liveAutoPercentage !== undefined}
                  value={
                    liveAutoPercentage !== undefined
                      ? String(liveAutoPercentage)
                      : boardForm.manualPercentage
                  }
                  onChange={(e) =>
                    setBoardForm({ ...boardForm, manualPercentage: e.target.value })
                  }
                  placeholder={liveAutoPercentage !== undefined ? '' : 'e.g. 92.4'}
                  className={`${inputClass} tabular-nums ${
                    liveAutoPercentage !== undefined ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                When both Marks Obtained and Maximum Marks are valid, percentage is automatically computed cleanly to two decimal places.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingBoard(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Academic Record'}</span>
              </button>
            </div>
          </form>
        </StudioPanel>
      )}

      {/* Class 10 & Class 12 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StudioPanel className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Class 10 Record
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Secondary School · Self-reported
              </span>
            </div>
            {class10 ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openBoardEditor('class10')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  aria-label="Remove Class 10 record"
                  onClick={() => handleRemoveBoard('class10')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openBoardEditor('class10')}
                className="px-3 py-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>Add</span>
              </button>
            )}
          </div>

          {class10 ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Board</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {class10.board || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Passing Year</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {class10.passingYear ?? '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">School</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {class10.school || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Marks</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {class10.marksObtained !== undefined && class10.maximumMarks !== undefined
                    ? `${class10.marksObtained} / ${class10.maximumMarks}`
                    : 'Not entered'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Percentage</dt>
                <dd className="font-bold text-teal-700 dark:text-teal-400 mt-0.5 tabular-nums">
                  {class10.percentage !== undefined ? `${class10.percentage}%` : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No Class 10 record saved yet.
            </p>
          )}
        </StudioPanel>

        <StudioPanel className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Class 12 / Equivalent
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Higher Secondary · Self-reported
              </span>
            </div>
            {class12 ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openBoardEditor('class12')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  aria-label="Remove Class 12 record"
                  onClick={() => handleRemoveBoard('class12')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openBoardEditor('class12')}
                className="px-3 py-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>Add</span>
              </button>
            )}
          </div>

          {class12 ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Board</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {class12.board || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Stream &amp; Year</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {[class12.stream, class12.passingYear].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">School</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {class12.school || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Marks</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {class12.marksObtained !== undefined && class12.maximumMarks !== undefined
                    ? `${class12.marksObtained} / ${class12.maximumMarks}`
                    : 'Not entered'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Percentage</dt>
                <dd className="font-bold text-teal-700 dark:text-teal-400 mt-0.5 tabular-nums">
                  {class12.percentage !== undefined ? `${class12.percentage}%` : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No Class 12 or equivalent record saved yet.
            </p>
          )}
        </StudioPanel>
      </div>

      {/* Undergraduate / Semester-wise Results */}
      <StudioPanel className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Undergraduate / Semester-wise Results
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track SGPA, CGPA, earned credits, and result year per semester separately
            </p>
          </div>
          {editingSemesterId === null && (
            <button
              type="button"
              onClick={openNewSemester}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Semester</span>
            </button>
          )}
        </div>

        {editingSemesterId !== null && (
          <form
            onSubmit={handleSaveSemester}
            className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/70 dark:bg-[#16263D]/60 p-4 sm:p-5 space-y-4"
            noValidate
          >
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingSemesterId === 'new' ? 'Add Semester Result' : 'Edit Semester Result'}
              </h5>
              <button
                type="button"
                onClick={() => setEditingSemesterId(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {semesterErrors.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1"
              >
                {semesterErrors.map((err) => (
                  <p key={err} className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <label htmlFor="sem-label" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Semester <span className="text-rose-600">*</span>
                </label>
                <input
                  id="sem-label"
                  type="text"
                  required
                  value={semesterForm.semester}
                  onChange={(e) => setSemesterForm({ ...semesterForm, semester: e.target.value })}
                  placeholder="e.g. Semester 1"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="sem-sgpa" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  SGPA (0–10)
                </label>
                <input
                  id="sem-sgpa"
                  type="number"
                  min={0}
                  max={10}
                  step="0.01"
                  value={semesterForm.sgpa}
                  onChange={(e) => setSemesterForm({ ...semesterForm, sgpa: e.target.value })}
                  placeholder="e.g. 8.75"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="sem-cgpa" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  CGPA (optional, 0–10)
                </label>
                <input
                  id="sem-cgpa"
                  type="number"
                  min={0}
                  max={10}
                  step="0.01"
                  value={semesterForm.cgpa}
                  onChange={(e) => setSemesterForm({ ...semesterForm, cgpa: e.target.value })}
                  placeholder="e.g. 8.60"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="sem-credits" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Credits Earned (opt.)
                </label>
                <input
                  id="sem-credits"
                  type="number"
                  min={0}
                  max={400}
                  step="0.5"
                  value={semesterForm.earnedCredits}
                  onChange={(e) =>
                    setSemesterForm({ ...semesterForm, earnedCredits: e.target.value })
                  }
                  placeholder="e.g. 22"
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="sem-year" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Result Year (opt.)
                </label>
                <input
                  id="sem-year"
                  type="number"
                  min={1980}
                  max={2045}
                  value={semesterForm.resultYear}
                  onChange={(e) =>
                    setSemesterForm({ ...semesterForm, resultYear: e.target.value })
                  }
                  placeholder="e.g. 2024"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sem-notes" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Notes (optional)
              </label>
              <input
                id="sem-notes"
                type="text"
                value={semesterForm.notes}
                onChange={(e) => setSemesterForm({ ...semesterForm, notes: e.target.value })}
                placeholder="e.g. Dean's List, Backlog cleared, Major electives"
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSemesterId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Semester'}</span>
              </button>
            </div>
          </form>
        )}

        {semesters.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No semester results added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                className="p-4 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {sem.semester}
                    </h5>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {sem.resultYear ? `Year ${sem.resultYear}` : 'Self-reported'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${sem.semester}`}
                      onClick={() => openEditSemester(sem)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${sem.semester}`}
                      onClick={() => handleRemoveSemester(sem.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
                  {sem.sgpa !== undefined && (
                    <span>
                      <span className="text-slate-500 dark:text-slate-400">SGPA: </span>
                      <strong className="text-teal-700 dark:text-teal-400">{sem.sgpa}</strong>
                    </span>
                  )}
                  {sem.cgpa !== undefined && (
                    <span>
                      <span className="text-slate-500 dark:text-slate-400">CGPA: </span>
                      <strong className="text-slate-900 dark:text-slate-100">{sem.cgpa}</strong>
                    </span>
                  )}
                  {sem.earnedCredits !== undefined && (
                    <span>
                      <span className="text-slate-500 dark:text-slate-400">Credits: </span>
                      <strong className="text-slate-900 dark:text-slate-100">{sem.earnedCredits}</strong>
                    </span>
                  )}
                </div>

                {sem.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {sem.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </StudioPanel>
    </div>
  );
};
