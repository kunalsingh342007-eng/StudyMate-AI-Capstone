import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  HelpCircle,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Check,
  ChevronDown,
  Play,
  Share2,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import { Banner } from '../components/layout/Banner';

export const LandingPage: React.FC = () => {
  // Interactive FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Interactive floating card checked states
  const [completedDemoTasks, setCompletedDemoTasks] = useState<Record<string, boolean>>({
    task1: true,
    task2: false,
    task3: false,
    task4: false,
  });
  // Feedback state for topic explainer preview
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const toggleTask = (id: string) => {
    setCompletedDemoTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const faqs = [
    {
      q: 'Is StudyMate free to use?',
      a: 'Yes, StudyMate includes full study planning, topic breakdowns, practice quizzes, and progress tracking with free local storage and demo modes.',
    },
    {
      q: 'Can I use StudyMate on mobile devices?',
      a: 'Absolutely. StudyMate is built with responsive mobile-first architecture, accessible touch targets, and full keyboard operability.',
    },
    {
      q: 'How does the topic explanation engine work?',
      a: 'Instead of unstructured conversational chat, StudyMate formats topics into 7 pedagogical layers: intuitive definitions, real-world analogies, step-by-step mechanisms, formulas/code, common pitfalls, and quick revision notes.',
    },
    {
      q: 'Can I track my offline study time?',
      a: 'Yes! All completed sessions, custom study goals, and quiz scores persist in local storage, allowing you to track progress uninterrupted.',
    },
    {
      q: 'How does adaptive rescheduling work if I miss a day?',
      a: 'When you mark a task as missed, StudyMate rebalances the remaining days of your plan, redistributing priorities so your daily capacity is never overwhelmed.',
    },
  ];

  return (
    <div className="w-full flex flex-col font-sans">
      <Banner />

      {/* =========================================================================
          1. CINEMATIC HERO SECTION (Dark Navy #071923)
          ========================================================================= */}
      <section
        className="relative bg-[#071923] text-white pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden border-b border-[#122D3E]"
        aria-label="Hero Introduction"
      >
        {/* Background Image with Dark Vignette Gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-25 mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop"
            alt="Student studying with notebook in warm focused desk lighting"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Ambient Dark Navy Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071923] via-[#071923]/90 to-[#071923]/70 z-0" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#071923] to-transparent z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Typography */}
            <div className="lg:col-span-7 space-y-7 text-left">
              {/* Tagline Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F3144] border border-[#1E4D68] text-xs font-semibold tracking-wider uppercase text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Personal Study Planner</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
                Study{' '}
                <span className="text-sky-300 font-serif italic font-normal sm:font-semibold">
                  smarter
                </span>
                .<br />
                Stay{' '}
                <span className="text-sky-300 font-serif italic font-normal sm:font-semibold">
                  ahead
                </span>
                .
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-xl leading-relaxed font-normal">
                StudyMate is your personal study planner that helps you plan, learn, practice, and track your progress — all in one place.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/planner"
                  className="px-7 py-3.5 text-base font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] border border-[#2F8CB6]/60 rounded-xl shadow-lg shadow-sky-950/50 hover:shadow-sky-900/60 transition-all flex items-center gap-2.5 group active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 text-sky-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 text-base font-medium text-slate-200 hover:text-white bg-[#0C2432]/80 hover:bg-[#113144] border border-[#1C465E] rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 text-sky-400 fill-sky-400" />
                  <span>See How It Works</span>
                </a>
              </div>

              {/* Social Proof Stack */}
              <div className="pt-6 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-[#071923] object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                    alt="Student user"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-[#071923] object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                    alt="Student user"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-[#071923] object-cover"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
                    alt="Student user"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-xs sm:text-sm text-slate-300">
                  <span className="font-semibold text-white">Join 10,000+ students</span> who are already ahead.
                </div>
              </div>
            </div>

            {/* Right Hero: Student Picture with Floating Accent Cards */}
            <div className="lg:col-span-5 relative">
              {/* Decorative background ambient glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-600/20 via-indigo-600/20 to-teal-500/10 rounded-3xl blur-2xl pointer-events-none" />

              {/* Main Student Photo Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-[#1A485F] shadow-2xl bg-[#0B212D]">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
                  alt="Student studying with notebook and laptop in a warm library environment"
                  className="w-full h-[420px] sm:h-[480px] object-cover object-center"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle vignette gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071923] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071923]/40 via-transparent to-[#071923]/40" />

                {/* Overlaid Bottom Status Bar */}
                <div className="absolute bottom-4 inset-x-4 p-4 rounded-xl bg-[#0B212D]/90 backdrop-blur-md border border-[#1E4D68] text-white flex items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Calculus – Derivatives</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <span className="text-[11px] text-slate-300">Active Study Session &bull; 45m</span>
                    </div>
                  </div>
                  <Link
                    to="/planner"
                    className="text-xs font-bold text-sky-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#143B50] hover:bg-[#1A5C7A] transition-colors"
                  >
                    Open
                  </Link>
                </div>
              </div>

              {/* Floating Mini Pill 1: Exam Countdown */}
              <div className="flex absolute -bottom-5 -left-4 sm:-left-6 bg-[#0E2838]/95 backdrop-blur-md border border-[#1F4C66] rounded-xl px-4 py-2.5 shadow-2xl items-center gap-3 z-20">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
                    Exam Countdown
                  </span>
                  <span className="text-xs font-bold text-white">JEE / Finals &bull; 42 Days</span>
                </div>
              </div>

              {/* Floating Mini Pill 2: Today's Progress */}
              <div className="flex absolute -top-4 -right-3 sm:-right-5 bg-[#0E2838]/95 backdrop-blur-md border border-[#1F4C66] rounded-xl px-4 py-2.5 shadow-2xl items-center gap-3 z-20">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
                    Today's Progress
                  </span>
                  <span className="text-xs font-bold text-white">4 / 6 tasks (67%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. PRODUCT INTRODUCTION (Warm Light Section #F4F1EA)
          ========================================================================= */}
      <section
        id="how-it-works"
        className="bg-[#F4F1EA] text-[#0B1720] py-20 lg:py-28 border-b border-[#E2DDD2]"
        aria-label="About StudyMate"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold tracking-widest text-[#6B747A] uppercase font-mono">
              ABOUT STUDYMATE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B1720] tracking-tight">
              Your all-in-one study companion
            </h2>
            <p className="text-base sm:text-lg text-[#6B747A] leading-relaxed">
              Plan your study schedule, understand any topic, practice with quizzes and track your progress to achieve your goals.
            </p>
            <div className="pt-2">
              <Link
                to="/planner"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A5C7A] hover:text-[#207297]"
              >
                <span>Learn more about StudyMate</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E4DFD5] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2F6] text-[#1A5C7A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1720]">Plan Smarter</h3>
                <p className="text-sm text-[#6B747A] leading-relaxed">
                  Create smart study plans that help you stay consistent, spaced, and focused.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/planner"
                  className="text-xs font-bold text-[#1A5C7A] hover:underline flex items-center gap-1"
                >
                  Start timetable &rarr;
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E4DFD5] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2F6] text-[#1A5C7A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1720]">Understand Better</h3>
                <p className="text-sm text-[#6B747A] leading-relaxed">
                  Get clear explanations for any topic with deep concept clarity and analogies.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/explain"
                  className="text-xs font-bold text-[#1A5C7A] hover:underline flex items-center gap-1"
                >
                  Explore topics &rarr;
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E4DFD5] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2F6] text-[#1A5C7A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1720]">Practice More</h3>
                <p className="text-sm text-[#6B747A] leading-relaxed">
                  Practice with quizzes and strengthen your active recall with diagnostic feedback.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/quiz"
                  className="text-xs font-bold text-[#1A5C7A] hover:underline flex items-center gap-1"
                >
                  Take practice quiz &rarr;
                </Link>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E4DFD5] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2F6] text-[#1A5C7A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1720]">Track Progress</h3>
                <p className="text-sm text-[#6B747A] leading-relaxed">
                  Visualize your preparation, streaks, and mastery to stay motivated every day.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/progress"
                  className="text-xs font-bold text-[#1A5C7A] hover:underline flex items-center gap-1"
                >
                  View analytics &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SMART STUDY PLANNER SHOWCASE (Dark Navy #071923)
          ========================================================================= */}
      <section
        id="features"
        className="bg-[#071923] text-white py-20 lg:py-28 border-b border-[#122D3E]"
        aria-label="Smart Study Planner Showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Description Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs font-bold tracking-widest text-sky-400 uppercase font-mono">
                SMART STUDY PLANNER
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Plan{' '}
                <span className="text-sky-300 font-serif italic font-normal sm:font-semibold">
                  your
                </span>{' '}
                study.<br />
                Own your day.
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Build your personalized study schedule in minutes and let StudyMate guide you through your day.
              </p>

              {/* Value checkmarks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <span>Smart timetable generator based on your actual daily hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <span>Spaced revision slots reserved before exam deadlines</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <span>Adaptive rescheduling when unexpected delays happen</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/planner"
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] border border-[#2B86B0]/50 rounded-xl inline-flex items-center gap-2 shadow-md transition-all"
                >
                  <span>Explore Planner</span>
                  <ArrowRight className="w-4 h-4 text-sky-300" />
                </Link>
              </div>
            </div>

            {/* Right: Realistic Timetable Calendar Desktop Mockup (matching reference) */}
            <div className="lg:col-span-7">
              <div className="bg-[#0B212D] border border-[#1A485F] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
                {/* Mockup Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#143A4E] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">May 19 – May 25</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#103042] text-slate-300 border border-[#1D4A62]">
                      Today
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#071923] p-1 rounded-lg border border-[#14384B] text-xs">
                    <span className="px-2.5 py-1 rounded bg-[#1A5C7A] text-white font-medium">Week</span>
                    <span className="px-2.5 py-1 text-slate-400">Month</span>
                  </div>
                </div>

                {/* Calendar Grid Representation */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono text-slate-400 pb-1">
                  <div>Mon 19</div>
                  <div>Tue 20</div>
                  <div>Wed 21</div>
                  <div>Thu 22</div>
                  <div>Fri 23</div>
                  <div>Sat 24</div>
                  <div>Sun 25</div>
                </div>

                {/* Timetable Schedule Grid */}
                <div className="grid grid-cols-7 gap-1.5 min-h-[220px] text-[11px]">
                  {/* Monday */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-emerald-900/40 border border-emerald-500/40 text-emerald-200 text-left">
                      <span className="font-bold block truncate">Calculus</span>
                      <span className="text-[9px] text-emerald-400">Derivatives</span>
                    </div>
                  </div>

                  {/* Tuesday */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-sky-900/40 border border-sky-500/40 text-sky-200 text-left">
                      <span className="font-bold block truncate">Physics</span>
                      <span className="text-[9px] text-sky-300">Mechanics</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 text-left">
                      <span className="text-[9px] block">Review</span>
                    </div>
                  </div>

                  {/* Wednesday */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-purple-900/40 border border-purple-500/40 text-purple-200 text-left">
                      <span className="font-bold block truncate">Chemistry</span>
                      <span className="text-[9px] text-purple-300">Organic</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-left">
                      <span className="text-[9px] block">Notes</span>
                    </div>
                  </div>

                  {/* Thursday */}
                  <div className="space-y-1.5">
                    <div className="p-1.5 rounded-lg bg-[#071923] border border-dashed border-slate-700 text-slate-500 text-center">
                      <span className="text-[9px]">Break</span>
                    </div>
                  </div>

                  {/* Friday */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-500/40 text-amber-200 text-left">
                      <span className="font-bold block truncate">Practice</span>
                      <span className="text-[9px] text-amber-300">Quiz Block</span>
                    </div>
                  </div>

                  {/* Saturday */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-500/40 text-blue-200 text-left">
                      <span className="font-bold block truncate">Mock Test</span>
                      <span className="text-[9px] text-blue-300">Full Paper</span>
                    </div>
                  </div>

                  {/* Sunday */}
                  <div className="space-y-1.5">
                    <div className="p-1.5 rounded-lg bg-[#071923] border border-dashed border-slate-700 text-slate-500 text-center">
                      <span className="text-[9px]">Free Time</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-left">
                      <span className="text-[9px] block">Revision</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Goal Bar */}
                <div className="border-t border-[#143A4E] pt-3 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Weekly Goal: <strong className="text-white">12 / 20 hrs</strong> completed</span>
                  </div>
                  <div className="w-32 bg-[#071923] rounded-full h-2 overflow-hidden border border-[#14384B]">
                    <div className="bg-sky-400 h-full rounded-full w-[60%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. TOPIC EXPLANATION SHOWCASE (Warm Light Section #F4F1EA)
          ========================================================================= */}
      <section
        className="bg-[#F4F1EA] text-[#0B1720] py-20 lg:py-28 border-b border-[#E2DDD2]"
        aria-label="Topic Explanation Showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Intro Text */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs font-bold tracking-widest text-[#6B747A] uppercase font-mono">
                UNDERSTAND ANY TOPIC
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B1720] tracking-tight leading-tight">
                Get clear explanations<br />in seconds.
              </h2>
              <p className="text-base text-[#6B747A] leading-relaxed">
                Confused about a concept? StudyMate explains it in the simplest way with real-world examples and step-by-step logic you can relate to.
              </p>
              <div className="pt-2">
                <Link
                  to="/explain?topic=Newton's%20Second%20Law%20of%20Motion"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1A5C7A] hover:text-[#207297]"
                >
                  <span>Try an example</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Digital Textbook Card Preview (matching reference) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-[#E2DDD2] p-6 sm:p-8 shadow-md space-y-6">
                {/* Query Pill */}
                <div className="inline-block bg-[#EAF2F6] text-[#1A5C7A] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#D3E3EC]">
                  Explain Newton's Second Law with an example.
                </div>

                {/* Core Definition */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#0B1720]">Core Mechanism</h3>
                  <p className="text-sm text-[#4A5560] leading-relaxed">
                    Newton's Second Law states that the force applied to an object is directly proportional to the mass of the object multiplied by the acceleration produced.
                  </p>
                </div>

                {/* Formula Highlight Box */}
                <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E2DDD2] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#6B747A] uppercase">Mathematical Formula</span>
                  <span className="text-lg font-mono font-extrabold text-[#0B1720]">F = m × a</span>
                </div>

                {/* Real-World Analogy */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#6B747A] uppercase tracking-wider">Everyday Analogy</h4>
                  <p className="text-sm text-[#4A5560] leading-relaxed">
                    When you push an empty grocery cart, it accelerates quickly. Fill the same cart with 30 kg of groceries (higher mass), and you must apply significantly more force to achieve the same speed.
                  </p>
                </div>

                {/* Interactive Feedback */}
                <div className="border-t border-[#EAE6DD] pt-4 flex items-center justify-between text-xs text-[#6B747A]">
                  <span>Was this explanation clear?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('up')}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                        feedbackGiven === 'up'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-white border-[#E2DDD2] hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('down')}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                        feedbackGiven === 'down'
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-white border-[#E2DDD2] hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Needs detail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PROGRESS / ANALYTICS SECTION (Dark Navy #071923)
          ========================================================================= */}
      <section
        className="bg-[#071923] text-white py-20 lg:py-28 border-b border-[#122D3E]"
        aria-label="Progress Analytics"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-widest text-sky-400 uppercase font-mono">
                TRACK YOUR PROGRESS
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                See your progress.<br />Stay motivated.
              </h2>
              <p className="text-base text-slate-300 max-w-xl leading-relaxed">
                Detailed analytics help you understand your study habits, retention, and syllabus coverage over time.
              </p>
            </div>

            <div>
              <Link
                to="/progress"
                className="inline-flex items-center gap-2 text-sm font-bold text-sky-300 hover:text-sky-200"
              >
                <span>View your dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 4 Analytics Visual Cards (matching reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: Study Time */}
            <div className="bg-[#0B212D] border border-[#1A485F] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-mono">Study Time</span>
                <span className="text-sky-400 font-semibold">This Week</span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">16h 30m</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">+12% from last week</div>
              </div>
              {/* Sparkline simulation */}
              <div className="flex items-end justify-between gap-1.5 h-12 pt-2">
                <div className="w-full bg-[#143A4E] rounded-t h-[40%]" title="Mon: 2h" />
                <div className="w-full bg-[#143A4E] rounded-t h-[65%]" title="Tue: 3h" />
                <div className="w-full bg-[#143A4E] rounded-t h-[50%]" title="Wed: 2.5h" />
                <div className="w-full bg-[#143A4E] rounded-t h-[80%]" title="Thu: 4h" />
                <div className="w-full bg-[#143A4E] rounded-t h-[60%]" title="Fri: 3h" />
                <div className="w-full bg-sky-400 rounded-t h-[100%]" title="Sat: 5h" />
                <div className="w-full bg-sky-500 rounded-t h-[75%]" title="Sun: 3.5h" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
            </div>

            {/* Metric 2: Topics Completed */}
            <div className="bg-[#0B212D] border border-[#1A485F] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-mono">Topics Completed</span>
                <BookOpen className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white">18 / 25</div>
                  <div className="text-xs text-slate-400 mt-0.5">72% Syllabus covered</div>
                </div>
                {/* SVG Radial Progress */}
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#143A4E]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-sky-400"
                      strokeDasharray="72, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    72%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-2 border-t border-[#143A4E]">
                7 topics remaining before exam deadline.
              </p>
            </div>

            {/* Metric 3: Quiz Score */}
            <div className="bg-[#0B212D] border border-[#1A485F] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-mono">Quiz Score</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">85%</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">+8% from last week</div>
              </div>
              {/* Vertical Score Bars */}
              <div className="flex items-end gap-2 h-12 pt-2">
                <div className="flex-1 bg-[#143A4E] rounded-t h-[60%]" />
                <div className="flex-1 bg-[#143A4E] rounded-t h-[75%]" />
                <div className="flex-1 bg-[#143A4E] rounded-t h-[70%]" />
                <div className="flex-1 bg-[#143A4E] rounded-t h-[80%]" />
                <div className="flex-1 bg-amber-400 rounded-t h-[85%]" />
              </div>
              <p className="text-xs text-slate-400 pt-2 border-t border-[#143A4E]">
                Strongest: Linear Algebra &bull; Needs Practice: Trees
              </p>
            </div>

            {/* Metric 4: Current Streak */}
            <div className="bg-[#0B212D] border border-[#1A485F] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-mono">Current Streak</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white">12 Days</div>
                  <div className="text-xs text-amber-300 font-semibold mt-0.5">Keep it up! 🔥</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
                  <Flame className="w-6 h-6 animate-bounce" />
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-2 border-t border-[#143A4E]">
                Top 5% consistency among active candidates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. TESTIMONIALS (Warm Light Section #F4F1EA)
          ========================================================================= */}
      <section
        className="bg-[#F4F1EA] text-[#0B1720] py-20 lg:py-28 border-b border-[#E2DDD2]"
        aria-label="Student Testimonials"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold tracking-widest text-[#6B747A] uppercase font-mono">
              LOVED BY STUDENTS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B1720] tracking-tight">
              What students are saying
            </h2>
            <p className="text-base text-[#6B747A]">
              Built for students who want to study consistently and stay ahead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E2DDD2] shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-sm sm:text-base text-[#4A5560] leading-relaxed italic">
                &ldquo;StudyMate helped me organize my study schedule and now I can cover more in less time. Highly recommended!&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0ECE4]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                  alt="Ananya Sharma"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E2DDD2]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-sm font-bold text-[#0B1720]">Ananya Sharma</div>
                  <div className="text-xs text-[#6B747A]">Engineering Student</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E2DDD2] shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-sm sm:text-base text-[#4A5560] leading-relaxed italic">
                &ldquo;The explanations are super clear and the quizzes are really helpful for exam prep. Instead of wondering what to study next, I open the dashboard and start.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0ECE4]">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                  alt="Rohit Verma"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E2DDD2]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-sm font-bold text-[#0B1720]">Rohit Verma</div>
                  <div className="text-xs text-[#6B747A]">12th Grade Student &bull; JEE Aspirant</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E2DDD2] shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-sm sm:text-base text-[#4A5560] leading-relaxed italic">
                &ldquo;I love the progress tracking feature. It keeps me motivated every single day, and the adaptive rescheduling saved me when college events disrupted my plan.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0ECE4]">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
                  alt="Sneha Patil"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E2DDD2]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-sm font-bold text-[#0B1720]">Sneha Patil</div>
                  <div className="text-xs text-[#6B747A]">Medical Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ SECTION & FINAL CTA (Warm Light Section #F4F1EA)
          ========================================================================= */}
      <section
        id="faq"
        className="bg-[#F4F1EA] text-[#0B1720] py-20 lg:py-24"
        aria-label="Frequently Asked Questions"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* FAQ Header & Accordion */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-[#6B747A] uppercase font-mono">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1720] tracking-tight">
                Everything you need to know
              </h2>
            </div>

            <div className="space-y-3 pt-4">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-[#E2DDD2] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left font-bold text-[#0B1720] flex items-center justify-between gap-4 hover:bg-slate-50/50"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#6B747A] transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-180 text-[#1A5C7A]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-[#6B747A] leading-relaxed border-t border-[#F4F1EA] pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wide Cinematic Final Banner CTA (matching reference bottom card) */}
          <div className="relative rounded-3xl bg-[#071923] text-white overflow-hidden border border-[#14384B] shadow-2xl">
            {/* Background photography on right side */}
            <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-30 md:opacity-40 mix-blend-luminosity pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Students studying collaboratively"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#071923] via-[#071923]/90 to-transparent" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl space-y-6">
              <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to study{' '}
                <span className="text-sky-300 font-serif italic font-normal sm:font-semibold">
                  smarter
                </span>
                ?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Join thousands of students who are already achieving their goals with StudyMate. Turn your goals, available time, and syllabus into a realistic plan.
              </p>
              <div className="pt-2">
                <Link
                  to="/planner"
                  className="px-7 py-3.5 text-base font-semibold text-white bg-[#1A5C7A] hover:bg-[#207297] border border-[#2B86B0]/60 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-sky-950/60 transition-all active:scale-[0.98]"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="w-5 h-5 text-sky-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
