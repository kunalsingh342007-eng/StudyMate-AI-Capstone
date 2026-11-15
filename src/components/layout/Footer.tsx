import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#07101E] border-t border-white/10 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 inline-flex">
              <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white">StudyMate AI</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Personal Learning Studio
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Plan clearly, explore connected concepts, and build lasting recall with adaptive schedules and focused practice.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
              Studio
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-teal-300 transition-colors">
                  Learning Studio
                </Link>
              </li>
              <li>
                <Link to="/planner" className="hover:text-teal-300 transition-colors">
                  Study Planner
                </Link>
              </li>
              <li>
                <Link to="/explain" className="hover:text-teal-300 transition-colors">
                  AI Explainer
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-teal-300 transition-colors">
                  Practice Quiz
                </Link>
              </li>
              <li>
                <Link to="/progress" className="hover:text-teal-300 transition-colors">
                  Progress &amp; Mastery
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
              Account
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/notes" className="hover:text-teal-300 transition-colors">
                  Study Notes
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-teal-300 transition-colors">
                  Academic Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-teal-300 transition-colors">
                  Preferences &amp; Settings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-300 transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Study Digest */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">
              Study Digest
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Occasional study methodology notes and feature updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-3 pr-10 py-2 bg-[#0F1D32] border border-[#1E2F47] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <div className="flex items-center gap-1.5 text-xs text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preference noted.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 StudyMate AI — Your Personal Learning Studio.</p>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Keyboard &amp; Reduced-Motion Ready
            </span>
            <Link to="/settings" className="hover:text-slate-300 transition-colors">
              Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
