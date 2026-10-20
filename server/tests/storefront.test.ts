import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { Product, Category, User, Coupon, AuditLog } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';
import { signAccessToken } from '../src/utils/token.js';
import { escapeRegex, computeSalePrice } from '../src/utils/pricing.js';
import { couponService, computeShipping } from '../src/modules/coupons/coupon.service.js';
import { cartService } from '../src/modules/cart/cart.service.js';

describe('Storefront: search, discounts, coupons, addresses & wishlist', () => {
  let redisMemoryStore: Map<string, string>;

  const adminId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90aa1');
  const customerId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90cc1');
  const adminToken = signAccessToken({ sub: adminId.toString(), role: 'admin', tokenVersion: 0 });
  const customerToken = signAccessToken({
    sub: customerId.toString(),
    role: 'customer',
    tokenVersion: 0
  });
  const productId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90bb1');

  const mockAuthUser = (id: Types.ObjectId, role: 'admin' | 'customer') =>
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: id,
        name: 'Test User',
        email: `${role}@example.com`,
        role,
        tokenVersion: 0,
        addresses: [],
        wishlist: [],
        isLocked: vi.fn().mockReturnValue(false)
      })
    } as any);

  const chainable = (result: unknown) =>
    ({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(result)
    }) as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    redisMemoryStore = new Map<string, string>();
    setRedisClientForTest({
      status: 'ready',
      get: vi.fn(async (key: string) => redisMemoryStore.get(key) || null),
      set: vi.fn(async (key: string, val: string) => {
        redisMemoryStore.set(key, val);
        return 'OK';
      }),
      del: vi.fn(async () => 1),
      incr: vi.fn(async () => 2)
    } as any);
  });

  afterEach(() => {
    setRedisClientForTest(null);
    vi.restoreAllMocks();
  });

  describe('Pricing helpers', () => {
    it('computes sale price from MRP and discount', () => {
      expect(computeSalePrice(100000, 0)).toBe(100000);
      expect(computeSalePrice(100000, 25)).toBe(75000);
      expect(computeSalePrice(99900, 33)).toBe(66933);
    });

    it('escapes regex metacharacters in search input', () => {
      expect(escapeRegex('a.b*(c)')).toBe('a\\.b\\*\\(c\\)');
      expect(new RegExp(escapeRegex('(((a+)+)+')).test('(((a+)+)+')).toBe(true);
    });

    it('applies free shipping at ₹500 after discount', () => {
      expect(computeShipping(50000)).toBe(0);
      expect(computeShipping(49999)).toBe(5000);
    });
  });

  describe('Advanced product search', () => {
    it('builds a filter for on-sale, in-stock, escaped search and discount sort', async () => {
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(0 as any);
      const find = vi.spyOn(Product, 'find').mockReturnValue(chainable([]));

      const res = await request(app).get(
        '/api/v1/products?q=usb.c(&onSale=true&inStock=true&sort=discount'
      );

      expect(res.status).toBe(200);
      const filter = find.mock.calls[0][0] as Record<string, any>;
      expect(filter.isActive).toBe(true);
      expect(filter.discountPercent).toEqual({ $gt: 0 });
      expect(filter.stock).toEqual({ $gt: 0 });
      expect(filter.$or[0].name.$regex).toBe('usb\\.c\\(');
    });

    it('minDiscount takes precedence over onSale', async () => {
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(0 as any);
      const find = vi.spyOn(Product, 'find').mockReturnValue(chainable([]));

      await request(app).get('/api/v1/products?onSale=true&minDiscount=40');
      expect((find.mock.calls[0][0] as any).discountPercent).toEqual({ $gte: 40 });
    });

    it('rejects minPrice greater than maxPrice and unknown query fields', async () => {
      const bad = await request(app).get('/api/v1/products?minPrice=500&maxPrice=100');
      expect(bad.status).toBe(422);

      const unknown = await request(app).get('/api/v1/products?isActive=false');
      expect(unknown.status).toBe(422);
    });
  });

  describe('Admin product discount & unlisting', () => {
    it('creates a product with server-computed sale price from MRP and discount', async () => {
      mockAuthUser(adminId, 'admin');
      vi.spyOn(Category, 'findOne').mockResolvedValue({ _id: new Types.ObjectId() } as any);
      vi.spyOn(Product, 'findOne').mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any);
      vi.spyOn(Product.prototype, 'save').mockImplementation(async function (this: any) {
        return this;
      });

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Running Shoes',
          description: 'Lightweight running shoes with cushioned sole.',
          mrp: 400000,
          discountPercent: 25,
          stock: 10,
          category: 'sports-fitness'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.mrp).toBe(400000);
      expect(res.body.data.discountPercent).toBe(25);
      expect(res.body.data.price).toBe(300000);
    });

    it('rejects discount above 90% and ignores client-supplied price when discounting', async () => {
      mockAuthUser(adminId, 'admin');
      const res = await request(app)
        .patch(`/api/v1/admin/products/${productId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ discountPercent: 95 });
      expect(res.status).toBe(422);
    });

    it('recomputes price when only the discount changes', async () => {
      mockAuthUser(adminId, 'admin');
      const existing: any = {
        _id: productId,
        mrp: 200000,
        price: 200000,
        discountPercent: 0,
        save: vi.fn().mockResolvedValue(true)
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(existing);

      const res = await request(app)
        .patch(`/api/v1/admin/products/${productId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ discountPercent: 10 });

      expect(res.status).toBe(200);
      expect(existing.price).toBe(180000);
      expect(existing.mrp).toBe(200000);
    });

    it('unlists a product via isActive=false without deleting it', async () => {
      mockAuthUser(adminId, 'admin');
      const existing: any = { _id: productId, isActive: true, save: vi.fn().mockResolvedValue(true) };
      vi.spyOn(Product, 'findById').mockResolvedValue(existing);

      const res = await request(app)
        .patch(`/api/v1/admin/products/${productId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(existing.isActive).toBe(false);
      expect(existing.isDeleted).toBeUndefined();
    });

    it('GET /admin/products lists unlisted items but excludes deleted ones; customers get 403', async () => {
      mockAuthUser(adminId, 'admin');
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1 as any);
      const find = vi.spyOn(Product, 'find').mockReturnValue(chainable([{ _id: productId }]));

      const res = await request(app)
        .get('/api/v1/admin/products?status=unlisted')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(find.mock.calls[0][0]).toEqual({ isDeleted: { $ne: true }, isActive: false });

      vi.restoreAllMocks();
      mockAuthUser(customerId, 'customer');
      const denied = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(denied.status).toBe(403);
    });
  });

  describe('Coupons', () => {
    const coupon = (overrides: Record<string, unknown> = {}) =>
      ({
        _id: new Types.ObjectId(),
        code: 'SAVE20',
        discountPercent: 20,
        maxDiscount: null,
        minOrderValue: 0,
        usageLimit: null,
        usedCount: 0,
        expiresAt: null,
        isActive: true,
        ...overrides
      }) as any;

    it('computes percentage discount with cap, and rejects invalid states', () => {
      expect(couponService.computeDiscount(coupon(), 100000)).toBe(20000);
      expect(couponService.computeDiscount(coupon({ maxDiscount: 5000 }), 100000)).toBe(5000);
      expect(() => couponService.computeDiscount(null, 100000)).toThrow(/Invalid/);
      expect(() => couponService.computeDiscount(coupon({ isActive: false }), 100000)).toThrow();
      expect(() =>
        couponService.computeDiscount(coupon({ expiresAt: new Date(Date.now() - 1000) }), 100000)
      ).toThrow(/expired/);
      expect(() =>
        couponService.computeDiscount(coupon({ usageLimit: 5, usedCount: 5 }), 100000)
      ).toThrow(/usage limit/);
      expect(() =>
        couponService.computeDiscount(coupon({ minOrderValue: 200000 }), 100000)
      ).toThrow(/more to use/);
    });

    it('admin can create a coupon (code uppercased) and it is audit logged', async () => {
      mockAuthUser(adminId, 'admin');
      vi.spyOn(Coupon, 'findOne').mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any);
      const create = vi.spyOn(Coupon, 'create').mockResolvedValue(coupon({ code: 'DIWALI30' }));
      const audit = vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'diwali30', discountPercent: 30 });

      expect(res.status).toBe(201);
      expect((create.mock.calls[0][0] as any).code).toBe('DIWALI30');
      expect(audit).toHaveBeenCalled();
    });

    it('rejects coupon creation by customers and invalid payloads', async () => {
      mockAuthUser(customerId, 'customer');
      const denied = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'HACK', discountPercent: 90 });
      expect(denied.status).toBe(403);

      vi.restoreAllMocks();
      mockAuthUser(adminId, 'admin');
      const invalid = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'BAD CODE!', discountPercent: 150 });
      expect(invalid.status).toBe(422);
    });

    it('validates a coupon against the server-side cart subtotal (client totals are ignored)', async () => {
      mockAuthUser(customerId, 'customer');
      vi.spyOn(cartService, 'getCart').mockResolvedValue({
        items: [{ productId: productId.toString() } as any],
        subtotal: 100000,
        itemCount: 1
      });
      vi.spyOn(Coupon, 'findOne').mockResolvedValue(coupon());

      const res = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'save20' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        code: 'SAVE20',
        discountPercent: 20,
        subtotal: 100000,
        discount: 20000,
        shipping: 0,
        total: 80000
      });

      const tampered = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'SAVE20', subtotal: 1 });
      expect(tampered.status).toBe(422);
    });
  });

  describe('Saved addresses', () => {
    const validAddress = {
      line1: '12 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    };

    it('rejects invalid pincodes', async () => {
      for (const pincode of ['12345', '1234567', '012345', 'ABCDEF', '56 001']) {
        mockAuthUser(customerId, 'customer');
        const res = await request(app)
          .put('/api/v1/users/me/addresses')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ addresses: [{ ...validAddress, pincode }] });
        expect(res.status).toBe(422);
      }
    });

    it('saves addresses and normalizes exactly one default', async () => {
      mockAuthUser(customerId, 'customer');
      const update = vi.spyOn(User, 'findByIdAndUpdate').mockImplementation(((
        _id: unknown,
        upd: any
      ) =>
        Promise.resolve({
          _id: customerId,
          name: 'Test User',
          email: 'customer@example.com',
          role: 'customer',
          addresses: upd.$set.addresses,
          wishlist: []
        })) as any);

      const res = await request(app)
        .put('/api/v1/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ addresses: [validAddress, { ...validAddress, line1: '99 Park Street' }] });

      expect(res.status).toBe(200);
      expect(update.mock.calls[0][0]).toBe(customerId.toString());
      const saved = res.body.data.user.addresses;
      expect(saved).toHaveLength(2);
      expect(saved.map((a: any) => a.isDefault)).toEqual([true, false]);
    });

    it('rejects more than 5 addresses', async () => {
      mockAuthUser(customerId, 'customer');
      const res = await request(app)
        .put('/api/v1/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ addresses: Array.from({ length: 6 }, () => validAddress) });
      expect(res.status).toBe(422);
    });
  });

  describe('Wishlist', () => {
    it('adds and removes products for the authenticated user only', async () => {
      mockAuthUser(customerId, 'customer');
      vi.spyOn(Product, 'exists').mockResolvedValue({ _id: productId } as any);
      const add = vi.spyOn(User, 'findOneAndUpdate').mockReturnValue({
        select: vi.fn().mockResolvedValue({ wishlist: [productId] })
      } as any);

      const res = await request(app)
        .post('/api/v1/users/me/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.wishlist).toEqual([productId.toString()]);
      expect((add.mock.calls[0][0] as any)._id).toBe(customerId.toString());

      vi.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
        select: vi.fn().mockResolvedValue({ wishlist: [] })
      } as any);
      const del = await request(app)
        .delete(`/api/v1/users/me/wishlist/${productId.toString()}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(del.status).toBe(200);
      expect(del.body.data.wishlist).toEqual([]);
    });

    it('returns 404 for unknown products and 422 for malformed ids', async () => {
      mockAuthUser(customerId, 'customer');
      vi.spyOn(Product, 'exists').mockResolvedValue(null);
      const missing = await request(app)
        .post('/api/v1/users/me/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId.toString() });
      expect(missing.status).toBe(404);

      const malformed = await request(app)
        .post('/api/v1/users/me/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: { $ne: null } });
      expect(malformed.status).toBe(422);
    });
  });
});
