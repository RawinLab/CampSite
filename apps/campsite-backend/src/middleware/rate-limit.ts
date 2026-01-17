import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => clearInterval(cleanupInterval));
}

export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const authReq = req as Request & { user?: { id: string } };
      return authReq.user?.id || req.ip || 'unknown';
    },
  } = options;

  const storeKey = (key: string) => `rate-limit:${windowMs}:${max}:${key}`;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = storeKey(keyGenerator(req));
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment count
      entry.count++;
      rateLimitStore.set(key, entry);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again in 15 minutes.',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded, please slow down.',
});

export const inquiryRateLimiter = rateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 inquiries per 24 hours (as per Q18)
  message: 'You have reached the maximum number of inquiries for today.',
});

// Reset rate limit for a specific key (useful for testing or admin actions)
export function resetRateLimit(key: string): void {
  for (const storeKey of rateLimitStore.keys()) {
    if (storeKey.includes(key)) {
      rateLimitStore.delete(storeKey);
    }
  }
}
