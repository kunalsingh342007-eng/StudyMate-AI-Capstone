import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Shield,
  BookOpen,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, saveUserProfile } = useStorage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(userProfile.email || 'alex.rivera@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState(userProfile.name || 'Alex Rivera');
  const [academicLevel, setAcademicLevel] = useState(userProfile.academicLevel || 'Undergraduate Senior');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      saveUserProfile({
        name: name.trim() || 'Alex Rivera',
        email: email.trim() || 'alex.rivera@university.edu',
        academicLevel,
      });
      setIsLoading(false);
      setSuccessMessage(mode === 'signin' ? 'Welcome back! Redirecting...' : 'Account created! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    }, 500);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      saveUserProfile({
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        academicLevel: 'Undergraduate Senior',
      });
      setIsLoading(false);
      setSuccessMessage('Signed in as Alex Rivera (Demo Student). Enjoy!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#1E1B4B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-200/50 via-violet-100/30 to-transparent blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-6">
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold tracking-tight text-[#1E1B4B]">StudyMate</span>
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md border border-purple-200">
              AI Copilot
            </span>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
          {mode === 'signin' ? 'Sign in to your study workspace' : 'Create your student copilot account'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Personalized syllabus tracking, spaced retrieval, and adaptive AI tutoring
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-950/5 border border-purple-100 overflow-hidden">
          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="flex border-b border-purple-100 bg-purple-50/40 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-purple-900 shadow-xs border border-purple-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-purple-900 shadow-xs border border-purple-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Quick Demo Access banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                  <span>Instant Demo Mode</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Explore full features with preloaded CS syllabus and study plan
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="px-3.5 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-100/60 border border-purple-200 rounded-xl transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                Enter Demo &rarr;
              </button>
            </div>

            {/* Success notification */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:outline-purple-600 focus:border-purple-600 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">University / Academic Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:outline-purple-600 focus:border-purple-600 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => alert('Demo password reset link has been simulated for your university email.')}
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-800"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:outline-purple-600 focus:border-purple-600 bg-white"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Academic Standing</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:outline-purple-600 focus:border-purple-600 bg-white text-slate-900"
                  >
                    <option value="Undergraduate Freshman">Undergraduate Freshman</option>
                    <option value="Undergraduate Sophomore">Undergraduate Sophomore</option>
                    <option value="Undergraduate Junior">Undergraduate Junior</option>
                    <option value="Undergraduate Senior">Undergraduate Senior</option>
                    <option value="Graduate / Master's">Graduate / Master&apos;s</option>
                    <option value="Competitive Exam Candidate">Competitive Exam Candidate (GATE, GRE, MCAT)</option>
                  </select>
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-purple-300"
                    />
                    <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-purple-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Data stored locally in your private browser sandbox</span>
            </div>
          </div>
        </div>

        {/* Footer link to landing */}
        <p className="text-center text-xs text-slate-500 mt-6">
          <Link to="/" className="text-purple-600 font-semibold hover:underline">
            &larr; Back to StudyMate AI Overview
          </Link>
        </p>
      </div>
    </div>
  );
};
