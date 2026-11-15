import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Flame,
  Award,
  CheckCircle2,
  User,
  BookOpen,
  Target,
  Code2,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserProfile } from '../types';
import { PageHeader, StudioPanel } from '../components/ui/Common';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileOverviewTab } from '../components/profile/ProfileOverviewTab';
import { AcademicHistoryTab } from '../components/profile/AcademicHistoryTab';
import { GoalsMilestonesTab } from '../components/profile/GoalsMilestonesTab';
import { SkillsPortfolioTab } from '../components/profile/SkillsPortfolioTab';
import { StudyPreferencesTab } from '../components/profile/StudyPreferencesTab';

type ProfileTabId = 'overview' | 'academics' | 'goals' | 'portfolio' | 'preferences';

const PROFILE_TABS: {
  id: ProfileTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'portfolio', label: 'Skills & Projects', icon: Code2 },
  { id: 'preferences', label: 'Study Preferences', icon: SlidersHorizontal },
];

export const ProfilePage: React.FC = () => {
  const { userProfile: storageProfile, progress, activePlan, studySessions } = useStorage();
  const {
    currentUser,
    userProfile: authProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
  } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTabParam = searchParams.get('tab') as ProfileTabId | null;
  const validTab = PROFILE_TABS.some((t) => t.id === initialTabParam)
    ? (initialTabParam as ProfileTabId)
    : 'overview';

  const [activeTab, setActiveTab] = useState<ProfileTabId>(validTab);
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get('tab') as ProfileTabId | null;
    if (param && PROFILE_TABS.some((t) => t.id === param)) {
      setActiveTab(param);
    }
  }, [searchParams]);

  // Merge authProfile & storageProfile cleanly without overwriting populated fields
  const mergedProfile: UserProfile = {
    ...authProfile,
    ...storageProfile,
    email: storageProfile.email || authProfile.email || currentUser?.email || '',
  };

  const handleSelectTab = (tabId: ProfileTabId) => {
    setActiveTab(tabId);
    setSaveError(null);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleTopEditClick = () => {
    handleSelectTab('overview');
    setIsEditingOverview(true);
  };

  const handleSaveProfile = async (patch: Partial<UserProfile>) => {
    setSaveError(null);
    try {
      await updateProfile(patch);
      showToast({
        variant: 'success',
        title: 'Profile saved',
        description: currentUser
          ? 'Updated locally and synced to your account.'
          : 'Saved to your local profile.',
      });
    } catch (err: any) {
      const message =
        err?.message ||
        'Could not sync profile changes to the cloud database. Please retry.';
      setSaveError(message);
      showToast({
        variant: 'error',
        title: 'Cloud sync failed',
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleUploadAvatar = async (dataUrl: string, mimeType: string) => {
    setSaveError(null);
    try {
      await uploadAvatar(dataUrl, mimeType);
      showToast({
        variant: 'success',
        title: 'Profile picture updated',
      });
    } catch (err: any) {
      const message = err?.message || 'Could not save profile picture to cloud storage.';
      setSaveError(message);
      showToast({
        variant: 'error',
        title: 'Photo upload issue',
        description: message,
      });
      throw err;
    }
  };

  const handleRemoveAvatar = async () => {
    setSaveError(null);
    try {
      await removeAvatar();
      showToast({
        variant: 'info',
        title: 'Profile picture removed',
      });
    } catch (err: any) {
      const message = err?.message || 'Could not remove profile picture from cloud storage.';
      setSaveError(message);
      showToast({
        variant: 'error',
        title: 'Photo removal issue',
        description: message,
      });
      throw err;
    }
  };

  const effectiveExamDate = mergedProfile.targetExamDate || activePlan?.examDate;
  const examDaysLeft = effectiveExamDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(effectiveExamDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Student Profile"
        title="Student Profile"
        description="Manage your personal overview, academic history, personal goals, skills, portfolio, and study preferences."
      />

      {saveError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Top Student Profile Header */}
      <ProfileHeader
        profile={mergedProfile}
        emailVerified={currentUser?.emailVerified}
        isSignedIn={Boolean(currentUser)}
        onEditClick={handleTopEditClick}
        onUploadAvatar={handleUploadAvatar}
        onRemoveAvatar={handleRemoveAvatar}
      />

      {/* Core Recorded Study Stats (strictly from real user activity) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StudioPanel className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] text-amber-600 dark:text-amber-400 border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Study Streak</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progress.streakDays} Days
            </p>
          </div>
        </StudioPanel>

        <StudioPanel className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] text-lime-600 dark:text-lime-400 border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progress.completedTasksCount}
            </p>
          </div>
        </StudioPanel>

        <StudioPanel className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Study Time</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progress.totalHoursStudied} hrs
            </p>
          </div>
        </StudioPanel>

        <StudioPanel className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {progress.quizzesTaken > 0 ? 'Quiz Average' : 'Exam Countdown'}
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progress.quizzesTaken > 0
                ? `${progress.averageQuizScore}%`
                : examDaysLeft !== null
                ? `${examDaysLeft} days`
                : '—'}
            </p>
          </div>
        </StudioPanel>
      </div>

      {/* Section Navigation Tabs */}
      <nav
        aria-label="Profile Sections"
        role="tablist"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E1D6] dark:border-[#1E2F47]"
      >
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => handleSelectTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300 bg-white dark:bg-[#0F1D32]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Section Panel */}
      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'overview' && (
          <ProfileOverviewTab
            profile={mergedProfile}
            isEditing={isEditingOverview}
            onSetEditing={setIsEditingOverview}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'academics' && (
          <AcademicHistoryTab
            profile={mergedProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsMilestonesTab
            profile={mergedProfile}
            progress={progress}
            studySessions={studySessions}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'portfolio' && (
          <SkillsPortfolioTab
            profile={mergedProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'preferences' && (
          <StudyPreferencesTab
            profile={mergedProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </div>
    </div>
  );
};
