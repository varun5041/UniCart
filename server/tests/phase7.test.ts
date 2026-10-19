import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { app } from '../src/app.js';
import { Order, Product, AuditLog, User } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';
import { signAccessToken } from '../src/utils/token.js';
import { sendOrderConfirmationEmail } from '../src/jobs/email.job.js';
import { VALID_ORDER_TRANSITIONS } from '../src/modules/admin/admin.service.js';

describe('Phase 7 Acceptance: Background Worker Queue & Admin Order Management', () => {
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

  const createMockSession = () => ({
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn()
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
        const cur = parseInt(redisMemoryStore.get(key) || '1', 10);
        const next = cur + 1;
        redisMemoryStore.set(key, String(next));
        return next;
      })
    };

    setRedisClientForTest(mockRedisClient);

    // Mock User.findById for authenticate middleware
    vi.spyOn(User, 'findById').mockImplementation((id: any) => {
      const idStr = id?.toString();
      const isAdmin = idStr === adminUserId.toString();
      const mockUser = {
        _id: new Types.ObjectId(idStr),
        name: isAdmin ? 'Admin User' : 'Customer User',
        email: isAdmin ? 'admin@unicart.dev' : 'customer@unicart.dev',
        role: isAdmin ? 'admin' : 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };
      return {
        select: vi.fn().mockResolvedValue(mockUser)
      } as any;
    });

    vi.spyOn(mongoose, 'startSession').mockResolvedValue(createMockSession() as any);
  });

  describe('Background Email Job Producer & Consumer', () => {
    it('sends order confirmation email via transporter without error', async () => {
      const emailPayload = {
        orderId: '64b1f2e3d4c5b6a7e8f90010',
        userId: customerUserId.toString(),
        total: 199900,
        items: [
          { name: 'Ergonomic Keyboard', qty: 1, price: 199900 }
        ],
        customerEmail: 'testbuyer@unicart.dev'
      };

      const result = await sendOrderConfirmationEmail(emailPayload);
      expect(result).toBe(true);
    });
  });

  describe('Admin Order State Transitions & Validation (Acceptance Criterion)', () => {
    it('defines explicit finite state transitions', () => {
      expect(VALID_ORDER_TRANSITIONS).toBeDefined();
      expect(VALID_ORDER_TRANSITIONS.pending_payment).toEqual(['paid', 'cancelled']);
      expect(VALID_ORDER_TRANSITIONS.paid).toEqual(['shipped', 'cancelled']);
      expect(VALID_ORDER_TRANSITIONS.shipped).toEqual(['delivered', 'cancelled']);
      expect(VALID_ORDER_TRANSITIONS.delivered).toEqual([]);
      expect(VALID_ORDER_TRANSITIONS.cancelled).toEqual([]);
    });

    it('rejects invalid state transition with 422 Unprocessable Entity (e.g. delivered -> pending_payment)', async () => {
      const mockOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90020'),
        status: 'delivered',
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${mockOrder._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'pending_payment' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
      expect(res.body.error.message).toMatch(/Invalid status transition/);
    });

    it('rejects transition from cancelled to paid with 422', async () => {
      const mockOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90021'),
        status: 'cancelled',
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${mockOrder._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('allows valid state transition (pending_payment -> paid) and emits audit log', async () => {
      const mockOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90022'),
        status: 'pending_payment',
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const auditCreateSpy = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${mockOrder._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockOrder.status).toBe('paid');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(auditCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'order.status.update',
          target: mockOrder._id.toString(),
          meta: expect.objectContaining({
            previousStatus: 'pending_payment',
            newStatus: 'paid'
          })
        })
      );
    });

    it('allows valid state transition (paid -> shipped)', async () => {
      const mockOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90023'),
        status: 'paid',
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${mockOrder._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockOrder.status).toBe('shipped');
    });

    it('restores product stock in transaction when admin cancels an order', async () => {
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90030');
      const mockOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90031'),
        status: 'paid',
        items: [
          { productId: prodId, name: 'Wireless Headphones', price: 499900, qty: 2 }
        ],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const mockSession = createMockSession();
      vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);
      const productUpdateSpy = vi.spyOn(Product, 'updateOne').mockResolvedValue({} as any);
      vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${mockOrder._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockOrder.status).toBe('cancelled');
      expect(productUpdateSpy).toHaveBeenCalledWith(
        { _id: prodId },
        { $inc: { stock: 2 } },
        { session: mockSession }
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('RBAC & Ownership Security', () => {
    it('denies unauthenticated request to /api/v1/admin/orders with 401', async () => {
      const res = await request(app).get('/api/v1/admin/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('denies customer role from accessing /api/v1/admin/orders with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies customer role from updating order status with 403', async () => {
      const orderId = '64b1f2e3d4c5b6a7e8f90040';
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'shipped' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('denies customer role from viewing audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Queries: Orders & Audit Logs', () => {
    it('returns paginated orders for admin', async () => {
      const mockOrders = [
        { _id: new Types.ObjectId(), status: 'paid', total: 50000 },
        { _id: new Types.ObjectId(), status: 'shipped', total: 75000 }
      ];

      vi.spyOn(Order, 'countDocuments').mockResolvedValue(2 as any);
      vi.spyOn(Order, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockOrders)
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });

    it('returns paginated audit logs for admin', async () => {
      const mockLogs = [
        {
          _id: new Types.ObjectId(),
          action: 'order.status.update',
          target: '64b1f2e3d4c5b6a7e8f90010',
          createdAt: new Date().toISOString()
        }
      ];

      vi.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(AuditLog, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLogs)
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/audit-logs?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });
});
