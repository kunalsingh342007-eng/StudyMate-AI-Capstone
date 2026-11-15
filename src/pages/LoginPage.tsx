import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    login,
    loginWithGoogle,
    register,
    resetPassword,
    isFirebaseConfigured,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate Senior');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
        setSuccessMessage('Welcome back! Redirecting to your learning studio...');
      } else {
        await register({
          email,
          password,
          displayName: name,
          academicLevel,
        });
        setSuccessMessage('Account created! Preparing your learning studio...');
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await loginWithGoogle();
      setSuccessMessage('Signed in with Google! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    setForgotLoading(true);

    try {
      await resetPassword(forgotEmail);
      setForgotStatus({
        type: 'success',
        message: 'Password reset link sent! Please check your email inbox.',
      });
    } catch (error: any) {
      setForgotStatus({
        type: 'error',
        message: error?.message || 'Could not send reset email. Please verify the address.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass =
    'w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500';

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0A1628] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 px-4">
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="w-11 h-11 rounded-xl bg-[#0A1628] dark:bg-[#16263D] border border-[#1E2F47] flex items-center justify-center text-teal-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              StudyMate AI
            </span>
            <span className="block text-[11px] font-mono text-teal-700 dark:text-teal-400">
              Personal Learning Studio
            </span>
          </div>
        </Link>
        <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {mode === 'signin' ? 'Sign in to your studio' : 'Create your student account'}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Personalized study schedules, concept explanations, and active recall tracking
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-[#0F1D32] rounded-2xl shadow-sm border border-[#E5E1D6] dark:border-[#1E2F47] overflow-hidden">
          <div className="flex border-b border-[#E5E1D6] dark:border-[#1E2F47] bg-[#EFECE3]/60 dark:bg-[#0A1628]/60 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#16263D] text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#16263D] text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="p-3.5 bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900/50 text-lime-800 dark:text-lime-200 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#16263D] hover:bg-[#F7F5EF] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E5E1D6] dark:border-[#1E2F47] w-full" />
              <span className="bg-white dark:bg-[#0F1D32] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative whitespace-nowrap">
                or with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="student@university.edu"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotModal(true);
                      }}
                      className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
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
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Academic Standing
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] focus:outline-none focus:ring-2 focus:ring-teal-600/30 bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100"
                  >
                    <option value="Undergraduate Freshman">Undergraduate Freshman</option>
                    <option value="Undergraduate Sophomore">Undergraduate Sophomore</option>
                    <option value="Undergraduate Junior">Undergraduate Junior</option>
                    <option value="Undergraduate Senior">Undergraduate Senior</option>
                    <option value="Graduate / Master's">Graduate / Master&apos;s</option>
                    <option value="Competitive Exam Candidate">Competitive Exam Candidate</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
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

            <div className="pt-3 border-t border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>
                {isFirebaseConfigured
                  ? 'Protected with Firebase Authentication & Firestore'
                  : 'Operating in local browser persistence mode'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6">
          <Link to="/" className="text-teal-700 dark:text-teal-400 font-semibold hover:underline">
            &larr; Back to StudyMate AI Overview
          </Link>
        </p>
      </div>

      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="bg-white dark:bg-[#0F1D32] rounded-2xl max-w-md w-full shadow-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 space-y-4 relative">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotStatus(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#EFECE3] dark:hover:bg-[#16263D] text-slate-500 dark:text-slate-400 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 id="forgot-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Reset Your Password
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your registered email address and we will send you a password reset link.
              </p>
            </div>

            {forgotStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  forgotStatus.type === 'success'
                    ? 'bg-lime-50 dark:bg-lime-950/30 text-lime-800 dark:text-lime-200 border border-lime-200 dark:border-lime-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60'
                }`}
              >
                {forgotStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={inputClass}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 px-3 bg-[#EFECE3] dark:bg-[#16263D] hover:bg-[#E5E1D6] dark:hover:bg-[#1E2F47] text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 px-3 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
