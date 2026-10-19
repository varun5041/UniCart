import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { app } from '../src/app.js';
import { User, AuditLog, RefreshToken } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';

describe('Google OAuth Integration & Verification', () => {
  let redisMemoryStore: Map<string, string>;
  let mockRedisClient: any;

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

  it('rejects POST /api/v1/auth/google when idToken is missing with 422 Validation Error', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects POST /api/v1/auth/google with invalid Google token with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'invalid_malformed_token_xyz' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_GOOGLE_TOKEN');
  });

  it('successfully creates new user and issues JWT & HTTP-only refresh cookie on first Google login', async () => {
    const mockGoogleId = 'google_uid_998877';
    const mockEmail = 'new.user.google@unicart.dev';
    const mockName = 'Aarav Mehta';
    const mockToken = `mock-google-token:${mockEmail}:${mockName}:${mockGoogleId}`;

    const newUserId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90777');
    const mockSavedUser = {
      _id: newUserId,
      name: mockName,
      email: mockEmail,
      googleId: mockGoogleId,
      role: 'customer',
      tokenVersion: 0,
      failedLogins: 0,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User.prototype, 'save').mockResolvedValue(mockSavedUser as any);
    vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
    const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: mockToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(mockEmail);
    expect(res.body.data.user.name).toBe(mockName);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('rt=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.register.google' })
    );
  });

  it('links googleId and logs in existing user seamlessly', async () => {
    const mockGoogleId = 'google_uid_112233';
    const existingEmail = 'existing.user@unicart.dev';
    const mockToken = `mock-google-token:${existingEmail}:Existing User:${mockGoogleId}`;

    const existingUserId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');
    const mockExistingUser = {
      _id: existingUserId,
      name: 'Existing Customer',
      email: existingEmail,
      googleId: undefined as string | undefined,
      avatar: undefined as string | undefined,
      role: 'customer',
      tokenVersion: 1,
      failedLogins: 2,
      lockUntil: null,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(mockExistingUser as any);
    vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
    const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: mockToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(existingEmail);
    expect(mockExistingUser.googleId).toBe(mockGoogleId);
    expect(mockExistingUser.failedLogins).toBe(0); // Lockout count cleared
    expect(mockExistingUser.save).toHaveBeenCalled();
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login.google' })
    );
  });
});
