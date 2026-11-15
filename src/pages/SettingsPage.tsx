import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  BookOpen,
  Bell,
  Globe,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Trash2,
  Sun,
  Moon,
  Laptop,
  Clock,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FirestorePreferences } from '../services/firebase/firestoreService';
import { PageHeader, StudioPanel } from '../components/ui/Common';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    userProfile,
    preferences,
    updatePreferences,
    updateProfile,
    logout,
    resetPassword,
    deleteAccount,
  } = useAuth();
  const { showToast } = useToast();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(preferences.theme || 'light');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(
    preferences.dailyStudyGoalMinutes || 180
  );
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState<number>(
    preferences.defaultStudyDurationMinutes || 45
  );
  const [studyReminders, setStudyReminders] = useState<boolean>(
    preferences.studyRemindersEnabled ?? true
  );
  const [examReminders, setExamReminders] = useState<boolean>(
    preferences.examRemindersEnabled ?? true
  );
  const [interfaceLanguage, setInterfaceLanguage] = useState<string>(
    preferences.interfaceLanguage || 'English'
  );

  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (!preferences.preferredStudyDays) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return preferences.preferredStudyDays
      .split(',')
      .map((d) => d.trim())
      .filter((d) => ALL_DAYS.includes(d));
  });

  const [displayName, setDisplayName] = useState(userProfile.name || '');
  const [academicLevel, setAcademicLevel] = useState(userProfile.academicLevel || 'Undergraduate Senior');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resetSending, setResetSending] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme || 'light');
      setDailyGoalMinutes(preferences.dailyStudyGoalMinutes || 180);
      setDefaultDurationMinutes(preferences.defaultStudyDurationMinutes || 45);
      setStudyReminders(preferences.studyRemindersEnabled ?? true);
      setExamReminders(preferences.examRemindersEnabled ?? true);
      setInterfaceLanguage(preferences.interfaceLanguage || 'English');
      if (preferences.preferredStudyDays) {
        setSelectedDays(
          preferences.preferredStudyDays
            .split(',')
            .map((d) => d.trim())
            .filter((d) => ALL_DAYS.includes(d))
        );
      }
    }
  }, [preferences]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || '');
      setAcademicLevel(userProfile.academicLevel || 'Undergraduate Senior');
    }
  }, [userProfile]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<FirestorePreferences> = {
        theme,
        dailyStudyGoalMinutes: Number(dailyGoalMinutes) || 180,
        preferredStudyDays: selectedDays.join(', '),
        defaultStudyDurationMinutes: Number(defaultDurationMinutes) || 45,
        interfaceLanguage,
        studyRemindersEnabled: studyReminders,
        examRemindersEnabled: examReminders,
      };

      await updatePreferences(payload);

      if (
        displayName.trim() !== userProfile.name ||
        academicLevel !== userProfile.academicLevel ||
        Math.round((Number(dailyGoalMinutes) / 60) * 10) / 10 !== userProfile.dailyGoalHours
      ) {
        await updateProfile({
          name: displayName.trim() || userProfile.name,
          academicLevel,
          dailyGoalHours: Math.round((Number(dailyGoalMinutes) / 60) * 10) / 10,
        });
      }

      setSaveSuccess(true);
      showToast('Settings saved', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save preferences. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const targetEmail = currentUser?.email || userProfile.email;
    if (!targetEmail) {
      setErrorMessage('No valid registered email address found for password reset.');
      return;
    }

    setResetSending(true);
    setResetNotice(null);
    try {
      await resetPassword(targetEmail);
      setResetNotice(`Password reset link sent to ${targetEmail}. Please check your inbox.`);
      setTimeout(() => setResetNotice(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send password reset email.');
    } finally {
      setResetSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not delete account. Recent authentication is required.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        eyebrow="Account & Preferences"
        title="Settings"
        description="Customize your studio theme, daily study targets, language, and account security."
        actions={
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        }
      />

      {saveSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/50 text-lime-800 dark:text-lime-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-lime-600 dark:text-lime-400 shrink-0" />
          <span>Your preferences have been saved to your profile.</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SECTION 1: APPEARANCE */}
        <StudioPanel className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="appearance-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                1. Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the display theme for your learning studio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                id: 'light',
                title: 'Light Studio',
                desc: 'Warm off-white paper canvas with restrained teal accents',
                icon: Sun,
              },
              {
                id: 'dark',
                title: 'Dark Navy',
                desc: 'Deep navy study studio for low-glare evening sessions',
                icon: Moon,
              },
              {
                id: 'system',
                title: 'System Default',
                desc: 'Automatically matches your OS appearance preference',
                icon: Laptop,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-600 dark:border-teal-400 bg-[#F7F5EF] dark:bg-[#16263D] ring-2 ring-teal-600/20'
                      : 'border-[#E5E1D6] dark:border-[#1E2F47] bg-white dark:bg-[#0F1D32] hover:bg-[#F7F5EF] dark:hover:bg-[#16263D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'bg-[#EFECE3] dark:bg-[#16263D] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </StudioPanel>

        {/* SECTION 2: STUDY PREFERENCES */}
        <StudioPanel className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-700 dark:text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="study-preferences-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                2. Study Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your daily target, weekly schedule, and session lengths.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2.5 p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47]">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Daily Study Goal</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Target minutes of dedicated learning per day.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="number"
                  min={30}
                  max={720}
                  step={15}
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-28 px-3 py-2 text-sm font-bold border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl bg-white dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 tabular-nums"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                  min ({Math.round((dailyGoalMinutes / 60) * 10) / 10} hrs/day)
                </span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {[60, 120, 180, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer tabular-nums ${
                      dailyGoalMinutes === mins
                        ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600'
                        : 'bg-white dark:bg-[#0F1D32] text-slate-700 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    {mins / 60}h
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47]">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Default Study Session Duration</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recommended chunk size for AI-generated study tasks.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: 'Pomodoro (25m)', val: 25 },
                  { label: 'Standard (45m)', val: 45 },
                  { label: 'Deep Focus (60m)', val: 60 },
                  { label: 'Extended (90m)', val: 90 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setDefaultDurationMinutes(preset.val)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                      defaultDurationMinutes === preset.val
                        ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600'
                        : 'bg-white dark:bg-[#0F1D32] text-slate-700 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>Preferred Study Days</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select days of the week when StudyMate should schedule revision tasks.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_DAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-teal-700 text-white dark:bg-teal-600'
                        : 'bg-[#F7F5EF] dark:bg-[#16263D] text-slate-600 dark:text-slate-300 border border-[#E5E1D6] dark:border-[#1E2F47]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </StudioPanel>

        {/* SECTION 3: STUDY REMINDERS */}
        <StudioPanel className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="study-reminders-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                3. Study Reminders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control in-app notifications and exam deadline alerts.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  Daily Study Reminders
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify me of scheduled tasks and spaced retrieval reviews.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={studyReminders}
                  onChange={(e) => setStudyReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  Exam Countdown & Review Alerts
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Send reminders as target exam dates approach (7, 3, and 1 day prior).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={examReminders}
                  onChange={(e) => setExamReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
              </label>
            </div>
          </div>
        </StudioPanel>

        {/* SECTION 4: LANGUAGE */}
        <StudioPanel className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="language-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                4. Interface Language
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the primary language for AI explanations and study schedules.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Supported Languages
            </label>
            <select
              value={interfaceLanguage}
              onChange={(e) => setInterfaceLanguage(e.target.value)}
              className={`${inputClass} sm:w-80`}
            >
              <option value="English">English (United States / Global)</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="French">Français (French)</option>
              <option value="German">Deutsch (German)</option>
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              AI explanations and practice quizzes will respond in {interfaceLanguage}.
            </p>
          </div>
        </StudioPanel>

        {/* SECTION 5: ACCOUNT & PRIVACY */}
        <StudioPanel className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="w-9 h-9 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-700 dark:text-teal-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="account-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                5. Account & Privacy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your profile details, password reset, and account security.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || userProfile.email || 'Not signed in'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl bg-[#EFECE3]/60 dark:bg-[#0A1628] text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Academic Standing
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className={`${inputClass} sm:w-80`}
            >
              <option value="Undergraduate Freshman">Undergraduate Freshman</option>
              <option value="Undergraduate Sophomore">Undergraduate Sophomore</option>
              <option value="Undergraduate Junior">Undergraduate Junior</option>
              <option value="Undergraduate Senior">Undergraduate Senior</option>
              <option value="Graduate / Master's">Graduate / Master&apos;s</option>
              <option value="Competitive Exam Candidate">Competitive Exam Candidate</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {currentUser ? 'Authenticated with Firebase' : 'Local Browser Session'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              {currentUser ? 'Cloud Synced' : 'Local Storage'}
            </span>
          </div>

          {resetNotice && (
            <div className="p-3 rounded-xl bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/50 text-lime-800 dark:text-lime-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
              <span>{resetNotice}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={resetSending}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] text-teal-700 dark:text-teal-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{resetSending ? 'Sending Link...' : 'Send Password Reset Email'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Delete Account & Study Data</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Permanently remove your Firebase user profile and stored preferences.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </StudioPanel>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving Preferences...' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="bg-white dark:bg-[#0F1D32] rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-account-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Account Confirmation
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete your account? All profile details, preferences, and study configurations will be permanently removed.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Type <span className="font-mono text-rose-600 dark:text-rose-400">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-xs border border-rose-200 dark:border-rose-900/60 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
                className="flex-1 py-2.5 px-3 bg-[#EFECE3] dark:bg-[#16263D] hover:bg-[#E5E1D6] dark:hover:bg-[#1E2F47] text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
