import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { userProfile, saveUserProfile } = useStorage();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState(userProfile.email || 'alex.rivera@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState(userProfile.name || 'Alex Rivera');
  const [academicLevel, setAcademicLevel] = useState(userProfile.academicLevel || 'Undergraduate Senior');
  const [isLoading, setIsLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

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
      setSuccessNotice(mode === 'signin' ? 'Welcome back! Logged in successfully.' : 'Account created successfully!');
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1000);
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
      setSuccessNotice('Signed in with Demo Student profile!');
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 900);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#241442] to-[#431B75] p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold tracking-widest text-purple-200 uppercase">StudyMate AI</span>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back!' : 'Start Learning Smarter'}
          </h2>
          <p className="text-xs text-purple-200/80 mt-1">
            {mode === 'signin'
              ? 'Access your personalized study schedule, notes, and quiz mastery'
              : 'Join thousands of students mastering their academic goals with AI'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-5 pb-2 flex border-b border-purple-100/80">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              mode === 'signin'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          {successNotice ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold">{successNotice}</p>
            </div>
          ) : (
            <>
              {/* Demo quick signin */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Continue as Demo Student (Alex Rivera)</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-medium text-slate-600 uppercase">
                  or with email
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 focus:border-purple-600"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Level</label>
                    <select
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
                    >
                      <option value="High School">High School</option>
                      <option value="Undergraduate Junior">Undergraduate Junior</option>
                      <option value="Undergraduate Senior">Undergraduate Senior</option>
                      <option value="Graduate Student">Graduate Student</option>
                      <option value="Self-Taught / Professional">Self-Taught / Professional</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-600 inline" />
                  <span>Your study data and schedule stay secure & private</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
