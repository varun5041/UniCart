import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../src/app.js';
import { Product, Cart, Order, User } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';
import { signAccessToken } from '../src/utils/token.js';

describe('Phase 6 Acceptance: Cart & Transactional Idempotent Checkout', () => {
  let redisMemoryStore: Map<string, string>;
  let mockRedisClient: any;

  const userAId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90001');
  const userBId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90002');

  const tokenUserA = signAccessToken({
    sub: userAId.toString(),
    role: 'customer',
    tokenVersion: 0
  });

  const mockAddress = {
    line1: '123 MG Road, Flat 4B',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India'
  };

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
      const idStr = id.toString();
      const mockUser = {
        _id: new Types.ObjectId(idStr),
        role: 'customer',
        tokenVersion: 0,
        isLocked: vi.fn().mockReturnValue(false)
      };
      return {
        select: vi.fn().mockResolvedValue(mockUser)
      } as any;
    });

    // Mock startSession
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(createMockSession() as any);
  });

  afterEach(() => {
    setRedisClientForTest(null);
    vi.restoreAllMocks();
  });

  describe('Cart Management Endpoints', () => {
    it('GET /api/v1/cart returns empty cart when no cart exists', async () => {
      vi.spyOn(Cart, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.subtotal).toBe(0);
      expect(res.body.data.itemCount).toBe(0);
    });

    it('POST /api/v1/cart/items adds product and computes live subtotal from DB price', async () => {
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90111');
      const mockProduct = {
        _id: prodId,
        name: 'Ergonomic Desk Mat',
        slug: 'ergonomic-desk-mat',
        price: 99900, // ₹999.00
        stock: 15,
        isActive: true,
        images: []
      };

      vi.spyOn(Product, 'findOne').mockResolvedValue(mockProduct as any);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProduct])
      } as any);

      const mockCartDoc = {
        userId: userAId,
        items: [{ productId: prodId, qty: 2 }],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Cart, 'findOne')
        .mockResolvedValueOnce(null) // first find
        .mockResolvedValueOnce(mockCartDoc as any); // second find in getCart

      vi.spyOn(Cart.prototype, 'save').mockImplementation(async function (this: any) {
        return this;
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          productId: prodId.toString(),
          qty: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itemCount).toBe(2);
      expect(res.body.data.subtotal).toBe(199800); // 2 * 99900
    });

    it('rejects adding more than 10 units of an item', async () => {
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90111');
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          productId: prodId.toString(),
          qty: 15 // exceeds 10
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('DELETE /api/v1/cart clears all items from cart', async () => {
      const mockCartDoc = {
        userId: userAId,
        items: [{ productId: new Types.ObjectId(), qty: 1 }],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc as any);

      const res = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(mockCartDoc.items).toEqual([]);
      expect(mockCartDoc.save).toHaveBeenCalled();
    });
  });

  describe('Idempotency & Concurrency Acceptance Criteria', () => {
    it('rejects order creation if Idempotency-Key header is missing (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ shippingAddress: mockAddress });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    });

    it('duplicate idempotency key returns exact same order without duplicate creation or double decrement', async () => {
      const idempotencyKey = uuidv4();
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90333');

      const mockCart = {
        userId: userAId,
        items: [{ productId: prodId, qty: 1 }]
      };

      const mockProduct = {
        _id: prodId,
        name: '4K Monitor',
        price: 2499900,
        stock: 5,
        isActive: true
      };

      const mockCreatedOrder = {
        _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90444'),
        userId: userAId,
        items: [{ productId: prodId, name: '4K Monitor', price: 2499900, qty: 1 }],
        subtotal: 2499900,
        shipping: 0,
        total: 2499900,
        status: 'pending_payment',
        idempotencyKey,
        toObject: () => mockCreatedOrder
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCart as any);
      vi.spyOn(Cart, 'updateOne').mockResolvedValue({} as any);
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(mockProduct as any);
      const orderCreateSpy = vi.spyOn(Order, 'create').mockResolvedValue([mockCreatedOrder] as any);

      // Order.findOne: first call null, subsequent calls find the order
      vi.spyOn(Order, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockCreatedOrder as any);

      // Request 1: Fresh creation
      const res1 = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ shippingAddress: mockAddress });

      expect(res1.status).toBe(201);
      expect(res1.body.data.idempotencyKey).toBe(idempotencyKey);
      expect(orderCreateSpy).toHaveBeenCalledTimes(1);

      // Request 2: Repeated request with identical Idempotency-Key
      const res2 = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ shippingAddress: mockAddress });

      expect(res2.status === 200 || res2.status === 201).toBe(true);
      expect(res2.body.data.idempotencyKey).toBe(idempotencyKey);

      // Order creation and Product decrement should NOT have been called again!
      expect(orderCreateSpy).toHaveBeenCalledTimes(1);
    });

    it('Concurrency Test: 20 parallel orders competing for stock=5 → exactly 5 succeed, 15 fail', async () => {
      let currentStock = 5;
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90555');

      const mockCart = {
        userId: userAId,
        items: [{ productId: prodId, qty: 1 }]
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCart as any);
      vi.spyOn(Cart, 'updateOne').mockResolvedValue({} as any);
      vi.spyOn(Order, 'findOne').mockResolvedValue(null);

      // Atomic conditional decrement simulation:
      // Product.findOneAndUpdate({ _id, stock: { $gte: 1 } }, { $inc: { stock: -1 } })
      vi.spyOn(Product, 'findOneAndUpdate').mockImplementation(async () => {
        if (currentStock >= 1) {
          currentStock -= 1;
          return {
            _id: prodId,
            name: 'Flash Sale Item',
            price: 50000,
            stock: currentStock,
            isActive: true
          } as any;
        }
        return null; // Out of stock!
      });

      vi.spyOn(Order, 'create').mockImplementation(async ([orderData]: any) => {
        return [
          {
            ...orderData,
            _id: new Types.ObjectId(),
            toObject: function () {
              return this;
            }
          }
        ] as any;
      });

      // Dispatch 20 simultaneous parallel checkout requests
      const requests = Array.from({ length: 20 }).map((_, i) =>
        request(app)
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .set('Idempotency-Key', `concurrent-key-${i}-${uuidv4()}`)
          .send({ shippingAddress: mockAddress })
      );

      const responses = await Promise.all(requests);

      const successfulOrders = responses.filter((r) => r.status === 201);
      const outOfStockOrders = responses.filter(
        (r) => r.status === 409 && r.body.error?.code === 'OUT_OF_STOCK'
      );

      // Verify the non-negotiable concurrency invariant:
      expect(successfulOrders.length).toBe(5);
      expect(outOfStockOrders.length).toBe(15);
      expect(currentStock).toBe(0);
    });
  });

  describe('IDOR & Ownership Protection Acceptance Criteria', () => {
    it('User A cannot read User B’s order (403 FORBIDDEN)', async () => {
      const orderBId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90666');

      const mockOrderB = {
        _id: orderBId,
        userId: userBId, // Belongs to User B!
        items: [],
        subtotal: 100000,
        shipping: 0,
        total: 100000,
        status: 'pending_payment'
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrderB as any);

      // User A attempts to access User B's order
      const res = await request(app)
        .get(`/api/v1/orders/${orderBId.toString()}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('User A cannot cancel User B’s order (403 FORBIDDEN)', async () => {
      const orderBId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90666');

      const mockOrderB = {
        _id: orderBId,
        userId: userBId, // Belongs to User B
        status: 'pending_payment',
        items: []
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrderB as any);

      const res = await request(app)
        .post(`/api/v1/orders/${orderBId.toString()}/cancel`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Payment and Cancellation State Transitions', () => {
    it('POST /orders/:id/pay marks order as paid with paymentRef and is idempotent', async () => {
      const orderId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90777');
      const mockOrder = {
        _id: orderId,
        userId: userAId,
        status: 'pending_payment',
        paymentRef: null as string | null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);

      const res = await request(app)
        .post(`/api/v1/orders/${orderId.toString()}/pay`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ paymentRef: 'gateway_ref_12345' });

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('paid');
      expect(mockOrder.paymentRef).toBe('gateway_ref_12345');
      expect(mockOrder.save).toHaveBeenCalled();

      // Repeated call (idempotent)
      const resRepeat = await request(app)
        .post(`/api/v1/orders/${orderId.toString()}/pay`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ paymentRef: 'gateway_ref_12345' });

      expect(resRepeat.status).toBe(200);
      expect(resRepeat.body.data.status).toBe('paid');
    });

    it('POST /orders/:id/cancel restores stock in an atomic transaction', async () => {
      const orderId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');
      const prodId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90999');

      const mockOrder = {
        _id: orderId,
        userId: userAId,
        status: 'pending_payment',
        items: [{ productId: prodId, qty: 3 }],
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const updateProductSpy = vi.spyOn(Product, 'updateOne').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/orders/${orderId.toString()}/cancel`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('cancelled');
      expect(mockOrder.save).toHaveBeenCalled();

      // Verify stock restoration: Product.updateOne({ _id }, { $inc: { stock: 3 } })
      expect(updateProductSpy).toHaveBeenCalledWith(
        { _id: prodId },
        { $inc: { stock: 3 } },
        expect.objectContaining({ session: expect.anything() })
      );
    });

    it('rejects cancellation if order is already paid', async () => {
      const orderId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');

      const mockPaidOrder = {
        _id: orderId,
        userId: userAId,
        status: 'paid',
        items: []
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockPaidOrder as any);

      const res = await request(app)
        .post(`/api/v1/orders/${orderId.toString()}/cancel`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_ORDER');
    });
  });
});
