import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Heart, Terminal, Sparkles } from 'lucide-react';
import { useAIStatus } from '../../hooks/useAIStatus';

export const Footer: React.FC = () => {
  const { status } = useAIStatus();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">StudyMate AI</span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              An evidence-informed AI study planner and pedagogical assistant. Built with React, TypeScript, Tailwind CSS, and Anthropic Claude API for the Week 8 Frontend AI Engineering capstone.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-exposure server-side API architecture &bull; MIT License</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Core Modules</h2>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Daily Study Dashboard
                </Link>
              </li>
              <li>
                <Link to="/planner" className="hover:text-indigo-600 transition-colors">
                  AI Study Planner
                </Link>
              </li>
              <li>
                <Link to="/explain" className="hover:text-indigo-600 transition-colors">
                  Topic Explainer
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-indigo-600 transition-colors">
                  AI Practice Quizzes
                </Link>
              </li>
              <li>
                <Link to="/progress" className="hover:text-indigo-600 transition-colors">
                  Progress Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Engine Specs */}
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">AI Intelligence</h2>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span>Provider</span>
                <span className="font-semibold text-indigo-600">Anthropic Claude</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Active Model</span>
                <span className="font-mono text-[11px] truncate max-w-[120px]" title={status.model}>{status.model}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Output Format</span>
                <span>Structured JSON (Zod)</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Status</span>
                <span className={status.isConfigured ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {status.isConfigured ? 'Connected' : 'Demo Fallback Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} StudyMate AI. Built for collegiate and competitive exam learners.</p>
          <div className="flex items-center gap-4">
            <Link to="/settings" className="hover:text-slate-600 transition-colors">
              Settings & Diagnostics
            </Link>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> & Claude
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
