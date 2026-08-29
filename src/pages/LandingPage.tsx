import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  BookOpen,
  HelpCircle,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Banner } from '../components/layout/Banner';

export const LandingPage: React.FC = () => {
  const features = [
    {
      title: 'AI Study Planning',
      description: 'Generates day-by-day, evidence-informed schedules respecting your actual daily hours, spaced repetition, and exam deadlines.',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      link: '/planner',
    },
    {
      title: 'Smart Explanations',
      description: 'Deep pedagogical breakdowns with simple analogies, step-by-step logic, code examples, common traps, and instant recall questions.',
      icon: Sparkles,
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      link: '/explain',
    },
    {
      title: 'Adaptive Scheduling',
      description: 'Missed a session? AI recalibrates your upcoming days to prioritize critical concepts without burning you out.',
      icon: RefreshCw,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      link: '/planner',
    },
    {
      title: 'AI Practice Quizzes',
      description: 'Generate targeted multiple-choice exam questions with hidden answers, scoring, and deep explanations for each choice.',
      icon: HelpCircle,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      link: '/quiz',
    },
    {
      title: 'Progress Tracking',
      description: 'Track your daily study streak, syllabus completion, weak topics, and quiz score trends in a distraction-free dashboard.',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      link: '/progress',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      <Banner />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-4 sm:px-6 space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Intelligent Study Planner &bull; Powered by Google Gemini</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
          Plan smarter.{' '}
          <span className="text-indigo-600 inline-block">Learn better.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An AI-powered study planner that turns your syllabus, available time, and goals into a realistic learning plan.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/planner"
            className="px-6 py-3 text-sm sm:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <BookOpen className="w-5 h-5" />
            Create Study Plan
          </Link>

          <Link
            to="/explain"
            className="px-6 py-3 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Explain a Topic
          </Link>
        </div>

        {/* Value Highlights */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero Hallucinated Schedules</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Strict Time Capacity Limits</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No Exposed API Keys</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section aria-labelledby="features-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 id="features-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Intelligent Tools Built for Serious Students
          </h2>
          <p className="text-sm text-slate-500">
            Engineered specifically to eliminate study overwhelm and build durable concept retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Link
                key={idx}
                to={f.link}
                className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl ${f.color} border flex items-center justify-center shadow-xs`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Explore module <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Architecture Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Zero-Exposure Serverless Architecture
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Built for Real-World AI Engineering
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            All Google Gemini API calls are secured server-side. Responses are strictly validated with Zod schemas before reaching the client. No client-side API keys, no mock AI as production implementation, and seamless offline-ready local storage.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              Open Daily Dashboard
            </Link>
            <Link
              to="/settings"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              View System Diagnostics
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
