import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file from current working dir or monorepo root
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((val) => val.split(',').map((s) => s.trim())),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_POOL_SIZE: z.coerce.number().int().positive().default(50),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SECURE: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((val) => (typeof val === 'boolean' ? val : val === 'true')),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info')
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, unknown>): Env {
  const target = customEnv || process.env;
  const result = envSchema.safeParse(target);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    const msg = `[UniCart Config Error] Invalid environment configuration:\n${formattedErrors}`;
    console.error(msg);
    throw new Error(msg);
  }

  return result.data;
}

// In test environment or default fallback when importing
export const env: Env = (() => {
  // If in test mode with no explicit env set, provide valid test defaults
  if (process.env.NODE_ENV === 'test' && !process.env.MONGO_URI) {
    return {
      NODE_ENV: 'test',
      PORT: 5001,
      CLIENT_ORIGINS: ['http://localhost:5173'],
      MONGO_URI: 'mongodb://localhost:27017/unicart_test',
      MONGO_POOL_SIZE: 10,
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test_jwt_access_secret_with_more_than_32_characters_for_security',
      JWT_ACCESS_TTL: '15m',
      REFRESH_TOKEN_TTL_DAYS: 7,
      COOKIE_SECURE: false,
      COOKIE_SAME_SITE: 'strict',
      LOG_LEVEL: 'fatal'
    };
  }

  try {
    return validateEnv();
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      return {
        NODE_ENV: 'test',
        PORT: 5001,
        CLIENT_ORIGINS: ['http://localhost:5173'],
        MONGO_URI: 'mongodb://localhost:27017/unicart_test',
        MONGO_POOL_SIZE: 10,
        REDIS_URL: 'redis://localhost:6379',
        JWT_ACCESS_SECRET: 'test_jwt_access_secret_with_more_than_32_characters_for_security',
        JWT_ACCESS_TTL: '15m',
        REFRESH_TOKEN_TTL_DAYS: 7,
        COOKIE_SECURE: false,
        COOKIE_SAME_SITE: 'strict',
        LOG_LEVEL: 'fatal'
      };
    }
    throw err;
  }
})();
