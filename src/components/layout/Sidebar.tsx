import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  HelpCircle,
  BarChart3,
  FileText,
  User,
  Settings,
  Flame,
  X,
  GraduationCap,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, onOpenAuthModal }) => {
  const { progress, activePlan, studySessions } = useStorage();
  const { userProfile, preferences, currentUser, logout } = useAuth();

  const dailyGoalHours = preferences.dailyStudyGoalMinutes
    ? Math.round((preferences.dailyStudyGoalMinutes / 60) * 10) / 10
    : userProfile.dailyGoalHours || 3;

  // Compute real today study minutes from logged sessions or completed tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLoggedMinutes = studySessions
    .filter((s) => s.date === todayStr)
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
  const todayLoggedHours = Math.round((todayLoggedMinutes / 60) * 10) / 10;

  const hasEarnedStreak =
    progress.completedTasksCount > 0 || progress.quizzesTaken > 0 || studySessions.length > 0;
  const displayStreak = hasEarnedStreak ? progress.streakDays : 0;

  const planCompletedCount = activePlan
    ? activePlan.tasks.filter((t) => t.status === 'completed').length
    : 0;
  const planTotalCount = activePlan ? activePlan.tasks.length : 0;
  const dailyRatio =
    dailyGoalHours > 0 ? Math.min(100, Math.round((todayLoggedHours / dailyGoalHours) * 100)) : 0;

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

  const navItems = [
    { path: '/dashboard', label: 'Studio Home', icon: LayoutDashboard },
    { path: '/planner', label: 'Study Planner', icon: Calendar },
    { path: '/explain', label: 'AI Explainer', icon: Sparkles },
    { path: '/quiz', label: 'Practice Quiz', icon: HelpCircle },
    { path: '/progress', label: 'Progress & Mastery', icon: BarChart3 },
    { path: '/notes', label: 'Study Notes', icon: FileText },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className="w-64 sm:w-72 h-full flex flex-col bg-[#0A1628] text-slate-200 border-r border-white/10 select-none shrink-0"
      aria-label="Application Sidebar"
    >
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">StudyMate</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-400/25 rounded">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Personal Learning Studio</p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-500">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-200 border border-teal-400/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/6 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Honest Study Snapshot Card in Sidebar */}
      <div className="px-4 py-3.5 mx-3 my-2 rounded-xl bg-[#0F1D32] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs tabular-nums">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{displayStreak > 0 ? `${displayStreak}-Day Streak` : 'No streak yet'}</span>
          </div>
          {activePlan && (
            <span className="text-[11px] font-mono text-teal-300 tabular-nums">
              {planCompletedCount}/{planTotalCount}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium tabular-nums">
            <span>Today&apos;s Focus</span>
            <span className="text-slate-200">
              {todayLoggedHours}h / {dailyGoalHours}h
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${dailyRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* User Profile Mini Footer */}
      <div className="p-3.5 border-t border-white/10">
        <div className="p-2.5 rounded-xl bg-[#0F1D32] border border-white/10 flex items-center justify-between gap-2">
          <Link
            to="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0 flex-1 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600/25 border border-teal-400/30 text-teal-200 font-bold text-xs flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={async () => {
              if (currentUser) {
                await logout();
              } else if (onOpenAuthModal) {
                onOpenAuthModal();
              }
            }}
            title={currentUser ? 'Sign Out' : 'Sign In'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label={currentUser ? 'Sign Out' : 'Sign In'}
          >
            {currentUser ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
