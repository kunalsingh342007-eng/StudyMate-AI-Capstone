import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Flame,
  Calendar,
  Bell,
  User,
  Settings,
  LogOut,
  LogIn,
  Clock,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenAuthModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenAuthModal,
}) => {
  const { progress, activePlan, spacedReviews, studySessions } = useStorage();
  const { userProfile, preferences, currentUser, logout, theme, setTheme } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const examDateStr = activePlan?.examDate || userProfile.targetExamDate;
  const examDaysLeft = examDateStr
    ? Math.max(
        0,
        Math.ceil((new Date(examDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      )
    : null;

  const dueCount = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length;
  const hasEarnedStreak =
    progress.completedTasksCount > 0 || progress.quizzesTaken > 0 || studySessions.length > 0;
  const displayStreak = hasEarnedStreak ? progress.streakDays : 0;

  const displayName = currentUser?.displayName || userProfile.name || 'Student';
  const displayEmail = currentUser?.email || userProfile.email || 'Local Workspace';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';

  const notifications = [
    ...(dueCount > 0
      ? [
          {
            id: 'notif-reviews',
            title: 'Spaced Reviews Due',
            desc: `${dueCount} concept review${dueCount === 1 ? '' : 's'} ready for active recall today.`,
            icon: Clock,
            color: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/50',
            time: 'Today',
          },
        ]
      : []),
    ...(hasEarnedStreak && (preferences.studyRemindersEnabled ?? true)
      ? [
          {
            id: 'notif-streak',
            title: 'Active Study Streak',
            desc: `${displayStreak} day${displayStreak === 1 ? '' : 's'} of logged progress.`,
            icon: Flame,
            color: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50',
            time: 'Active',
          },
        ]
      : []),
    ...(examDaysLeft !== null && (activePlan?.subject || userProfile.targetExam) && (preferences.examRemindersEnabled ?? true)
      ? [
          {
            id: 'notif-exam',
            title: 'Target Exam Timeline',
            desc: `${examDaysLeft} days remaining until ${activePlan?.subject || userProfile.targetExam}.`,
            icon: Calendar,
            color: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/50',
            time: 'Schedule',
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-18 bg-[#F7F5EF]/95 dark:bg-[#0A1628]/95 backdrop-blur-sm border-b border-[#E5E1D6] dark:border-[#1E2F47] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#EFECE3] dark:hover:bg-[#16263D] lg:hidden cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3]/60 dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-xs sm:text-sm text-left cursor-pointer"
          aria-label="Search topics, tasks, notes"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Search topics, concepts, notes...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {examDaysLeft !== null && (activePlan?.examDate || userProfile.targetExamDate) && (
          <Link
            to="/planner"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-teal-400 dark:hover:border-teal-600 transition-colors whitespace-nowrap tabular-nums"
            title="Days until target exam"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{examDaysLeft}d to Exam</span>
          </Link>
        )}

        <Link
          to="/progress"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-amber-400 dark:hover:border-amber-500/60 transition-colors whitespace-nowrap tabular-nums"
          title="Current active streak"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>{displayStreak}d</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(nextTheme);
          }}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white dark:hover:bg-[#16263D] border border-transparent hover:border-[#E5E1D6] dark:hover:border-[#1E2F47] transition-colors cursor-pointer"
          title={`Theme: ${theme} (click to switch)`}
          aria-label={`Toggle color theme. Current: ${theme}`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-teal-400" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Laptop className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white dark:hover:bg-[#16263D] border border-transparent hover:border-[#E5E1D6] dark:hover:border-[#1E2F47] transition-colors relative cursor-pointer"
            aria-label="View study notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 ring-2 ring-[#F7F5EF] dark:ring-[#0A1628]" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0F1D32] rounded-2xl shadow-xl border border-[#E5E1D6] dark:border-[#1E2F47] z-50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Study Updates
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-teal-700 dark:text-teal-400">
                    {notifications.length} Active
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                    No active reminders right now.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] transition-colors flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${n.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {n.title}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link
                  to="/progress"
                  onClick={() => setNotificationsOpen(false)}
                  className="block text-center text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline pt-1"
                >
                  Open Progress Overview &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white dark:hover:bg-[#16263D] transition-colors focus:outline-none cursor-pointer"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0A1628] dark:bg-teal-600/25 border border-[#E5E1D6] dark:border-teal-400/30 text-white dark:text-teal-200 font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F1D32] rounded-2xl shadow-xl border border-[#E5E1D6] dark:border-[#1E2F47] z-50 p-2 space-y-1">
                <div className="px-3 py-2 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {displayEmail}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Student Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-[#F7F5EF] dark:hover:bg-[#16263D] rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Settings &amp; Preferences</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    if (currentUser) {
                      await logout();
                    } else {
                      onOpenAuthModal();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer"
                >
                  {currentUser ? (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-teal-700 dark:text-teal-300">Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
