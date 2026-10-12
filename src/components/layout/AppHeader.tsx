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
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';

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
  const { progress, userProfile, activePlan, spacedReviews } = useStorage();
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
    },
    {
      id: 'notif-2',
      title: 'Study Streak Milestone',
      desc: `You’ve maintained your streak for ${progress.streakDays || 7} consecutive days! Keep going!`,
      icon: Flame,
      color: 'text-amber-600 bg-amber-50',
      time: '2h ago',
    },
    {
      id: 'notif-3',
      title: 'Target Exam Countdown',
      desc: `${examDaysLeft} days remaining until ${activePlan?.subject || userProfile.targetExam}.`,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50',
      time: 'Today',
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/90 backdrop-blur-md border-b border-purple-100/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-purple-50 lg:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#F8F7FC] hover:bg-[#F3F0FA] border border-purple-100 text-slate-400 hover:text-slate-600 transition-colors text-xs sm:text-sm text-left shadow-2xs group"
          aria-label="Search topics, tasks, notes"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">Search topics, tasks, notes...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-100/70 border border-purple-200 rounded-md">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Exam Countdown Pill */}
        <Link
          to="/planner"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-semibold hover:bg-purple-100 transition-colors"
          title="Days until target exam"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          <span>{examDaysLeft}d to Finals</span>
        </Link>

        {/* Streak Pill */}
        <Link
          to="/progress"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
          title="Current active streak"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{progress.streakDays || userProfile.streakDays || 7}d</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-transparent hover:border-purple-100 transition-all relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-3xl shadow-xl border border-purple-100 z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100/80">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Study Notifications
                  </span>
                  <span className="text-[11px] font-semibold text-purple-600">3 New</span>
                </div>

                <div className="space-y-2">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-2xl hover:bg-[#F8F7FC] transition-colors flex items-start gap-3"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${n.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  to="/progress"
                  onClick={() => setNotificationsOpen(false)}
                  className="block text-center text-xs font-semibold text-purple-700 hover:text-purple-800 pt-1"
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
            className="flex items-center gap-2 p-1 pl-1.5 rounded-2xl hover:bg-purple-50 transition-colors focus:outline-none"
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-purple-100 z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-purple-100/80">
                  <p className="text-xs font-bold text-slate-900 truncate">{userProfile.name || 'Alex Rivera'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userProfile.email || 'alex.rivera@edu'}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-purple-600" />
                  <span>Student Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-purple-600" />
                  <span>Settings & Preferences</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Switch Account / Sign In</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
