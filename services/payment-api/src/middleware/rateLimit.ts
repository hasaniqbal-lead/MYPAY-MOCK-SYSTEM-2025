import { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiter keyed by API key or IP.
 * Reads limits from env vars with sensible defaults.
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

// Per-key stores for each window
const stores: Record<string, Map<string, RateBucket>> = {
  second: new Map(),
  minute: new Map(),
  hour: new Map(),
  day: new Map(),
};

// Window durations in ms
const WINDOWS: Record<string, number> = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

function getLimits() {
  return {
    second: parseInt(process.env.RATE_LIMIT_PER_SECOND || '5', 10),
    minute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '30', 10),
    hour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '500', 10),
    day: parseInt(process.env.RATE_LIMIT_PER_DAY || '5000', 10),
  };
}

function getKey(req: Request): string {
  // Prefer API key from header, fall back to IP
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return `token:${authHeader.slice(7, 20)}`; // First 13 chars as key identifier
  }
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) return `key:${apiKey.slice(0, 15)}`;
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

function checkBucket(store: Map<string, RateBucket>, key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count++;
  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);

  return { allowed, remaining, resetAt: bucket.resetAt };
}

/**
 * Rate limiting middleware for API routes.
 * Returns 429 with Retry-After header when limit is exceeded.
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip rate limiting if disabled
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return next();
  }

  const limits = getLimits();
  const key = getKey(req);

  // Check all windows, strictest first
  for (const [window, limit] of Object.entries(limits)) {
    const windowMs = WINDOWS[window];
    const result = checkBucket(stores[window], key, limit, windowMs);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded: ${limit} requests per ${window}`,
        retryAfter,
      });
      return;
    }
  }

  // Add rate limit headers for the day window (most visible to user)
  const dayResult = checkBucket(stores.day, key, limits.day, WINDOWS.day);
  res.set('X-RateLimit-Limit', String(limits.day));
  res.set('X-RateLimit-Remaining', String(dayResult.remaining));
  res.set('X-RateLimit-Reset', String(Math.ceil(dayResult.resetAt / 1000)));

  next();
}

/**
 * Get current rate limit config and usage for a given key.
 * Used by the rate-limits info endpoint.
 */
export function getRateLimitInfo(req: Request): {
  limits: Record<string, number>;
  usage: Record<string, { used: number; remaining: number; resetsAt: string }>;
} {
  const limits = getLimits();
  const key = getKey(req);
  const now = Date.now();

  const usage: Record<string, { used: number; remaining: number; resetsAt: string }> = {};

  for (const [window, limit] of Object.entries(limits)) {
    const bucket = stores[window].get(key);
    const used = bucket && now < bucket.resetAt ? bucket.count : 0;
    const resetsAt = bucket && now < bucket.resetAt
      ? new Date(bucket.resetAt).toISOString()
      : new Date(now + WINDOWS[window]).toISOString();

    usage[window] = {
      used,
      remaining: Math.max(0, limit - used),
      resetsAt,
    };
  }

  return { limits, usage };
}

// Cleanup expired buckets every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const store of Object.values(stores)) {
    for (const [key, bucket] of store.entries()) {
      if (now >= bucket.resetAt) store.delete(key);
    }
  }
}, 5 * 60 * 1000);
