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
  Mail,
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
import { FirestorePreferences } from '../services/firebase/firestoreService';

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
    isDemoMode,
  } = useAuth();

  // Local form state initialized from Firestore preferences
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

  // Preferred days parsing
  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (!preferences.preferredStudyDays) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return preferences.preferredStudyDays
      .split(',')
      .map((d) => d.trim())
      .filter((d) => ALL_DAYS.includes(d));
  });

  // Account details state
  const [displayName, setDisplayName] = useState(userProfile.name || '');
  const [academicLevel, setAcademicLevel] = useState(userProfile.academicLevel || 'Undergraduate Senior');

  // UI feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password reset action feedback
  const [resetSending, setResetSending] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Danger zone deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync when preferences change from external observer
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
      if (selectedDays.length === 1) return; // Keep at least one day
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

      // Update Firestore preferences document
      await updatePreferences(payload);

      // Also update display name and academic level if changed
      if (displayName.trim() && displayName !== userProfile.name) {
        await updateProfile({
          name: displayName.trim(),
          academicLevel,
          dailyGoalHours: Math.round((Number(dailyGoalMinutes) / 60) * 10) / 10,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save preferences to Cloud Firestore. Please retry.');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-purple-100/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
            ACCOUNT & PREFERENCES
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight mt-1">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize your study workspace, session defaults, daily goals, and privacy options.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your preferences have been saved securely to your Cloud Firestore profile.</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* =========================================
            SECTION 1: APPEARANCE
           ========================================= */}
        <section
          aria-labelledby="appearance-heading"
          className="bg-white rounded-3xl border border-purple-100/90 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-50">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="appearance-heading" className="text-base sm:text-lg font-bold text-slate-900">
                1. Appearance
              </h2>
              <p className="text-xs text-slate-500">
                Choose the display theme for your StudyMate AI learning workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                id: 'light',
                title: 'Light Theme',
                desc: 'Soft lavender canvas with deep purple accents',
                icon: Sun,
              },
              {
                id: 'dark',
                title: 'Dark Theme',
                desc: 'Deep indigo night mode for focused evening study',
                icon: Moon,
              },
              {
                id: 'system',
                title: 'System Default',
                desc: 'Automatically matches your OS dark/light mode',
                icon: Laptop,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-purple-100" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================
            SECTION 2: STUDY PREFERENCES
           ========================================= */}
        <section
          aria-labelledby="study-preferences-heading"
          className="bg-white rounded-3xl border border-purple-100/90 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-50">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="study-preferences-heading" className="text-base sm:text-lg font-bold text-slate-900">
                2. Study Preferences
              </h2>
              <p className="text-xs text-slate-500">
                Configure your daily target, weekly schedule, and typical study session durations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Daily Study Goal */}
            <div className="space-y-2 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/80">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Daily Study Goal</span>
              </label>
              <p className="text-[11px] text-slate-500">
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
                  className="w-32 px-3.5 py-2 text-sm font-bold border border-purple-200 rounded-xl bg-white focus:outline-purple-600 focus:border-purple-600 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-600">
                  minutes ({Math.round((dailyGoalMinutes / 60) * 10) / 10} hours / day)
                </span>
              </div>
              <div className="flex gap-1.5 pt-2">
                {[60, 120, 180, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                      dailyGoalMinutes === mins
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    {mins / 60}h
                  </button>
                ))}
              </div>
            </div>

            {/* Default Session Duration */}
            <div className="space-y-2 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/80">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Default Study Session Duration</span>
              </label>
              <p className="text-[11px] text-slate-500">
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left cursor-pointer transition-colors ${
                      defaultDurationMinutes === preset.val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferred Study Days */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Preferred Study Days</span>
            </label>
            <p className="text-[11px] text-slate-500">
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            SECTION 3: STUDY REMINDERS
           ========================================= */}
        <section
          aria-labelledby="study-reminders-heading"
          className="bg-white rounded-3xl border border-purple-100/90 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-50">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="study-reminders-heading" className="text-base sm:text-lg font-bold text-slate-900">
                3. Study Reminders
              </h2>
              <p className="text-xs text-slate-500">
                Control timely in-app notifications and reminder alerts.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Daily Streak Reminders */}
            <div className="p-4 rounded-2xl bg-purple-50/20 border border-purple-100/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  Daily Study Reminders
                </span>
                <p className="text-[11px] text-slate-500">
                  Notify me of scheduled tasks and active study streak milestones.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={studyReminders}
                  onChange={(e) => setStudyReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {/* Exam Countdown Reminders */}
            <div className="p-4 rounded-2xl bg-purple-50/20 border border-purple-100/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  Exam Countdown & Review Alerts
                </span>
                <p className="text-[11px] text-slate-500">
                  Send high-priority reminders as target exam dates approach (7 days, 3 days, 1 day prior).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={examReminders}
                  onChange={(e) => setExamReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          </div>
        </section>

        {/* =========================================
            SECTION 4: LANGUAGE
           ========================================= */}
        <section
          aria-labelledby="language-heading"
          className="bg-white rounded-3xl border border-purple-100/90 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-50">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="language-heading" className="text-base sm:text-lg font-bold text-slate-900">
                4. Interface Language
              </h2>
              <p className="text-xs text-slate-500">
                Choose the primary language for AI explanations, study schedules, and UI elements.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Supported Languages</label>
            <select
              value={interfaceLanguage}
              onChange={(e) => setInterfaceLanguage(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2.5 text-xs sm:text-sm border border-purple-200 rounded-xl focus:outline-purple-600 focus:border-purple-600 bg-white text-slate-900"
            >
              <option value="English">English (United States / Global) — Fully Supported</option>
              <option value="Spanish">Español (Spanish) — Explanations Supported</option>
              <option value="French">Français (French) — Explanations Supported</option>
              <option value="German">Deutsch (German) — Explanations Supported</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Explanations and quizzes will be generated in {interfaceLanguage} by Google Gemini.
            </p>
          </div>
        </section>

        {/* =========================================
            SECTION 5: ACCOUNT & PRIVACY
           ========================================= */}
        <section
          aria-labelledby="account-heading"
          className="bg-white rounded-3xl border border-purple-100/90 p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-50">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="account-heading" className="text-base sm:text-lg font-bold text-slate-900">
                5. Account & Privacy
              </h2>
              <p className="text-xs text-slate-500">
                Manage your credentials, password reset, and account security.
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-purple-200 rounded-xl focus:outline-purple-600 focus:border-purple-600 bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Account Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || userProfile.email || 'alex.rivera@university.edu'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Academic Standing</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2.5 text-xs sm:text-sm border border-purple-200 rounded-xl focus:outline-purple-600 focus:border-purple-600 bg-white text-slate-900"
            >
              <option value="Undergraduate Freshman">Undergraduate Freshman</option>
              <option value="Undergraduate Sophomore">Undergraduate Sophomore</option>
              <option value="Undergraduate Junior">Undergraduate Junior</option>
              <option value="Undergraduate Senior">Undergraduate Senior</option>
              <option value="Graduate / Master's">Graduate / Master&apos;s</option>
              <option value="Competitive Exam Candidate">Competitive Exam Candidate</option>
            </select>
          </div>

          {/* Account Status Badge */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-slate-800">
                {currentUser ? 'Authenticated with Firebase' : 'Demo Mode Student Profile'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-800">
              {currentUser ? 'Cloud Synced' : 'Sandbox Active'}
            </span>
          </div>

          {/* Password Reset Notice */}
          {resetNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetNotice}</span>
            </div>
          )}

          {/* Account Actions: Reset Password & Logout */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={resetSending}
              className="px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>{resetSending ? 'Sending Link...' : 'Send Password Reset Email'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Safe Account Deletion Area */}
          <div className="mt-6 pt-5 border-t border-rose-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-900 block flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Delete Account & Study Data</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Permanently delete your Firebase authentication user profile and preferences.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </section>

        {/* Floating Bottom Save Bar for Mobile/Easy access */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
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

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-account-title" className="text-base font-bold text-slate-900">
                  Delete Account Confirmation
                </h3>
                <p className="text-xs text-rose-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete your account? All your student profile information,
              preferences, and study configurations will be permanently removed.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Type <span className="font-mono text-rose-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-xs border border-rose-200 rounded-xl focus:outline-rose-600 bg-white font-mono text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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
