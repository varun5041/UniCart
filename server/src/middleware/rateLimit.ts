import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { env } from '../config/env.js';

interface RateLimiterConfig {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
}

export function createRateLimiter(config: RateLimiterConfig) {
  const useRedis = isRedisConnected() && env.NODE_ENV !== 'test';

  const store = useRedis
    ? new RedisStore({
        // @ts-expect-error - ioredis call signature compatibility with rate-limit-redis
        sendCommand: (...args: string[]) => getRedisClient().call(args[0], ...args.slice(1)),
        prefix: `unicart:rl:${config.prefix}:`
      })
    : undefined;

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store,
    skip: (req) => env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests. Please try again later.'
        }
      });
    }
  });
}

// Strict rate limiter for auth endpoints: 5 requests / 15 minutes per IP
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

// Global API rate limiter: 300 requests / minute per IP
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  prefix: 'global',
  message: 'Too many requests. Please slow down.'
});

export default { authRateLimiter, globalRateLimiter, createRateLimiter };
