/**
 * Native In-Memory Rate Limiter — Zero-dependency, role-based.
 * Implements a sliding window counter per IP + per role endpoint.
 * 
 * Limits (per 60-second window):
 *   /api/milk/deposit    (agent)  → 30 requests  (aggressive: prevents fake log spamming)
 *   /api/milk/sync-batch (agent)  → 5 requests   (batch sync shouldn't fire often)
 *   /api/auth/login      (all)    → 10 requests  (brute-force protection)
 *   /api/batch/*         (factory)→ 20 requests
 *   /api/analytics/*     (auditor)→ 60 requests  (read-heavy, more lenient)
 */

// Store: { key: { count, windowStart } }
const rateLimitStore = new Map();

// Cleanup old windows every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 120_000) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

/**
 * createRateLimiter(options)
 * @param {number} maxRequests - Max requests allowed in the window
 * @param {number} windowMs    - Window duration in milliseconds
 * @param {string} label       - Human-readable label for this limiter (for log messages)
 */
function createRateLimiter({ maxRequests = 30, windowMs = 60_000, label = 'API' }) {
  return (req, res, next) => {
    // Use X-Forwarded-For to get real IP if behind proxy
    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    const key = `${label}:${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now - record.windowStart >= windowMs) {
      // Start a fresh window
      record = { count: 1, windowStart: now };
    } else {
      record.count++;
    }

    rateLimitStore.set(key, record);

    // Set rate limit headers (standard Retry-After spec)
    const remaining = Math.max(0, maxRequests - record.count);
    const resetAt = Math.ceil((record.windowStart + windowMs) / 1000);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetAt);

    if (record.count > maxRequests) {
      const retryAfterSecs = Math.ceil((record.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSecs);
      console.warn(`[RateLimit] ⛔ ${label} limit exceeded for IP ${ip} (${record.count}/${maxRequests})`);
      return res.status(429).json({
        success: false,
        message: `Too many requests to ${label} endpoint. Retry after ${retryAfterSecs} seconds.`,
        retryAfter: retryAfterSecs
      });
    }

    next();
  };
}

// Pre-built limiters for each role-sensitive route group
module.exports = {
  // Milk deposit — most aggressive (fraud prevention on agent endpoint)
  milkDepositLimiter: createRateLimiter({ maxRequests: 30, windowMs: 60_000, label: 'MILK_DEPOSIT' }),

  // Offline sync-batch — rare operation, strict
  syncBatchLimiter: createRateLimiter({ maxRequests: 5, windowMs: 60_000, label: 'SYNC_BATCH' }),

  // Auth login — brute-force protection
  authLoginLimiter: createRateLimiter({ maxRequests: 10, windowMs: 60_000, label: 'AUTH_LOGIN' }),

  // Batch/factory endpoints
  batchLimiter: createRateLimiter({ maxRequests: 20, windowMs: 60_000, label: 'BATCH' }),

  // Analytics — read-heavy, lenient
  analyticsLimiter: createRateLimiter({ maxRequests: 60, windowMs: 60_000, label: 'ANALYTICS' }),

  // Generic factory for custom limits
  createRateLimiter
};
