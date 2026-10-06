import { ServerQuiz, ClientQuiz } from '../src/types/index.js';

interface StoredQuizEntry {
  quiz: ServerQuiz;
  storedAt: number;
}

class ServerQuizStore {
  private store = new Map<string, StoredQuizEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMs: number = 2 * 60 * 60 * 1000, maxEntries: number = 2000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;

    // Periodically remove expired quizzes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 15 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public saveQuiz(quiz: ServerQuiz): void {
    // If capacity reached, evict oldest entry
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(quiz.id, {
      quiz,
      storedAt: Date.now(),
    });
  }

  public getQuiz(quizId: string): ServerQuiz | undefined {
    const entry = this.store.get(quizId);
    if (!entry) return undefined;

    // Check expiry
    if (Date.now() - entry.storedAt > this.ttlMs) {
      this.store.delete(quizId);
      return undefined;
    }

    return entry.quiz;
  }

  public hasQuiz(quizId: string): boolean {
    return this.getQuiz(quizId) !== undefined;
  }

  public deleteQuiz(quizId: string): boolean {
    return this.store.delete(quizId);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.store.entries()) {
      if (now - entry.storedAt > this.ttlMs) {
        this.store.delete(id);
      }
    }
  }
}

export const serverQuizStore = new ServerQuizStore();

/**
 * Strips all answers and explanations so the client ONLY receives
 * the safe, shielded questions: { id, question, options }
 */
export function toClientQuiz(quiz: ServerQuiz): ClientQuiz {
  return {
    id: quiz.id,
    subject: quiz.subject,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    createdAt: quiz.createdAt,
    isDemoFallback: quiz.isDemoFallback,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options],
    })),
  };
}
