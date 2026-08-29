# StudyMate AI — Plan smarter. Learn better.

**Production AI Capstone for Week 8 Frontend AI Engineering**

StudyMate AI is a production-grade, AI-powered study planning and learning assistant built for students preparing for high-stakes exams, technical certifications, and university courses.

Powered exclusively by the **Anthropic Claude API** (`claude-3-5-sonnet-20241022`), StudyMate AI delivers evidence-informed pedagogical scheduling, deep conceptual breakdowns, adaptive rescheduling, and shielded multiple-choice exam assessments.

---

## 🎯 Core Features

### 1. AI Study Plan Generator
- **Inputs**: Syllabus topics, target exam date, daily available study hours, experience level (Beginner/Intermediate/Advanced), weak topics, and preferred study days.
- **Claude Pedagogical Engine**: Employs cognitive load theory, active recall, and spaced revision intervals.
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
- When students miss a session, Claude reschedules remaining days without overwhelming daily capacity or causing burnout.
- Re-prioritizes high-yield core concepts and allocates spaced revision blocks.

### 4. AI Practice Quiz Generator
- Generates multiple-choice questions with 4 distinct options and realistic distractors.
- **Answer Shielding**: Answer keys are strictly hidden from students during the active quiz.
- **Scoring & Diagnostics**: Instant percentage calculation, celebratory confetti on $\ge 80\%$, question-by-question explanations, and personalized improvement recommendations.

### 5. Study Command Center (Dashboard & Analytics)
- **Daily Focus**: Immediately answers *"What should I study today?"* with the top priority task.
- **Metrics**: Consecutive streak days, completed tasks, exam countdown timer, total logged hours, and weak topic alerts.
- **Knowledge Mastery**: Tracks weak areas needing reinforcement vs. mastered topics.

---

## 🔒 Security & Architecture

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
│   • API Key Shielding (process.env.ANTHROPIC_API_KEY)       │
│   • Zod Schema Validation & Error Normalization             │
│   • Claude System & User Prompts                            │
│   • Schema-Valid Demo Fallback Engine                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Anthropic SDK)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Anthropic Claude API                        │
│   • claude-3-5-sonnet-20241022                              │
│   • Structured JSON mode extraction                         │
└─────────────────────────────────────────────────────────────┘
```

- **Zero Client-Side API Key Exposure**: The Anthropic API key is kept strictly in server-side environment variables.
- **Zod Schema Enforcement**: Every response from Claude is validated against strict schemas before reaching the client.
- **Deterministic Fallback**: If the API key is not configured or rate limits are reached, the system gracefully delivers valid demo data with clear UI indicators.

---

## 🚀 Getting Started

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
Edit `.env` (or configure in your deployment platform):
```env
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

### Development
```bash
# Start full-stack development server on port 3000
npm run dev
```

### Testing
```bash
# Run unit test suite
npm run test

# Run tests with coverage
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

## ♿ Accessibility (WCAG 2.1 AA)

- **Semantic HTML**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<fieldset>`, `<legend>`.
- **Keyboard Navigation**: Full tab order and visible focus rings (`focus-visible:outline-2 focus-visible:outline-indigo-600`).
- **Skip Link**: "Skip to main content" link for screen reader users.
- **Aria Attributes**: `aria-expanded`, `aria-label`, `aria-pressed`, `aria-hidden`, and `role="alert"`.
- **Color Contrast**: All body text and control elements exceed the WCAG 4.5:1 ratio.
- **Reduced Motion Support**: Respects user's system preferences and toggle in Settings.

---

## 📜 License
Apache-2.0
