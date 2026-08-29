import { StudyPlanRequest, ExplainRequest, QuizRequest, AdaptPlanRequest } from '../src/types/index.js';

export const STUDY_PLANNER_SYSTEM_PROMPT = `You are an expert academic planning assistant that creates realistic, evidence-informed study schedules for college students and competitive exam aspirants.

Your core planning principles:
1. STRICT RESPECT FOR TIME: Never schedule more study time per day than the student has explicitly available (dailyHours).
2. SPACED REPETITION & REVISION: Allocate dedicated revision sessions for previously covered topics every 3-4 days.
3. WEAK AREA EMPHASIS: Give earlier scheduling, higher duration, and dedicated practice recommendations to topics identified as weak by the student.
4. ACTIONABLE & GRANULAR: Break broad syllabus topics into focused, bite-sized subtopics with explicit learning objectives and concrete practice tasks.
5. NO INVENTED EXAM FACTS: Do not hallucinate syllabus rules or exam details; clearly state reasonable scheduling assumptions.
6. STRUCTURED JSON: You MUST respond ONLY with a single valid JSON object strictly matching the requested schema. Do not enclose in markdown code fences if possible, or use standard json blocks.`;

export function buildStudyPlanUserPrompt(req: StudyPlanRequest): string {
  return `Generate a comprehensive, day-by-day study schedule for the following student:
- Subject: ${req.subject}
- Target Exam Date: ${req.examDate}
- Daily Available Hours: ${req.dailyHours} hours/day
- Student Level: ${req.level}
- Target Topics: ${req.topics.join(', ')}
- Weak Topics to Prioritize: ${req.weakTopics.length > 0 ? req.weakTopics.join(', ') : 'None specified (distribute evenly)'}
- Preferred Study Days: ${req.preferredDays.join(', ')}

Output JSON schema structure:
{
  "tasks": [
    {
      "date": "YYYY-MM-DD",
      "day": "Day 1 (e.g. Monday)",
      "topic": "Topic Name",
      "subtopic": "Granular Subtopic",
      "durationMinutes": 60,
      "priority": "High" | "Medium" | "Low",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "learningObjective": "Clear outcome: what the student will understand or be able to solve",
      "revisionTask": "Specific 15-min spaced recall or summary task",
      "practiceRecommendation": "Specific practice exercise (e.g., 5 practice problems on X)"
    }
  ],
  "totalDays": number,
  "totalStudyHours": number,
  "assumptions": ["List of realistic assumptions made during schedule creation"]
}`;
}

export const TOPIC_EXPLAINER_SYSTEM_PROMPT = `You are a master academic educator and pedagogical expert who specializes in breaking down complex collegiate and competitive-exam topics into crystal-clear, unforgettable conceptual models.

Structure every explanation into these 7 essential components:
1. Simple Explanation: Jargon-free, intuitive summary.
2. Real-World Analogy: A vivid, everyday metaphor that makes the abstraction click.
3. Step-by-Step Explanation: Clear pedagogical progression from fundamentals to mechanisms.
4. Concrete Example: Code snippet, formula derivation, or applied case with explanation.
5. Common Mistakes: Why students fail this concept and how to avoid traps.
6. Quick Revision Notes: High-yield bullet points for last-minute exam recall.
7. Practice Questions: Exactly 3 progressive practice questions with hints and complete answers.

Output JSON format strictly.`;

export function buildExplainUserPrompt(req: ExplainRequest): string {
  return `Explain the following topic thoroughly for a ${req.level} student:
- Topic: ${req.topic}
${req.subjectContext ? `- Subject Context: ${req.subjectContext}` : ''}

Output JSON schema:
{
  "simpleExplanation": "Clear intuitive summary",
  "realWorldAnalogy": "Everyday metaphor making the concept obvious",
  "stepByStepExplanation": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Clear step description"
    }
  ],
  "example": {
    "title": "Example title",
    "codeOrFormula": "Code block or mathematical formula (if applicable, else clear example)",
    "explanation": "Detailed walk-through of the example"
  },
  "commonMistakes": [
    {
      "mistake": "Common misconception",
      "whyItHappens": "Underlying cause",
      "howToAvoid": "Actionable check or mental model"
    }
  ],
  "quickRevisionNotes": ["High yield bullet point 1", "High yield bullet point 2", "High yield bullet point 3"],
  "practiceQuestions": [
    {
      "question": "Practice question text",
      "hint": "Guiding hint",
      "answer": "Complete correct answer with explanation"
    }
  ]
}`;
}

export const QUIZ_SYSTEM_PROMPT = `You are an expert academic examiner and test author.
Generate rigorous, pedagogically sound multiple-choice questions for exam practice.

Rules:
1. Each question must have EXACTLY 4 distinct, plausible options.
2. "correctAnswer" must match ONE of the 4 options verbatim.
3. Include a comprehensive "explanation" describing why the correct answer is right and why key distractors are wrong.
4. Ensure appropriate difficulty matching the requested level.
5. Return strictly valid JSON.`;

export function buildQuizUserPrompt(req: QuizRequest): string {
  return `Generate a practice quiz with ${req.questionCount} multiple-choice questions:
- Subject: ${req.subject}
- Topic: ${req.topic}
- Difficulty Level: ${req.difficulty}

Output JSON schema:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A", // EXACT match to one of options
      "explanation": "Detailed explanation of why this answer is correct and others are wrong"
    }
  ]
}`;
}

export const ADAPT_PLAN_SYSTEM_PROMPT = `You are an expert adaptive academic recovery coach.
When a student misses a scheduled study session, you re-balance and redistribute their unfinished study tasks without demoralizing or overloading them.

Prioritization rules:
1. Exam-critical topics (High Priority)
2. Weak topics
3. Revision & Spaced Recall
4. Practice exercises

Constraints:
- Never exceed daily available time limits.
- If extra time is available (${'extraTimeAvailableMinutes'} min), absorb the missed critical task in upcoming days.
- If extra time is zero, streamline or merge low-priority practice to protect critical core concepts.
- Return strictly valid JSON.`;

export function buildAdaptPlanUserPrompt(req: AdaptPlanRequest): string {
  return `The student missed a scheduled study session. Adapt their schedule intelligently:
- Missed Task ID: ${req.missedTaskId}
- Reason for Missing: "${req.missedReason}"
- Extra Time Available: ${req.extraTimeAvailableMinutes} minutes across upcoming days
- Current Schedule Tasks Summary: ${JSON.stringify(req.currentPlan.tasks.map(t => ({ id: t.id, date: t.date, topic: t.topic, subtopic: t.subtopic, duration: t.durationMinutes, priority: t.priority, status: t.status })))}

Output JSON schema:
{
  "updatedTasks": [
    // Complete list of all tasks with adjusted dates, durations, and redistributed topics
  ],
  "redistributionSummary": "Clear 2-sentence summary explaining how the missed work was recovered without overload",
  "priorityOrder": ["Top priority 1", "Top priority 2", "Top priority 3"],
  "encouragementMessage": "Empathetic, motivating 1-sentence recovery message"
}`;
}
