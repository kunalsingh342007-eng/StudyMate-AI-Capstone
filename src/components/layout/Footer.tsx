import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

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
    <footer className="bg-[#071923] border-t border-[#132F3E] text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group inline-block">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F364C] to-[#0A2433] border border-[#204E68] text-sky-400 flex items-center justify-center shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white">StudyMate</span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Personal Study Planner
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Study smarter. Stay ahead. The personal study companion that turns ambitious syllabi into realistic daily progress.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E2838] border border-[#173D54] flex items-center justify-center text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E2838] border border-[#173D54] flex items-center justify-center text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E2838] border border-[#173D54] flex items-center justify-center text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E2838] border border-[#173D54] flex items-center justify-center text-slate-400 hover:text-sky-300 hover:border-sky-500/50 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/planner" className="hover:text-white transition-colors">
                  Smart Timetable
                </Link>
              </li>
              <li>
                <Link to="/explain" className="hover:text-white transition-colors">
                  Concept Explainer
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-white transition-colors">
                  Active Recall Quizzes
                </Link>
              </li>
              <li>
                <Link to="/progress" className="hover:text-white transition-colors">
                  Academic Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Company */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">
                  Preferences & Settings
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ & Support
                </a>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Study Tips Blog</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Community</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Newsletter</h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Get study tips and productivity insights in your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-3 pr-10 py-2.5 bg-[#0D2732] border border-[#1A455C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-[#1A5C7A] hover:bg-[#22779E] text-white flex items-center justify-center transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed! Check your inbox soon.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#132F3E] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 StudyMate. Personal Study Planner. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> WCAG 2.1 AA Compliant
            </span>
            <Link to="/settings" className="hover:text-slate-300 transition-colors">
              Privacy & Diagnostic
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

