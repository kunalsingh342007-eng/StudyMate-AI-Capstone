import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Flame,
  Calendar,
  Bell,
  Sparkles,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Globe,
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
  const { progress, activePlan, spacedReviews } = useStorage();
  const { userProfile, preferences, currentUser, logout, theme, setTheme } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Compute exam days remaining
  const examDateStr = activePlan?.examDate || userProfile.targetExamDate;
  const examDaysLeft = examDateStr
    ? Math.max(
        0,
        Math.ceil((new Date(examDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      )
    : 18;

  // Due reviews count
  const dueCount = spacedReviews.filter((r) => r.dueStatus === 'due' || r.dueStatus === 'overdue').length;

  const notifications = [
    {
      id: 'notif-1',
      title: 'Spaced Retrieval Ready',
      desc: `${dueCount || 1} high-yield concept review is due today for long-term retention.`,
      icon: Clock,
      color: 'text-violet-600 bg-violet-50',
      time: '10m ago',
      enabled: true,
    },
    {
      id: 'notif-2',
      title: 'Study Streak Milestone',
      desc: `You’ve maintained your streak for ${progress.streakDays || 7} consecutive days! Keep going!`,
      icon: Flame,
      color: 'text-amber-600 bg-amber-50',
      time: '2h ago',
      enabled: preferences.studyRemindersEnabled ?? true,
    },
    {
      id: 'notif-3',
      title: 'Target Exam Countdown',
      desc: `${examDaysLeft} days remaining until ${activePlan?.subject || userProfile.targetExam}.`,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50',
      time: 'Today',
      enabled: preferences.examRemindersEnabled ?? true,
    },
  ].filter((n) => n.enabled);

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/90 dark:bg-[#172033]/90 backdrop-blur-md border-b border-purple-100/80 dark:border-[#334155] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-[#26344B] lg:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#F8F7FC] dark:bg-[#26344B] hover:bg-[#F3F0FA] dark:hover:bg-[#1E293B] border border-purple-100 dark:border-[#334155] text-slate-500 dark:text-[#A7B4C8] hover:text-slate-700 dark:hover:text-white transition-colors text-xs sm:text-sm text-left shadow-2xs group cursor-pointer"
          aria-label="Search topics, tasks, notes"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">Search topics, tasks, notes...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-md">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Exam Countdown Pill */}
        <Link
          to="/planner"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          title="Days until target exam"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{examDaysLeft}d to Finals</span>
        </Link>

        {/* Streak Pill */}
        <Link
          to="/progress"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          title="Current active streak"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{progress.streakDays || userProfile.streakDays || 7}d</span>
        </Link>

        {/* Instant Theme Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(nextTheme);
          }}
          className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#26344B] border border-transparent hover:border-purple-100 dark:hover:border-[#334155] transition-all cursor-pointer"
          title={`Current Theme: ${theme.toUpperCase()} (Click to toggle)`}
          aria-label={`Toggle color theme. Current: ${theme}`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          ) : (
            <Laptop className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#26344B] border border-transparent hover:border-purple-100 dark:hover:border-[#334155] transition-all relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-[#172033]" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-[#172033] rounded-3xl shadow-xl border border-purple-100 dark:border-[#334155] z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100/80 dark:border-[#334155]">
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wide">
                    Study Notifications
                  </span>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {notifications.length > 0 ? `${notifications.length} Active` : 'Muted'}
                  </span>
                </div>

                <div className="space-y-2">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-2xl hover:bg-[#F8F7FC] dark:hover:bg-[#26344B] transition-colors flex items-start gap-3"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${n.color} dark:bg-purple-950/60 dark:text-purple-300`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">{n.title}</p>
                            <span className="text-[10px] text-slate-400 dark:text-[#64748B]">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-[#A7B4C8] mt-0.5 leading-snug">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  to="/progress"
                  onClick={() => setNotificationsOpen(false)}
                  className="block text-center text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 pt-1"
                >
                  View Learning Analytics &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-2xl hover:bg-purple-50 dark:hover:bg-[#26344B] transition-colors focus:outline-none cursor-pointer"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {userProfile.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('') || 'AR'}
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#172033] rounded-3xl shadow-xl border border-purple-100 dark:border-[#334155] z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-purple-100/80 dark:border-[#334155]">
                  <p className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">{userProfile.name || 'Alex Rivera'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B4C8] truncate">{userProfile.email || 'alex.rivera@edu'}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#A7B4C8] hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#26344B] rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Student Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#A7B4C8] hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#26344B] rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Settings & Preferences</span>
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{currentUser ? 'Sign Out' : 'Sign In'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
