import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronDown,
  Play,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Award,
  Check,
  Compass,
} from 'lucide-react';
import { Banner } from '../components/layout/Banner';
import libraryFocusScene from '../assets/images/library_focus_scene_1794758778434.jpg';

const SAMPLE_CONCEPTS = [
  {
    id: 'os-sync',
    title: 'Process Synchronization',
    status: 'In Progress',
    mastery: 68,
    subtopics: ['Mutex Locks', 'Semaphores', 'Producer-Consumer'],
    actionTopic: 'Process Synchronization',
  },
  {
    id: 'os-vm',
    title: 'Virtual Memory',
    status: 'Needs Practice',
    mastery: 44,
    subtopics: ['Paging & Page Tables', 'TLB Hits', 'Page Replacement'],
    actionTopic: 'Virtual Memory',
  },
  {
    id: 'os-cpu',
    title: 'CPU Scheduling',
    status: 'Mastered',
    mastery: 86,
    subtopics: ['Round Robin', 'SJF & Preemption', 'Turnaround Time'],
    actionTopic: 'CPU Scheduling',
  },
];

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('os-sync');
  const [goalDone, setGoalDone] = useState(false);
  const [explainLayer, setExplainLayer] = useState<'mechanism' | 'analogy' | 'pitfall'>('mechanism');
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const selectedConcept =
    SAMPLE_CONCEPTS.find((c) => c.id === selectedConceptId) || SAMPLE_CONCEPTS[0];

  const faqs = [
    {
      q: 'Is StudyMate AI free to use?',
      a: 'Yes. StudyMate AI includes adaptive study planning, structured concept breakdowns, diagnostic quizzes, notes, and mastery tracking with browser persistence and optional cloud sync.',
    },
    {
      q: 'How does the AI Explainer differ from generic chat?',
      a: 'Instead of unorganized chat walls, StudyMate breaks any topic into clear pedagogical stages: intuitive definitions, real-world analogies, step-by-step mechanisms, worked formulas or code, and common exam pitfalls.',
    },
    {
      q: 'What happens if I miss a planned study day?',
      a: 'Mark the session as missed in the Study Planner and StudyMate AI rebalances your remaining days based on exam urgency and your daily study capacity.',
    },
    {
      q: 'How is topic mastery calculated?',
      a: 'Mastery scores combine quiz accuracy, recency, logged study time, and self-reported confidence ratings using deterministic learning analytics.',
    },
    {
      q: 'Can I switch between light and dark themes?',
      a: 'Yes. Use the theme toggle in the workspace header or Settings to switch between Warm Off-White Light Studio and Deep Dark Navy at any time.',
    },
  ];

  return (
    <div className="w-full flex flex-col font-sans">
      <Banner />

      {/* =========================================================================
          1. STUDIO HERO SECTION (Deep Navy #0A1628)
          ========================================================================= */}
      <section
        className="relative bg-[#0A1628] text-slate-100 pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden border-b border-[#1E2F47]"
        aria-label="Hero Introduction"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Typography Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-left">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-teal-400 font-mono">
                Personal Learning Studio
              </span>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                Study with clarity.{' '}
                <span className="font-display italic font-normal text-teal-300">
                  Master
                </span>{' '}
                every concept.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Turn your syllabus, exam deadline, and daily hours into a calm, adaptive study workflow — combining structured planning, guided concept breakdowns, and diagnostic practice quizzes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/dashboard"
                  className="px-6 py-3 text-sm sm:text-base font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Open Learning Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="px-5 py-3 text-sm sm:text-base font-medium text-slate-200 hover:text-white bg-[#0F1D32] hover:bg-[#16263D] border border-[#1E2F47] rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Play className="w-4 h-4 text-teal-400" />
                  <span>Explore Workflow</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#1E2F47] grid grid-cols-3 gap-4 max-w-lg text-xs">
                <div>
                  <span className="font-semibold text-white block">Adaptive Planner</span>
                  <span className="text-slate-400">Capacity-aware pacing</span>
                </div>
                <div>
                  <span className="font-semibold text-white block">Concept Studio</span>
                  <span className="text-slate-400">Multi-depth explanations</span>
                </div>
                <div>
                  <span className="font-semibold text-white block">Active Recall</span>
                  <span className="text-slate-400">Spaced review queue</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Studio Preview */}
            <div className="lg:col-span-6 flex items-stretch">
              <div className="w-full bg-[#0F1D32] border border-[#1E2F47] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xl">
                {/* Preview Top Bar */}
                <div className="flex items-center justify-between gap-3 border-b border-[#1E2F47] pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-teal-400 block">
                      Interactive Studio Preview
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      Today&apos;s Focus & Concept Map
                    </h2>
                  </div>
                  <Link
                    to="/planner"
                    className="text-xs font-semibold text-teal-300 hover:text-teal-200 whitespace-nowrap"
                  >
                    Open Planner &rarr;
                  </Link>
                </div>

                {/* Interactive Concept Nodes */}
                <div className="space-y-3">
                  <span className="text-xs text-slate-400 block">
                    Select a syllabus concept to inspect readiness:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_CONCEPTS.map((node) => {
                      const active = node.id === selectedConcept.id;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedConceptId(node.id)}
                          className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#16263D] border-teal-400 text-white'
                              : 'bg-[#0A1628] border-[#1E2F47] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{node.title}</div>
                          <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono tabular-nums">
                            <span className="text-slate-400">{node.status}</span>
                            <span className="text-teal-300 font-semibold">{node.mastery}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Concept Detail Panel */}
                <div className="p-4 rounded-xl bg-[#0A1628] border border-[#1E2F47] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white">{selectedConcept.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Subtopics: {selectedConcept.subtopics.join(' · ')}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-lime-300 tabular-nums shrink-0">
                      {selectedConcept.mastery}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#16263D] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-400 transition-all duration-300"
                      style={{ width: `${selectedConcept.mastery}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setGoalDone((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        goalDone
                          ? 'bg-lime-600 text-white'
                          : 'bg-[#16263D] text-slate-200 hover:bg-[#1E2F47]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{goalDone ? 'Session Marked Done' : 'Mark Sample Session Done'}</span>
                    </button>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <Link
                        to={`/explain?topic=${encodeURIComponent(selectedConcept.actionTopic)}`}
                        className="text-teal-300 hover:underline whitespace-nowrap"
                      >
                        Explain
                      </Link>
                      <Link
                        to={`/quiz?topic=${encodeURIComponent(selectedConcept.actionTopic)}`}
                        className="text-lime-300 hover:underline whitespace-nowrap"
                      >
                        Practice Quiz
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. STUDIO WORKFLOW OVERVIEW (Warm Off-White #F7F5EF / Dark #0F1D32)
          ========================================================================= */}
      <section
        id="how-it-works"
        className="bg-[#F7F5EF] dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 py-20 lg:py-24 border-b border-[#E5E1D6] dark:border-[#1E2F47]"
        aria-label="About StudyMate"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3 mb-12">
            <span className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 dark:text-teal-400 uppercase font-mono block">
              How the studio works
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Four focused tools connected around your syllabus
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Every plan task links straight into concept explanations, diagnostic quizzes, and spaced retrieval reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Calendar,
                title: '01. Plan Smarter',
                desc: 'Generate a realistic timetable shaped by your exam date, daily hours, and weak areas.',
                to: '/planner',
                cta: 'Open Planner',
              },
              {
                icon: BookOpen,
                title: '02. Understand Deeply',
                desc: 'Explore any concept across beginner, intermediate, or exam-ready layers with follow-up Q&A.',
                to: '/explain',
                cta: 'Open AI Explainer',
              },
              {
                icon: HelpCircle,
                title: '03. Practice Actively',
                desc: 'Test retention with instant answer checks, confidence tracking, and mistake diagnostics.',
                to: '/quiz',
                cta: 'Take a Quiz',
              },
              {
                icon: TrendingUp,
                title: '04. Track Mastery',
                desc: 'Inspect your knowledge map, unresolved mistakes, and Leitner spaced review queue.',
                to: '/progress',
                cta: 'View Progress',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white dark:bg-[#0A1628] rounded-2xl p-6 border border-[#E5E1D6] dark:border-[#1E2F47] flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-teal-700 dark:text-teal-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <Link
                    to={card.to}
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SMART STUDY PLANNER SHOWCASE (Dark Navy #0A1628)
          ========================================================================= */}
      <section
        id="features"
        className="bg-[#0A1628] text-slate-100 py-20 lg:py-24 border-b border-[#1E2F47]"
        aria-label="Smart Study Planner Showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className="text-[11px] font-semibold tracking-[0.16em] text-teal-400 uppercase font-mono block">
                Adaptive Study Planner
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Plan your week.{' '}
                <span className="font-display italic font-normal text-teal-300">
                  Rebalance
                </span>{' '}
                when life happens.
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Build a structured study schedule in seconds and reallocate missed sessions without cramming.
              </p>

              <div className="space-y-3 pt-1">
                {[
                  'Schedule paced strictly to your daily study hours',
                  'Prioritizes weak topics and upcoming exam windows',
                  'One-click adaptive rescheduling for missed blocks',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  to="/planner"
                  className="px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>Build Your Schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-[#0F1D32] border border-[#1E2F47] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2F47] pb-4">
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="font-bold text-white">Weekly Study Cadence</span>
                    <span aria-hidden="true" className="text-slate-500">&middot;</span>
                    <span className="text-xs text-slate-400">Sample Operating Systems Plan</span>
                  </div>
                  <span className="text-xs font-mono text-teal-300 tabular-nums">2.5 hrs / day</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
                  {[
                    { day: 'Mon', topic: 'Processes', sub: 'Synchronization', tone: 'border-teal-500/40 bg-teal-950/30 text-teal-200' },
                    { day: 'Tue', topic: 'Deadlocks', sub: 'Banker Algo', tone: 'border-amber-500/40 bg-amber-950/30 text-amber-200' },
                    { day: 'Wed', topic: 'Memory', sub: 'Paging & TLB', tone: 'border-sky-500/40 bg-sky-950/30 text-sky-200' },
                    { day: 'Thu', topic: 'Review', sub: 'Spaced Recall', tone: 'border-[#1E2F47] bg-[#0A1628] text-slate-300' },
                    { day: 'Fri', topic: 'Practice', sub: 'Timed Quiz', tone: 'border-lime-500/40 bg-lime-950/30 text-lime-200' },
                    { day: 'Sat', topic: 'File Sys', sub: 'Inodes & Disk', tone: 'border-teal-500/40 bg-teal-950/30 text-teal-200' },
                    { day: 'Sun', topic: 'Rest / Flex', sub: 'Catch-up slot', tone: 'border-dashed border-[#1E2F47] bg-[#0A1628] text-slate-400' },
                  ].map((col) => (
                    <div key={col.day} className="space-y-1.5">
                      <div className="font-mono text-slate-400 text-center">{col.day}</div>
                      <div className={`p-2.5 rounded-xl border text-left space-y-0.5 ${col.tone}`}>
                        <span className="font-semibold block truncate">{col.topic}</span>
                        <span className="text-[10px] opacity-80 block truncate">{col.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1E2F47] pt-3 flex items-center justify-between text-xs text-slate-300 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>Balanced across preferred study days with built-in review slots</span>
                  </div>
                  <Compass className="w-4 h-4 text-slate-500 hidden sm:block" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. INTERACTIVE CONCEPT EXPLAINER SHOWCASE (Warm Off-White #F7F5EF)
          ========================================================================= */}
      <section
        className="bg-[#F7F5EF] dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 py-20 lg:py-24 border-b border-[#E5E1D6] dark:border-[#1E2F47]"
        aria-label="Topic Explanation Showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 dark:text-teal-400 uppercase font-mono block">
                Concept Studio
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Clear, structured explanations built for retention.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Switch between core mechanisms, intuitive analogies, and exam pitfalls — then test yourself with one click.
              </p>
              <div className="pt-1">
                <Link
                  to="/explain?topic=Newton's%20Second%20Law%20of%20Motion"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  <span>Try in AI Explainer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-[#0A1628] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                      Physics &middot; Classical Mechanics
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      Newton&apos;s Second Law of Motion
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#EFECE3] dark:bg-[#16263D] rounded-xl text-xs font-semibold">
                    {(
                      [
                        { id: 'mechanism', label: 'Mechanism' },
                        { id: 'analogy', label: 'Analogy' },
                        { id: 'pitfall', label: 'Pitfalls' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setExplainLayer(tab.id)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          explainLayer === tab.id
                            ? 'bg-white dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {explainLayer === 'mechanism' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      The net force acting on an object equals its mass multiplied by its acceleration. Acceleration always points in the same direction as the net force vector.
                    </p>
                    <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Formula
                      </span>
                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        F_net = m &times; a
                      </span>
                    </div>
                  </div>
                )}

                {explainLayer === 'analogy' && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Pushing an empty shopping cart requires very little force to accelerate quickly. Load the same cart with 30 kg of groceries (higher mass), and you must apply proportionally more force to reach the same speed.
                  </p>
                )}

                {explainLayer === 'pitfall' && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Common exam mistake: plugging a single applied force into F = ma instead of the vector sum of all forces (such as friction and normal components on an incline).
                  </p>
                )}

                <div className="border-t border-[#E5E1D6] dark:border-[#1E2F47] pt-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Was this concept card clear?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('up')}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        feedbackGiven === 'up'
                          ? 'bg-lime-50 dark:bg-lime-950/30 border-lime-400 text-lime-700 dark:text-lime-300'
                          : 'bg-[#F7F5EF] dark:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('down')}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        feedbackGiven === 'down'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-700 dark:text-amber-300'
                          : 'bg-[#F7F5EF] dark:bg-[#16263D] border-[#E5E1D6] dark:border-[#1E2F47]'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Go deeper</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. STUDENT TESTIMONIALS & FAQ & FINAL CTA
          ========================================================================= */}
      <section
        className="bg-[#0A1628] text-slate-100 py-20 lg:py-24 border-b border-[#1E2F47]"
        aria-label="Student Feedback"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-12">
            <span className="text-[11px] font-semibold tracking-[0.16em] text-teal-400 uppercase font-mono block">
              Student Perspectives
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Built for consistent daily focus
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'StudyMate helped me turn a 12-chapter syllabus into daily 45-minute blocks I could actually finish without burning out.',
                name: 'Ananya Sharma',
                role: 'Computer Engineering Undergraduate',
                initials: 'AS',
              },
              {
                quote:
                  'Instead of wondering what to revise next, I open the studio, check Today’s Goal, and jump straight into a diagnostic quiz.',
                name: 'Rohit Verma',
                role: 'Competitive Exam Candidate',
                initials: 'RV',
              },
              {
                quote:
                  'Adaptive rescheduling saved my finals week when lab deadlines collided with my revision schedule.',
                name: 'Sneha Patil',
                role: 'Medical Sciences Student',
                initials: 'SP',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-[#0F1D32] rounded-2xl p-6 border border-[#1E2F47] flex flex-col justify-between space-y-6"
              >
                <p className="text-sm text-slate-300 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#1E2F47]">
                  <div className="w-10 h-10 rounded-xl bg-[#16263D] border border-[#1E2F47] text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="bg-[#F7F5EF] dark:bg-[#0F1D32] text-slate-900 dark:text-slate-100 py-20 lg:py-24"
        aria-label="Frequently Asked Questions"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 dark:text-teal-400 uppercase font-mono">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Everything you need to know
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#0A1628] rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-4 hover:bg-[#F7F5EF]/60 dark:hover:bg-[#16263D]/50 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-[#E5E1D6] dark:border-[#1E2F47] pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Studio Banner */}
          <div className="relative rounded-2xl bg-[#0A1628] text-white overflow-hidden border border-[#1E2F47] shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-30 pointer-events-none">
              <img
                src={libraryFocusScene}
                alt="Quiet contemporary university library study hall"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/92 to-[#0A1628]/40" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-14 max-w-2xl space-y-5">
              <h3
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Ready to step into your{' '}
                <span className="font-display italic font-normal text-teal-300">
                  learning studio
                </span>
                ?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Turn your syllabus, available daily hours, and exam timeline into an organized, calm study cadence.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="px-6 py-3 text-sm sm:text-base font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/planner"
                  className="px-5 py-3 text-sm font-semibold text-slate-200 hover:text-white bg-[#0F1D32] hover:bg-[#16263D] border border-[#1E2F47] rounded-xl transition-colors whitespace-nowrap"
                >
                  Create Study Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
