import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';
import { requireAdmin } from '../src/middleware/rbac.js';
import { authenticate } from '../src/middleware/auth.js';

describe('Phase 4 Acceptance: User Profile & Role Authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const testUserId = new mongoose.Types.ObjectId('65d21e84f509170321a5a120');

  const createValidToken = (role: 'customer' | 'admin' = 'customer', tokenVersion = 0) => {
    return jwt.sign(
      { sub: testUserId.toString(), role, tokenVersion },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  };

  describe('GET /api/v1/users/me', () => {
    it('returns 401 UNAUTHORIZED when no Bearer token is provided', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns user profile data without sensitive fields for authenticated user (200)', async () => {
      const token = createValidToken('customer', 0);

      const mockUser = {
        _id: testUserId,
        name: 'Alice Cooper',
        email: 'alice@example.com',
        role: 'customer',
        tokenVersion: 0,
        addresses: [
          {
            line1: '123 Market St',
            city: 'Bangalore',
            state: 'KA',
            pincode: '560001',
            country: 'IN'
          }
        ],
        toJSON() {
          return {
            id: testUserId.toString(),
            name: this.name,
            email: this.email,
            role: this.role,
            addresses: this.addresses
          };
        }
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      } as any);

      // UserService.getProfile
      vi.spyOn(User, 'findById').mockImplementation(((id: any) => {
        if (typeof id === 'object' || id === testUserId.toString()) {
          return {
            select: vi.fn().mockResolvedValue(mockUser),
            then: (resolve: any) => Promise.resolve(mockUser).then(resolve)
          };
        }
        return Promise.resolve(mockUser);
      }) as any);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('alice@example.com');
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.tokenVersion).toBeUndefined();
      expect(res.body.data.failedLogins).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('updates name and addresses with strict schema validation (200)', async () => {
      const token = createValidToken('customer', 0);

      const mockUserDoc = {
        _id: testUserId,
        name: 'Alice Cooper',
        email: 'alice@example.com',
        role: 'customer',
        tokenVersion: 0,
        addresses: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc),
        then: (resolve: any) => Promise.resolve(mockUserDoc).then(resolve)
      } as any);

      const updatedPayload = {
        name: 'Alice C.',
        addresses: [
          {
            line1: '456 Tech Park',
            city: 'Hyderabad',
            state: 'TS',
            pincode: '500081',
            country: 'IN'
          }
        ]
      };

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUserDoc.name).toBe('Alice C.');
      expect(mockUserDoc.addresses.length).toBe(1);
    });

    it('rejects unknown fields with 422 (.strict() validation)', async () => {
      const token = createValidToken('customer', 0);

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Valid Name',
          role: 'admin', // Malicious privilege escalation
          hack: true
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects more than 5 addresses with 422', async () => {
      const token = createValidToken('customer', 0);

      const excessiveAddresses = Array.from({ length: 6 }).map((_, i) => ({
        line1: `Street ${i}`,
        city: 'City',
        state: 'ST',
        pincode: '123456',
        country: 'IN'
      }));

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          addresses: excessiveAddresses
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('RBAC Authorization', () => {
    it('forbids customer role from accessing admin-only endpoint (403 FORBIDDEN)', async () => {
      // Create a temporary route on app guarded by requireAdmin
      app.get('/api/v1/admin/test-rbac', authenticate, requireAdmin, (_req, res) => {
        res.status(200).json({ success: true, message: 'Welcome admin' });
      });

      const customerToken = createValidToken('customer', 0);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: testUserId,
          email: 'customer@example.com',
          role: 'customer',
          tokenVersion: 0
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test-rbac')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
