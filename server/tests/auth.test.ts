import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { hashPassword } from '../src/utils/password.js';
import { env } from '../src/config/env.js';

describe('Phase 4 Acceptance: Authentication & RBAC', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('creates a new customer account successfully with hashed password (201)', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(User, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId('65d21e84f509170321a5a111'),
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'customer'
      } as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('jane@example.com');
      expect(res.body.data.role).toBe('customer');
      expect(res.body.data.password).toBeUndefined();
    });

    it('rejects duplicate email with 409 conflict', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'taken@example.com'
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'taken@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_IN_USE');
    });

    it('validates password security requirements (rejects weak passwords with 422)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'simple' // too short, no uppercase, no numbers
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('strictly rejects unknown payload fields with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123',
          role: 'admin', // attempting privilege escalation
          extraField: 'hacker'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('authenticates valid credentials, returns JWT and sets httpOnly rt cookie (200)', async () => {
      const hashedPassword = await hashPassword('Password123');
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a112');

      const mockUser = {
        _id: userId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'customer',
        tokenVersion: 0,
        failedLogins: 0,
        lockUntil: null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);

      vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@example.com');

      // Verify cookie is set with httpOnly and SameSite=Strict
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('rt=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
      expect(cookieStr.toLowerCase()).toContain('samesite=strict');
    });

    it('rejects invalid password with 401 generic error', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'jane@example.com',
        password: hashedPassword,
        failedLogins: 0,
        lockUntil: null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(mockUser.failedLogins).toBe(1);
    });

    it('locks account after 5 consecutive failed login attempts', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'victim@example.com',
        password: hashedPassword,
        failedLogins: 4, // 5th failure incoming
        lockUntil: null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'victim@example.com',
          password: 'WrongPasswordAgain'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
      expect(mockUser.lockUntil).toBeDefined();
      expect(mockUser.lockUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('prevents login when account is currently locked (401 ACCOUNT_LOCKED)', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'locked@example.com',
        failedLogins: 5,
        lockUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes in future
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'locked@example.com',
          password: 'AnyPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('POST /api/v1/auth/refresh (Rotation & Reuse Detection)', () => {
    it('rotates refresh token and issues fresh access token (200)', async () => {
      const rawToken = 'a'.repeat(128);
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a113');

      const mockTokenDoc = {
        tokenHash,
        userId,
        familyId: 'family-12345',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedBy: null,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: userId,
        role: 'customer',
        tokenVersion: 0
      };

      vi.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockTokenDoc as any);
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);
      vi.spyOn(RefreshToken, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`rt=${rawToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(mockTokenDoc.revokedAt).toBeDefined();
      expect(mockTokenDoc.replacedBy).toBeDefined();
    });

    it('REUSE DETECTION: revokes entire family and bumps tokenVersion when revoked token presented', async () => {
      const rawToken = 'b'.repeat(128);
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a114');

      const mockRevokedDoc = {
        tokenHash,
        userId,
        familyId: 'family-compromised',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 60000), // ALREADY REVOKED!
        replacedBy: 'some-replacement-hash'
      };

      vi.spyOn(RefreshToken, 'findOne').mockResolvedValue(mockRevokedDoc as any);
      const updateManySpy = vi.spyOn(RefreshToken, 'updateMany').mockResolvedValue({} as any);
      const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`rt=${rawToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REUSE_DETECTED');
      expect(updateManySpy).toHaveBeenCalledWith(
        { familyId: 'family-compromised', revokedAt: null },
        expect.objectContaining({ revokedAt: expect.any(Date) })
      );
      expect(userUpdateSpy).toHaveBeenCalledWith(
        userId,
        { $inc: { tokenVersion: 1 } }
      );
    });
  });

  describe('POST /api/v1/auth/logout & /auth/logout-all', () => {
    it('revokes current refresh token and clears cookie on logout (200)', async () => {
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a115');
      const validToken = jwt.sign(
        { sub: userId.toString(), role: 'customer', tokenVersion: 0 },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          email: 'test@example.com',
          role: 'customer',
          tokenVersion: 0
        })
      } as any);

      const revokeSpy = vi.spyOn(RefreshToken, 'findOneAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Cookie', ['rt=sample-refresh-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(revokeSpy).toHaveBeenCalled();
    });

    it('invalidates all active sessions on logout-all via tokenVersion bump (200)', async () => {
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a116');
      const validToken = jwt.sign(
        { sub: userId.toString(), role: 'customer', tokenVersion: 0 },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          email: 'test@example.com',
          role: 'customer',
          tokenVersion: 0
        })
      } as any);

      const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);
      const updateManySpy = vi.spyOn(RefreshToken, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(userUpdateSpy).toHaveBeenCalledWith(userId.toString(), { $inc: { tokenVersion: 1 } });
      expect(updateManySpy).toHaveBeenCalledWith(
        { userId: userId.toString(), revokedAt: null },
        expect.objectContaining({ revokedAt: expect.any(Date) })
      );
    });
  });

  describe('RBAC & Token Invalidation Enforcement', () => {
    it('denies access (401 TOKEN_INVALIDATED) when tokenVersion does not match user record', async () => {
      const userId = new mongoose.Types.ObjectId('65d21e84f509170321a5a117');
      const oldToken = jwt.sign(
        { sub: userId.toString(), role: 'customer', tokenVersion: 0 },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      // Database has bumped tokenVersion to 1
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          email: 'test@example.com',
          role: 'customer',
          tokenVersion: 1 // Invalidation!
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALIDATED');
    });
  });
});
