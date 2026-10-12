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
  Clock,
  BookOpen,
  X,
  GraduationCap,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, onOpenAuthModal }) => {
  const { progress, userProfile, activePlan } = useStorage();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      className="w-64 sm:w-72 h-full flex flex-col bg-[#19112E] text-slate-200 border-r border-white/10 select-none shadow-xl shrink-0"
      aria-label="Application Sidebar"
    >
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">StudyMate</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-md">
                AI
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 font-medium">Personal Academic Copilot</p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-purple-300/50">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/8'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Mini Streak & Target Card in Sidebar */}
      <div className="px-4 py-3 mx-3 my-2 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{progress.streakDays || userProfile.streakDays || 7}-Day Streak</span>
          </div>
          <span className="text-[10px] text-purple-300 font-medium">Active</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-purple-200/70 font-medium">
            <span>Daily Goal</span>
            <span>
              {(progress.totalHoursStudied % userProfile.dailyGoalHours).toFixed(1)} / {userProfile.dailyGoalHours}h
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((progress.totalHoursStudied % userProfile.dailyGoalHours) / userProfile.dailyGoalHours) * 100) || 65
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* User Profile Mini Footer */}
      <div className="p-3.5 border-t border-white/10">
        <div className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between">
          <Link
            to="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0 flex-1 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-purple-300/30">
              {userProfile.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('') || 'AR'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                {userProfile.name || 'Alex Rivera'}
              </p>
              <p className="text-[10px] text-purple-200/60 truncate">
                {userProfile.email || 'alex.rivera@edu'}
              </p>
            </div>
          </Link>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              title="Switch Account / Sign In"
              className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-1"
              aria-label="Switch account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
