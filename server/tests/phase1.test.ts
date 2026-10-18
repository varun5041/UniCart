import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { validateEnv } from '../src/config/env.js';
import * as dbModule from '../src/config/db.js';
import * as redisModule from '../src/config/redis.js';
import { createShutdownHandler } from '../src/server.js';

describe('Phase 1 Acceptance: Environment Validation', () => {
  it('invalid env → app refuses to start (throws validation error)', () => {
    // Missing MONGO_URI, REDIS_URL, and short JWT secret
    const badEnv = {
      NODE_ENV: 'production',
      PORT: 'invalid_port',
      JWT_ACCESS_SECRET: 'short'
    };

    expect(() => validateEnv(badEnv)).toThrowError(/Invalid environment configuration/);
  });

  it('valid env → passes validation successfully', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '5000',
      CLIENT_ORIGINS: 'http://localhost:5173,http://localhost:3000',
      MONGO_URI: 'mongodb://localhost:27017/unicart',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'super_secret_jwt_key_that_is_at_least_32_characters_long',
      LOG_LEVEL: 'info'
    };

    const parsed = validateEnv(validEnv);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.CLIENT_ORIGINS).toEqual(['http://localhost:5173', 'http://localhost:3000']);
    expect(parsed.MONGO_URI).toBe('mongodb://localhost:27017/unicart');
  });
});

describe('Phase 1 Acceptance: Health & Readiness Probes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /health/live should return 200 ok status', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('readiness fails (status 503) when Redis is down', async () => {
    // Mock DB as connected, but Redis as disconnected
    vi.spyOn(dbModule, 'isDBConnected').mockReturnValue(true);
    vi.spyOn(redisModule, 'isRedisConnected').mockReturnValue(false);

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.dependencies.redis).toBe('disconnected');
    expect(res.body.dependencies.mongodb).toBe('connected');
  });

  it('readiness fails (status 503) when MongoDB is down', async () => {
    vi.spyOn(dbModule, 'isDBConnected').mockReturnValue(false);
    vi.spyOn(redisModule, 'isRedisConnected').mockReturnValue(true);

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.dependencies.mongodb).toBe('disconnected');
  });

  it('readiness succeeds (status 200) when both MongoDB and Redis are connected', async () => {
    vi.spyOn(dbModule, 'isDBConnected').mockReturnValue(true);
    vi.spyOn(redisModule, 'isRedisConnected').mockReturnValue(true);

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.dependencies.mongodb).toBe('connected');
    expect(res.body.dependencies.redis).toBe('connected');
  });
});

describe('Phase 1 Acceptance: Security & Middleware Foundation', () => {
  it('injects and echoes X-Request-Id header', async () => {
    const customReqId = 'custom-request-id-12345';
    const res = await request(app).get('/health/live').set('X-Request-Id', customReqId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customReqId);
  });

  it('generates a new UUID v4 when X-Request-Id is not supplied', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
  });

  it('sets required security headers (Helmet)', async () => {
    const res = await request(app).get('/health/live');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('rejects oversized JSON request bodies (>10kb)', async () => {
    const largePayload = { data: 'a'.repeat(15 * 1024) }; // 15KB

    const res = await request(app)
      .post('/test/body')
      .send(largePayload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(413); // Payload Too Large
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns uniform { success: false, error: { code, message } } on ApiError', async () => {
    const res = await request(app).get('/test/error');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_TEST');
    expect(res.body.error.message).toBe('You lack permissions to access this item');
  });
});

describe('Phase 1 Acceptance: Graceful Shutdown', () => {
  it('SIGTERM shuts down cleanly closing server and connections', async () => {
    const mockServer = {
      close: vi.fn((cb: (err?: Error) => void) => cb())
    };
    const disconnectDBSpy = vi.spyOn(dbModule, 'disconnectDB').mockResolvedValue(undefined);
    const disconnectRedisSpy = vi.spyOn(redisModule, 'disconnectRedis').mockResolvedValue(undefined);

    const shutdown = createShutdownHandler(mockServer);
    const success = await shutdown('SIGTERM', false);

    expect(success).toBe(true);
    expect(mockServer.close).toHaveBeenCalled();
    expect(disconnectDBSpy).toHaveBeenCalled();
    expect(disconnectRedisSpy).toHaveBeenCalled();
  });
});

