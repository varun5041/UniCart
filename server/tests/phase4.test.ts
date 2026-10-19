import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User, RefreshToken, AuditLog } from '../src/models/index.js';
import { signAccessToken, hashToken } from '../src/utils/token.js';

describe('Phase 4 Acceptance: Authentication & Authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Password Policy & Registration Validation', () => {
    it('rejects passwords shorter than 8 characters, missing numbers/uppercase, or common passwords', async () => {
      // 1. Too short
      const resShort = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'Short1' });
      expect(resShort.status).toBe(422);
      expect(resShort.body.error.code).toBe('VALIDATION_ERROR');

      // 2. Missing uppercase
      const resNoUpper = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
      expect(resNoUpper.status).toBe(422);
      expect(resNoUpper.body.error.code).toBe('VALIDATION_ERROR');

      // 3. Common password
      const resCommon = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'Password123' });
      expect(resCommon.status).toBe(422);
      expect(resCommon.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration if email is already taken', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), email: 'existing@unicart.dev' })
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Existing User',
          email: 'existing@unicart.dev',
          password: 'SecureValidPassword123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('Login Success and Fail Acceptance Criteria', () => {
    it('login fail: returns 401 with generic message on wrong password', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90111'),
        email: 'user@unicart.dev',
        role: 'customer',
        failedLogins: 1,
        isLocked: vi.fn().mockReturnValue(false),
        verifyPassword: vi.fn().mockResolvedValue(false),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@unicart.dev', password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(mockUser.failedLogins).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login.failed' })
      );
    });

    it('login success: returns accessToken, user info, sets rt cookie, and resets failedLogins', async () => {
      const mockUserId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90111');
      const mockUser = {
        _id: mockUserId,
        name: 'Valid User',
        email: 'user@unicart.dev',
        role: 'customer',
        tokenVersion: 0,
        failedLogins: 3,
        lockUntil: null,
        isLocked: vi.fn().mockReturnValue(false),
        verifyPassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@unicart.dev', password: 'CorrectPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('user@unicart.dev');
      expect(res.body.data.accessToken).toBeDefined();
      expect(mockUser.failedLogins).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('rt=');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login.success' })
      );
    });
  });

  describe('Account Lockout Acceptance Criteria', () => {
    it('locks account after 5 failed login attempts for 15 minutes', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90222'),
        email: 'bruteforce@unicart.dev',
        role: 'customer',
        failedLogins: 4, // 5th attempt about to happen
        lockUntil: null as Date | null,
        isLocked: vi.fn().mockImplementation(function (this: any) {
          return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
        }),
        verifyPassword: vi.fn().mockResolvedValue(false),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'bruteforce@unicart.dev', password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
      expect(mockUser.failedLogins).toBe(5);
      expect(mockUser.lockUntil).toBeDefined();
      expect(mockUser.lockUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login.locked' })
      );
    });

    it('denies login immediately while account is locked', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90222'),
        email: 'locked@unicart.dev',
        role: 'customer',
        failedLogins: 5,
        lockUntil: new Date(Date.now() + 10 * 60 * 1000),
        isLocked: vi.fn().mockReturnValue(true),
        verifyPassword: vi.fn(),
        save: vi.fn()
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'locked@unicart.dev', password: 'AnyPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
      expect(mockUser.verifyPassword).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Token Rotation Acceptance Criteria', () => {
    it('rotates refresh token: marks old token as revoked and issues new pair', async () => {
      const mockUserId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90333');
      const rawOldToken = 'a'.repeat(128);
      const oldTokenHash = hashToken(rawOldToken);

      const mockOldTokenRecord = {
        tokenHash: oldTokenHash,
        userId: mockUserId,
        familyId: 'family-1234-uuid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null as Date | null,
        replacedBy: null as string | null,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: mockUserId,
        role: 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };

      vi.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockOldTokenRecord as any);
      vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`rt=${rawOldToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      // Verify old token was revoked and replaced
      expect(mockOldTokenRecord.revokedAt).toBeDefined();
      expect(mockOldTokenRecord.replacedBy).toBeDefined();
      expect(mockOldTokenRecord.save).toHaveBeenCalled();

      // Verify new refresh token record created with same familyId
      expect(RefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: 'family-1234-uuid',
          userId: mockUserId
        })
      );

      // Verify new cookie set
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('rt=');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.refresh.success' })
      );
    });
  });

  describe('Refresh Token Reuse Detection Acceptance Criteria', () => {
    it('detects reuse of revoked token, revokes entire family, logs security event, and denies access', async () => {
      const mockUserId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90444');
      const rawCompromisedToken = 'b'.repeat(128);
      const compromisedTokenHash = hashToken(rawCompromisedToken);

      // Already revoked token presented!
      const mockRevokedTokenRecord = {
        tokenHash: compromisedTokenHash,
        userId: mockUserId,
        familyId: 'family-compromised-uuid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 60000), // revoked 1 minute ago
        replacedBy: 'some_new_token_hash'
      };

      vi.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockRevokedTokenRecord as any);
      const updateManySpy = vi.spyOn(RefreshToken, 'updateMany').mockResolvedValue({} as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`rt=${rawCompromisedToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Crucial: Entire family must be revoked!
      expect(updateManySpy).toHaveBeenCalledWith(
        { familyId: 'family-compromised-uuid' },
        expect.objectContaining({ revokedAt: expect.any(Date) })
      );

      // Security audit log created
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.refresh.reuse_detected',
          target: mockUserId.toString(),
          meta: expect.objectContaining({ severity: 'HIGH_SECURITY_ALERT' })
        })
      );
    });
  });

  describe('Role-Based Access Control (RBAC) Acceptance Criteria', () => {
    it('denies unauthenticated requests on protected endpoints (401)', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_MISSING');
    });

    it('denies access if token session is invalidated by tokenVersion bump (401)', async () => {
      const userId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90555');
      // Token signed with tokenVersion 0
      const token = signAccessToken({
        sub: userId.toString(),
        role: 'customer',
        tokenVersion: 0
      });

      // User in DB has tokenVersion 1 (e.g. after logout-all)
      const mockUser = {
        _id: userId,
        role: 'customer',
        tokenVersion: 1,
        isLocked: vi.fn().mockReturnValue(false)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('SESSION_INVALIDATED');
    });

    it('denies customer role access to admin-only route (role denial 403)', async () => {
      const customerId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90666');
      const token = signAccessToken({
        sub: customerId.toString(),
        role: 'customer',
        tokenVersion: 0
      });

      const mockCustomer = {
        _id: customerId,
        role: 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockCustomer)
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin role access to admin-only route (200)', async () => {
      const adminId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90777');
      const token = signAccessToken({
        sub: adminId.toString(),
        role: 'admin',
        tokenVersion: 0
      });

      const mockAdmin = {
        _id: adminId,
        role: 'admin',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdmin)
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin access granted');
    });
  });

  describe('Session Termination: Logout and LogoutAll', () => {
    it('logout: revokes current refresh token and clears rt cookie', async () => {
      const userId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');
      const token = signAccessToken({
        sub: userId.toString(),
        role: 'customer',
        tokenVersion: 0
      });

      const mockUser = {
        _id: userId,
        role: 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      const updateOneSpy = vi.spyOn(RefreshToken, 'updateOne').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const rawRt = 'c'.repeat(128);
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', [`rt=${rawRt}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({ tokenHash: hashToken(rawRt) }),
        expect.objectContaining({ revokedAt: expect.any(Date) })
      );
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('rt=;'); // cleared cookie
    });

    it('logout-all: bumps tokenVersion and revokes all refresh tokens in DB', async () => {
      const userId = new mongoose.Types.ObjectId('64b1f2e3d4c5b6a7e8f90999');
      const token = signAccessToken({
        sub: userId.toString(),
        role: 'customer',
        tokenVersion: 0
      });

      const mockUser = {
        _id: userId,
        role: 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      const updateManySpy = vi.spyOn(RefreshToken, 'updateMany').mockResolvedValue({} as any);
      const auditSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockUser.tokenVersion).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(updateManySpy).toHaveBeenCalledWith(
        { userId, revokedAt: null },
        expect.objectContaining({ revokedAt: expect.any(Date) })
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.logout_all' })
      );
    });
  });

  describe('Auth Rate Limiting Acceptance Criteria', () => {
    it('returns 429 when rate limit of 5 requests is exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'bad@unicart.dev' });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ email: 'bad@unicart.dev' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
