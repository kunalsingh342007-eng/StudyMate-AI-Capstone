import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  HelpCircle,
  BarChart3,
  Sparkles,
  Settings,
  Menu,
  X,
  ArrowRight,
  Bookmark,
  GraduationCap,
} from 'lucide-react';
import { useAIStatus } from '../../hooks/useAIStatus';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { status } = useAIStatus();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/#how-it-works', label: 'How It Works' },
    { path: '/#features', label: 'Features' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/planner', label: 'Planner' },
    { path: '/explain', label: 'Explain' },
    { path: '/quiz', label: 'Quiz' },
    { path: '/progress', label: 'Progress' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#160F2C]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-[#19112E] border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand & Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-purple-400 rounded-lg"
            aria-label="StudyMate - Personal Academic Copilot"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  StudyMate
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-md">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                Academic Copilot
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isAnchor = item.path.includes('#');
              const isActive = !isAnchor && location.pathname === item.path;

              if (isAnchor) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'text-white bg-purple-600/40 border border-purple-400/40 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA & Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Log in
            </Link>

            <Link
              to="/dashboard"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center gap-2 group active:scale-[0.98]"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-purple-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#19112E] px-4 pt-3 pb-6 space-y-2 shadow-2xl">
          <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-white/10">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  location.pathname === item.path
                    ? 'bg-purple-600/40 text-purple-200 font-semibold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Student Sign In / Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};


