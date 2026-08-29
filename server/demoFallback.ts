import { StudyPlan, TopicExplanation, Quiz, AdaptedPlanResponse, StudyPlanRequest, ExplainRequest, QuizRequest, AdaptPlanRequest } from '../src/types/index.js';

export function generateDemoStudyPlan(req: StudyPlanRequest): StudyPlan {
  const today = new Date();
  const tasks = [];
  const topicsToUse = req.topics.length > 0 ? req.topics : ['Core Fundamentals', 'Advanced Problem Solving', 'Practice & Revision'];
  const dailyMins = Math.min(Math.max(req.dailyHours * 60, 30), 360);

  // Generate 7-14 days of realistic tasks
  const numDays = 7;
  for (let i = 0; i < numDays; i++) {
    const taskDate = new Date(today);
    taskDate.setDate(today.getDate() + i);
    const dateStr = taskDate.toISOString().split('T')[0];
    const dayName = taskDate.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTopic = topicsToUse[i % topicsToUse.length];
    const isWeak = req.weakTopics.some(w => currentTopic.toLowerCase().includes(w.toLowerCase()));

    tasks.push({
      id: `task-demo-${i + 1}`,
      date: dateStr,
      day: `Day ${i + 1} (${dayName})`,
      topic: currentTopic,
      subtopic: `Part ${Math.floor(i / 2) + 1}: Deep Dive & Problem Set`,
      durationMinutes: Math.min(dailyMins, 90),
      priority: (isWeak ? 'High' : (i % 2 === 0 ? 'High' : 'Medium')) as 'High' | 'Medium' | 'Low',
      difficulty: req.level,
      learningObjective: `Master core theorems and solve 5 standardized problems in ${currentTopic}.`,
      revisionTask: i > 0 ? `15-minute active recall summary of Day ${i} concepts.` : 'Initial concept inventory & formula cheat-sheet.',
      practiceRecommendation: `Complete 6 practice problems from standard problem bank on ${currentTopic}.`,
      status: 'pending' as const,
    });
  }

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    subject: req.subject || 'Computer Science & Mathematics',
    examDate: req.examDate,
    dailyHours: req.dailyHours,
    level: req.level,
    topics: topicsToUse,
    weakTopics: req.weakTopics,
    preferredDays: req.preferredDays,
    tasks,
    totalDays: numDays,
    totalStudyHours: Math.round((tasks.reduce((sum, t) => sum + t.durationMinutes, 0) / 60) * 10) / 10,
    assumptions: [
      'Daily study time capped strictly at student specified hours.',
      'Weak topics weighted with higher initial practice frequency.',
      'Active spaced repetition scheduled every 48-72 hours.',
    ],
    isDemoFallback: true,
  };
}

export function generateDemoExplanation(req: ExplainRequest): TopicExplanation {
  const topic = req.topic || 'Recursion in Computer Science';
  return {
    id: `explain-${Date.now()}`,
    topic,
    level: req.level,
    simpleExplanation: `${topic} is a method where a complex task is broken down into smaller instances of the exact same task until a fundamental, trivial base case is reached.`,
    realWorldAnalogy: 'Imagine Russian nesting dolls (Matryoshka). To reach the tiny solid wooden figure inside (the base case), you keep opening identical outer shells, layer by layer, until no more shells remain.',
    stepByStepExplanation: [
      {
        stepNumber: 1,
        title: 'Establish the Base Case',
        description: 'Define the simplest condition where no further breakdown is needed, preventing infinite loops or stack overflow.',
      },
      {
        stepNumber: 2,
        title: 'Formulate the Recursive Step',
        description: 'Call the function with a sub-problem that is strictly closer to the base case.',
      },
      {
        stepNumber: 3,
        title: 'Call Stack Unwinding',
        description: 'Once the base case is returned, each pending call on the execution stack resolves in reverse order (LIFO).',
      },
    ],
    example: {
      title: `Classic Example for ${topic}`,
      codeOrFormula: `// Recursive Factorial in TypeScript\nfunction factorial(n: number): number {\n  // 1. Base Case\n  if (n <= 1) return 1;\n  // 2. Recursive Step\n  return n * factorial(n - 1);\n}`,
      explanation: 'For n = 3, factorial(3) calls factorial(2) which calls factorial(1). The stack unwinds returning 1 * 2 * 3 = 6.',
    },
    commonMistakes: [
      {
        mistake: 'Missing or unreachable Base Case',
        whyItHappens: 'Forgetting to handle edge conditions like n <= 0 or negative inputs.',
        howToAvoid: 'Always write and test your termination condition before writing any recursive logic.',
      },
      {
        mistake: 'Stack Overflow from excessive recursion depth',
        whyItHappens: 'Large input sizes exceeding the allocated runtime memory call stack.',
        howToAvoid: 'Use tail-call recursion, memoization, or iterative dynamic programming when depth exceeds 10,000.',
      },
    ],
    quickRevisionNotes: [
      'Every recursive solution MUST have at least one base case.',
      'The input argument MUST strictly progress toward the base case.',
      'Space complexity is proportional to maximum stack recursion depth O(N).',
      'Memoization can reduce exponential time O(2^N) to linear O(N).',
    ],
    practiceQuestions: [
      {
        question: `What happens if a recursive function in ${topic} never reaches its base case?`,
        hint: 'Think about memory allocation in the call stack.',
        answer: 'The program exhausts the memory allocated for the call stack and crashes with a Stack Overflow error.',
      },
      {
        question: 'How does memoization optimize recursive algorithms?',
        hint: 'Consider overlapping subproblems.',
        answer: 'Memoization caches results of expensive function calls, returning cached results when identical inputs occur again.',
      },
      {
        question: 'Convert a simple countdown recursion (print n down to 1) into its two core structural parts.',
        hint: 'Base case when n <= 0, recursive call for n - 1.',
        answer: 'Base case: if n <= 0 return. Action & Recursive step: print(n), countdown(n - 1).',
      },
    ],
    isDemoFallback: true,
  };
}

export function generateDemoQuiz(req: QuizRequest): Quiz {
  const subject = req.subject || 'Computer Science';
  const topic = req.topic || 'Data Structures & Algorithms';

  return {
    id: `quiz-${Date.now()}`,
    subject,
    topic,
    difficulty: req.difficulty,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        question: `In ${topic}, what is the time complexity of searching an element in a balanced Binary Search Tree?`,
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
        correctAnswer: 'O(log N)',
        explanation: 'Because each comparison eliminates half the remaining subtree in a balanced BST, search takes logarithmic time O(log N).',
      },
      {
        id: 'q2',
        question: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        options: ['Stack', 'Queue', 'Binary Heap', 'Hash Map'],
        correctAnswer: 'Queue',
        explanation: 'A Queue enforces FIFO ordering where the first element enqueued is the first element dequeued.',
      },
      {
        id: 'q3',
        question: 'What is the worst-case time complexity of standard Quicksort without randomized pivot selection?',
        options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(log N)'],
        correctAnswer: 'O(N^2)',
        explanation: 'When the array is already sorted or reverse-sorted and the first or last element is chosen as pivot, partitions become completely unbalanced, resulting in O(N^2).',
      },
      {
        id: 'q4',
        question: 'Which of the following problems can be solved using Dynamic Programming?',
        options: ['Fibonacci sequence calculation with memoization', '0/1 Knapsack Problem', 'Longest Common Subsequence', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: 'All listed problems exhibit optimal substructure and overlapping subproblems, making them textbook applications of Dynamic Programming.',
      },
    ].slice(0, Math.max(req.questionCount || 4, 3)),
    isDemoFallback: true,
  };
}

export function generateDemoAdaptedPlan(req: AdaptPlanRequest): AdaptedPlanResponse {
  const tasks = [...req.currentPlan.tasks];
  const missedIndex = tasks.findIndex(t => t.id === req.missedTaskId);
  
  if (missedIndex !== -1) {
    tasks[missedIndex] = {
      ...tasks[missedIndex],
      status: 'missed',
      missedReason: req.missedReason,
    };

    // Redistribute missed topic into remaining pending tasks
    const remainingTasks = tasks.filter((t, i) => i > missedIndex && t.status !== 'completed');
    if (remainingTasks.length > 0) {
      // Add extra revision or merge
      remainingTasks[0].revisionTask = `Catch-up priority: 20-min accelerated review of missed [${tasks[missedIndex].topic}]. ` + remainingTasks[0].revisionTask;
      remainingTasks[0].priority = 'High';
    }
  }

  return {
    updatedTasks: tasks,
    redistributionSummary: `Rebalanced schedule: Missed topic integrated into upcoming high-priority revision slots without exceeding your daily study limits.`,
    priorityOrder: ['Core Exam Fundamentals', 'Weak Area Remediation', 'Scheduled Spaced Practice'],
    encouragementMessage: `Missed sessions happen! Your study path is recalibrated and you are fully on track for your exam target.`,
    isDemoFallback: true,
  };
}
