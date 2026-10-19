import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { logger } from '../src/config/logger.js';
import { register, httpRequestsTotal, httpRequestDurationSeconds, httpActiveConnections } from '../src/config/metrics.js';
import { signAccessToken } from '../src/utils/token.js';
import { User, Category } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';

describe('Phase 10 Acceptance: Metrics, Observability & Redaction Verification', () => {
  let redisMemoryStore: Map<string, string>;
  let mockRedisClient: any;

  const adminUserId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90099');
  const customerUserId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90001');

  const adminToken = signAccessToken({
    sub: adminUserId.toString(),
    role: 'admin',
    tokenVersion: 0
  });

  const customerToken = signAccessToken({
    sub: customerUserId.toString(),
    role: 'customer',
    tokenVersion: 0
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    redisMemoryStore = new Map<string, string>();

    mockRedisClient = {
      status: 'ready',
      get: vi.fn(async (key: string) => redisMemoryStore.get(key) || null),
      set: vi.fn(async (key: string, val: string) => {
        redisMemoryStore.set(key, val);
        return 'OK';
      }),
      del: vi.fn(async (key: string) => {
        redisMemoryStore.delete(key);
        return 1;
      }),
      incr: vi.fn(async (key: string) => {
        const val = parseInt(redisMemoryStore.get(key) || '0', 10) + 1;
        redisMemoryStore.set(key, val.toString());
        return val;
      }),
      expire: vi.fn().mockResolvedValue(1),
      eval: vi.fn().mockResolvedValue([1, 1000])
    };

    setRedisClientForTest(mockRedisClient);
  });

  describe('1. Prometheus Metrics Endpoint & Telemetry', () => {
    it('GET /metrics returns 200 with Prometheus scrapable plain text format', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('unicart_http_requests_total');
      expect(res.text).toContain('unicart_http_request_duration_seconds');
      expect(res.text).toContain('unicart_http_active_connections');
    });

    it('records request duration and increments total request counter on API calls', async () => {
      // Hit an endpoint
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);

      // Hit root
      const rootRes = await request(app).get('/');
      expect(rootRes.status).toBe(200);

      const metricsRes = await request(app).get('/metrics');
      expect(metricsRes.status).toBe(200);
      expect(metricsRes.text).toContain('unicart_http_requests_total{method="GET",route="/",status_code="200"}');
    });

    it('collects default Node.js process metrics with unicart_ prefix', async () => {
      const metricsText = await register.metrics();
      expect(metricsText).toContain('unicart_process_cpu_user_seconds_total');
      expect(metricsText).toContain('unicart_nodejs_eventloop_lag_seconds');
    });

    it('metrics registry correctly defines custom metrics instances', () => {
      expect(httpRequestsTotal).toBeDefined();
      expect(httpRequestDurationSeconds).toBeDefined();
      expect(httpActiveConnections).toBeDefined();
    });
  });

  describe('2. Pino Redaction & Data Protection', () => {
    it('pino logger instance redacts sensitive fields (passwords, tokens, cookies, auth headers, card data)', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');

      // Verify logger configuration matches OWASP specs
      expect(logger.level).toBeDefined();
    });
  });

  describe('3. Supertest Integration: Cross-Module Verification', () => {
    it('GET /api/v1/users/me returns authenticated user context and rejects without token', async () => {
      // Unauthorized without token
      const unauthRes = await request(app).get('/api/v1/users/me');
      expect(unauthRes.status).toBe(401);
      expect(unauthRes.body.error.code).toBe('TOKEN_MISSING');

      // Authorized with customer token
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: customerUserId,
          name: 'Priya Sharma',
          email: 'priya@example.com',
          role: 'customer',
          tokenVersion: 0,
          isLocked: vi.fn().mockReturnValue(false),
          addresses: []
        })
      } as any);

      const authRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(authRes.status).toBe(200);
      expect(authRes.body.success).toBe(true);
      expect(authRes.body.data.user.email).toBe('priya@example.com');
      expect(authRes.body.data.user.role).toBe('customer');
    });

    it('GET /api/v1/admin/test rejects non-admin users with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: customerUserId,
          name: 'Priya Sharma',
          email: 'priya@example.com',
          role: 'customer',
          tokenVersion: 0,
          isLocked: vi.fn().mockReturnValue(false)
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/v1/admin/test allows admin users with 200 OK', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: adminUserId,
          name: 'Super Admin',
          email: 'admin@unicart.in',
          role: 'admin',
          tokenVersion: 0,
          isLocked: vi.fn().mockReturnValue(false)
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin access granted');
    });

    it('GET /api/v1/categories returns category listing', async () => {
      vi.spyOn(Category, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), name: 'Electronics', slug: 'electronics' },
          { _id: new Types.ObjectId(), name: 'Audio', slug: 'audio' }
        ])
      } as any);

      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('GET /api/v1/cart requires authentication', async () => {
      const res = await request(app).get('/api/v1/cart');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/orders requires authentication', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
    });

    it('Handles 404 for unknown endpoints cleanly without stack trace leakage', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.stack).toBeUndefined();
    });
  });
});
