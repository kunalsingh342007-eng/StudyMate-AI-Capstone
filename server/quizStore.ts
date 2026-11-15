import crypto from 'crypto';
import { ServerQuiz, ClientQuiz } from '../src/types/index.js';

interface StoredQuizEntry {
  quiz: ServerQuiz;
  storedAt: number;
  ownerId?: string;
}

function getQuizSealKey(): Buffer {
  const seed =
    process.env.QUIZ_SESSION_SECRET ||
    process.env.GEMINI_API_KEY ||
    process.env.VERCEL_PROJECT_ID ||
    'studymate-ai-ephemeral-quiz-seal-key-v1';
  return crypto.createHash('sha256').update(seed).digest();
}

export function sealQuizSession(quiz: ServerQuiz, ownerId?: string): string {
  const iv = crypto.randomBytes(12);
  const key = getQuizSealKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const payload = JSON.stringify({
    quiz,
    ownerId: ownerId || null,
    exp: Date.now() + 2 * 60 * 60 * 1000,
  });
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function unsealQuizSession(
  token: string
): { quiz: ServerQuiz; ownerId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const encrypted = Buffer.from(dataB64, 'base64url');
    const key = getQuizSealKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted);
    if (!parsed?.quiz || (parsed.exp && Date.now() > parsed.exp)) {
      return null;
    }
    return {
      quiz: parsed.quiz as ServerQuiz,
      ownerId: typeof parsed.ownerId === 'string' ? parsed.ownerId : undefined,
    };
  } catch {
    return null;
  }
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

  public saveQuiz(quiz: ServerQuiz, ownerId?: string): void {
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
      ownerId,
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

  public getQuizOwner(quizId: string): string | undefined {
    const entry = this.store.get(quizId);
    return entry?.ownerId;
  }

  public verifyOwnership(quizId: string, userId?: string): boolean {
    const entry = this.store.get(quizId);
    if (!entry) return false;
    // If the quiz has no owner recorded (e.g. guest or legacy), allow access
    if (!entry.ownerId) return true;
    // If it has an owner recorded, the caller must match the owner
    return !!userId && entry.ownerId === userId;
  }

  public resolveQuiz(
    quizId: string,
    userId?: string,
    sessionToken?: string
  ): { quiz?: ServerQuiz; forbidden: boolean } {
    const entry = this.store.get(quizId);
    if (entry) {
      if (Date.now() - entry.storedAt > this.ttlMs) {
        this.store.delete(quizId);
      } else {
        if (entry.ownerId && (!userId || entry.ownerId !== userId)) {
          return { forbidden: true };
        }
        return { quiz: entry.quiz, forbidden: false };
      }
    }

    // Fallback to sealed stateless token for serverless multi-instance resilience
    if (sessionToken) {
      const unsealed = unsealQuizSession(sessionToken);
      if (unsealed && unsealed.quiz.id === quizId) {
        if (unsealed.ownerId && (!userId || unsealed.ownerId !== userId)) {
          return { forbidden: true };
        }
        // Repopulate local cache for subsequent requests
        this.saveQuiz(unsealed.quiz, unsealed.ownerId);
        return { quiz: unsealed.quiz, forbidden: false };
      }
    }

    return { forbidden: false };
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
export function toClientQuiz(quiz: ServerQuiz, ownerId?: string): ClientQuiz {
  return {
    id: quiz.id,
    subject: quiz.subject,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    createdAt: quiz.createdAt,
    isDemoFallback: quiz.isDemoFallback,
    sessionToken: sealQuizSession(quiz, ownerId),
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options],
    })),
  };
}
