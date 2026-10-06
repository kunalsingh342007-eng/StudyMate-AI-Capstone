# StudyMate AI — Plan smarter. Learn better.

**Production AI Capstone for Week 8 Frontend AI Engineering**

StudyMate AI is a production-grade, AI-powered study planning and learning assistant built for students preparing for high-stakes exams, technical certifications, and university courses.

Powered by modern LLM inference Google Gemini  StudyMate AI delivers evidence-informed pedagogical scheduling, deep conceptual breakdowns, adaptive rescheduling, and shielded multiple-choice exam assessments.

---

## 📋 1. Project Brief

- **What problem does it solve?** Students and technical candidates frequently experience syllabus overload, lack of scheduling realism, and disjointed study sessions. Generic AI chatbots generate superficial text with no accountability or structured recall. StudyMate AI transforms preparation into a realistic, adaptive pedagogical operating system.
- **Who is it for?** University students, engineering candidates, competitive exam aspirants (e.g. JEE, GATE, GRE, USMLE), and developers preparing for technical interviews.
- **Why did you choose this idea?** Existing study tools are either static to-do lists that fail when life happens, or unstructured chat bots that encourage passive reading instead of active learning. StudyMate bridges planning, 7-layer conceptual understanding, and active recall assessments into one unified workflow.

---

## 🎯 2. Core Features & AI Integration

### 1. AI Study Plan Generator
- **Inputs**: Syllabus topics, target exam date, daily available study hours, experience level (Beginner/Intermediate/Advanced), weak topics, and preferred study days.
- **Pedagogical Engine**: Employs cognitive load theory, active recall, and spaced revision intervals.
- **Output Structure**: Day-by-day task cards with duration limits, priority rankings, learning objectives, revision tasks, and active practice recommendations.

### 2. AI Topic Explainer (7-Section Pedagogical Deep-Dive)
Unlike generic chatbots, the Explainer formats all topics into a structured 7-section learning view:
1. **Simple Explanation** (Plain, high-clarity conceptual summary)
2. **Intuitive Real-World Analogy** (Mental model bridge)
3. **Step-by-Step Mechanism** (Logical progression)
4. **Concrete Code / Formula Example** (Applied syntax with copyable code)
5. **Common Traps & How to Avoid Them** (High-yield error prevention)
6. **Quick Revision Notes** (Rapid recap bullet points)
7. **Active Recall Practice Questions** (Interactive question cards with expandable hint & answer reveals)

### 3. Adaptive Schedule Recalibration
- When students miss a session, the AI reschedules remaining days without overwhelming daily capacity or causing burnout.
- Re-prioritizes high-yield core concepts and allocates spaced revision blocks.

### 4. AI Practice Quiz Generator
- Generates multiple-choice questions with 4 distinct options and realistic distractors.
- **Answer Shielding**: Answer keys are strictly hidden from students during the active quiz.
- **Scoring & Diagnostics**: Instant percentage calculation, celebratory feedback on $\ge 80\%$, question-by-question explanations, and personalized improvement recommendations.

### 5. Study Command Center (Dashboard & Analytics)
- **Daily Focus**: Immediately answers *"What should I study today?"* with the top priority task.
- **Metrics**: Consecutive streak days, completed tasks, exam countdown timer, total logged hours, and weak topic alerts.
- **Knowledge Mastery**: Tracks weak areas needing reinforcement vs. mastered topics.

---

## 🔒 3. Architecture & Security

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend (SPA)                  │
│   • React Router v7   • Tailwind CSS   • Lucide Icons       │
│   • LocalStorage Data • WCAG 2.1 AA    • Canvas Confetti    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON API Calls (/api/*)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Express / Vercel Serverless Backend               │
│   • API Key Shielding (process.env.GEMINI_API_KEY)          │
│   • Zod Schema Validation & Error Normalization             │
│   • System & User Prompts with JSON Mode Enforcement        │
│   • Schema-Valid Demo Fallback Engine                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Google GenAI SDK)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Gemini LLM Engine                   │
│   • gemini-3.7-flash with multi-model fallback cascade      │
│   • Strict JSON response formatting                         │
└─────────────────────────────────────────────────────────────┘
```

- **Zero Client-Side API Key Exposure**: All API keys are kept strictly in server-side environment variables.
- **Zod Schema Enforcement**: Every AI response is validated against strict schemas before reaching the client.
- **Deterministic Fallback**: If the API key is not configured or rate limits are reached, the system gracefully delivers valid demo data with clear UI indicators.

---

## 🚀 4. Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/studymate-ai.git
cd studymate-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Environment Variables
Edit `.env` (or configure in your Vercel / Cloud Run project):
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### Development & Testing
```bash
# Start full-stack development server on port 3000
npm run dev

# Run full Vitest test suite (11/11 passing across schemas, storage, components)
npm run test

# Run tests with coverage report
npm run test:coverage
```

### Production Build
```bash
# Build Vite SPA & bundle Node CommonJS server
npm run build

# Start production server
npm start
```

---

## 📊 5. Testing & Performance Audit Evidence

### Test Suite Results (`vitest run`):
```text
✓ src/tests/components.test.tsx (3 tests)
  - renders PriorityCard with top high-priority task details
  - renders empty state when no priority task exists
  - renders StatsGrid with user streak and progress metrics
✓ src/tests/schemas.test.ts (4 tests)
  - validates valid study plan schema
  - validates 7-section topic explanation schema
  - validates quiz output schema
  - validates adaptive plan response schema
✓ src/tests/storage.test.ts (4 tests)
  - saves and retrieves active study plan
  - updates task status and recalculates progress
  - records quiz result and computes average scores
  - exports and restores data JSON cleanly

Test Files: 3 passed (3)
Tests: 11 passed (11)
```

### Performance & Accessibility Metrics:
- **Lighthouse Performance**: 96/100
- **Lighthouse Accessibility**: 98/100 (WCAG 2.1 AA compliant)
- **Best Practices**: 100/100
- **SEO**: 100/100
- **Audit Improvement Made**: Replaced arbitrary contrast badges with high-contrast palette tags (`text-slate-900`, `bg-emerald-50 text-emerald-800`), added landmark regions (`<main>`, `<nav>`, `<header>`, `<footer>`), and configured skip-links for screen reader navigation.

---

## 🚢 6. Deployment & Failure Handling

### Deployment Checklist:
- [x] Server-side API key protection enforced (zero `VITE_` secret leak).
- [x] Vercel Serverless Function configuration verified (`vercel.json` + `api/index.ts`).
- [x] Production build tested (`npm run build` generates clean `dist/` and `dist/server.cjs`).
- [x] Fallback demo engine active for graceful degradation on API rate limits.
- [x] Tested across mobile (375px), tablet (768px), and desktop (1440px).

### Safe Failure Strategy:
- **Missing API Key**: Automatically switches to pedagogical template engine with UI notice.
- **Upstream Rate Limit (503/429)**: Server automatically attempts next fallback model (`gemini-3.7-flash` &rarr; `gemini-3.6-flash` &rarr; `gemini-2.5-flash`).
- **Network Disconnect**: Client-side LocalStorage preserves active study plan, progress, and streak without data loss.

---

## ♿ 7. Accessibility (WCAG 2.1 AA)

- **Semantic HTML**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<fieldset>`, `<legend>`.
- **Keyboard Navigation**: Full tab order and visible focus rings (`focus-visible:outline-2 focus-visible:outline-indigo-600`).
- **Skip Link**: "Skip to main content" link for screen reader users.
- **Aria Attributes**: `aria-expanded`, `aria-label`, `aria-pressed`, `aria-hidden`, and `role="alert"`.
- **Color Contrast**: All body text and control elements exceed the WCAG 4.5:1 ratio.
- **Reduced Motion Support**: Respects user's system preferences and toggle in Settings.

---

## 📜 License
Apache-2.0
