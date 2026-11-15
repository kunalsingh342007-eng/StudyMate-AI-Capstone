import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/#how-it-works', label: 'How It Works' },
    { path: '/#features', label: 'Features' },
    { path: '/planner', label: 'Planner' },
    { path: '/explain', label: 'AI Explainer' },
    { path: '/quiz', label: 'Practice Quiz' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#07101E]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-[#0A1628] border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand & Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 focus-visible:outline-2 focus-visible:outline-teal-400 rounded-lg"
            aria-label="StudyMate AI — Personal Learning Studio"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-lg font-bold tracking-tight text-white">StudyMate AI</span>
              <span className="hidden sm:inline text-xs text-slate-400 font-normal">
                · Learning Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (max 5 concise links, single-line) */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isAnchor = item.path.includes('#');
              const isActive = !isAnchor && location.pathname === item.path;

              if (isAnchor) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-teal-200 bg-teal-500/15 border border-teal-400/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/8 border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA & Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {!currentUser && (
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors whitespace-nowrap"
              >
                Sign in
              </Link>
            )}

            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-teal-400 cursor-pointer"
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
        <div className="lg:hidden border-t border-white/10 bg-[#0A1628] px-4 pt-3 pb-6 space-y-2 shadow-2xl">
          <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-white/10">
            {navLinks.map((item) =>
              item.path.includes('#') ? (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-white/10"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-teal-500/20 text-teal-200 font-semibold'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl flex items-center justify-center gap-2"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!currentUser && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-center text-xs font-medium text-slate-300 hover:text-white"
              >
                Sign in or create account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
