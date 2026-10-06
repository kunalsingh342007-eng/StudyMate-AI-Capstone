import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipFailedRequests?: boolean;
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.message = options.message || 'Too many requests. Please slow down and try again later.';

    // Periodically sweep expired keys to prevent memory growth
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.max(30000, this.windowMs));

    // Allow process to exit naturally in tests or scripts
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp = this.getClientIp(req);
      const now = Date.now();

      let record = this.records.get(clientIp);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.records.set(clientIp, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > this.maxRequests) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          error: this.message,
          retryAfterSeconds: resetSeconds,
        });
      }

      next();
    };
  }

  public reset(ip?: string) {
    if (ip) {
      this.records.delete(ip);
    } else {
      this.records.clear();
    }
  }

  public getRecordCount(): number {
    return this.records.size;
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.records.entries()) {
      if (now > value.resetTime) {
        this.records.delete(key);
      }
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown-client';
  }
}

// Pre-configured rate limiters for expensive AI endpoints
// Normal student usage: up to 30 generation requests per minute
export const aiEndpointsLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'AI request limit reached. Please wait a moment before sending more requests.',
});
