import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { env } from '../config/env.js';

/**
 * Creates Redis-backed rate limiter for authentication endpoints.
 * Fallback to in-memory store if Redis is unavailable or during standard test execution.
 */
export function createAuthRateLimiter() {
  let store: RedisStore | undefined;

  try {
    if (env.NODE_ENV !== 'test' || process.env.TEST_REDIS_RATE_LIMIT === 'true') {
      const client = getRedisClient();
      store = new RedisStore({
        // @ts-expect-error - ioredis command calling interface compatible with rate-limit-redis
        sendCommand: (...args: string[]) => client.call(...args),
        prefix: 'rl:auth:'
      });
    }
  } catch {
    store = undefined;
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Limit each IP to 5 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store,
    statusCode: 429,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
      }
    },
    skip: () => env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== 'true'
  });
}

export const authRateLimiter = createAuthRateLimiter();

export default authRateLimiter;
