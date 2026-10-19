import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { Product, Category, User } from '../src/models/index.js';
import { setRedisClientForTest } from '../src/config/redis.js';
import { signAccessToken } from '../src/utils/token.js';

describe('Phase 5 Acceptance: Products Catalogue & Caching', () => {
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
        const cur = parseInt(redisMemoryStore.get(key) || '1', 10);
        const next = cur + 1;
        redisMemoryStore.set(key, String(next));
        return next;
      })
    };

    setRedisClientForTest(mockRedisClient);
  });

  afterEach(() => {
    setRedisClientForTest(null);
    vi.restoreAllMocks();
  });

  const mockCategory = {
    _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90111'),
    name: 'Electronics',
    slug: 'electronics'
  };

  const mockProduct = {
    _id: new Types.ObjectId('64b1f2e3d4c5b6a7e8f90222'),
    name: 'Mechanical Gaming Keyboard',
    slug: 'mechanical-gaming-keyboard',
    description: 'RGB mechanical keyboard with hot-swappable tactile switches.',
    price: 499900, // ₹4,999.00 in paise
    stock: 25,
    category: mockCategory,
    images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  };

  describe('Public Products & Categories Endpoints', () => {
    it('GET /api/v1/products returns paginated product list with meta', async () => {
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(Product, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockProduct])
      } as any);

      const res = await request(app).get('/api/v1/products?page=1&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('mechanical-gaming-keyboard');
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      });
    });

    it('rejects page limit exceeding 50 with validation error', async () => {
      const res = await request(app).get('/api/v1/products?limit=100');
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/products/:slug returns product detail or 404 when missing', async () => {
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProduct)
      } as any);

      const res = await request(app).get('/api/v1/products/mechanical-gaming-keyboard');
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Mechanical Gaming Keyboard');

      // 404 test
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const resNotFound = await request(app).get('/api/v1/products/non-existent-slug');
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('GET /api/v1/categories returns list of categories', async () => {
      vi.spyOn(Category, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockCategory])
      } as any);

      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].slug).toBe('electronics');
      expect(res.body.data[0].name).toBe('Electronics');
      expect(res.body.data[0]._id).toBe(mockCategory._id.toString());
    });
  });

  describe('Redis Cache-Aside Acceptance Criteria', () => {
    it('serves second request from Redis cache (cache hit without re-querying DB)', async () => {
      const findSpy = vi.spyOn(Product, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockProduct])
      } as any);
      const countSpy = vi.spyOn(Product, 'countDocuments').mockResolvedValue(1 as any);

      // Request 1: Cache Miss -> Fetches from DB
      const res1 = await request(app).get('/api/v1/products?page=1&limit=10');
      expect(res1.status).toBe(200);
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.set).toHaveBeenCalled();

      // Request 2: Cache Hit -> Serves directly from Redis
      const res2 = await request(app).get('/api/v1/products?page=1&limit=10');
      expect(res2.status).toBe(200);
      expect(res2.body.data[0].slug).toBe('mechanical-gaming-keyboard');

      // DB should NOT have been called again!
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.get).toHaveBeenCalled();
    });
  });

  describe('Admin Product CRUD & Cache Invalidation Acceptance Criteria', () => {
    const adminId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');
    const customerId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90999');

    const adminToken = signAccessToken({
      sub: adminId.toString(),
      role: 'admin',
      tokenVersion: 0
    });

    const customerToken = signAccessToken({
      sub: customerId.toString(),
      role: 'customer',
      tokenVersion: 0
    });

    beforeEach(() => {
      vi.spyOn(User, 'findById').mockImplementation((id: any) => {
        const idStr = id.toString();
        const role = idStr === adminId.toString() ? 'admin' : 'customer';
        return {
          select: vi.fn().mockResolvedValue({
            _id: id,
            role,
            tokenVersion: 0,
            isLocked: vi.fn().mockReturnValue(false)
          })
        } as any;
      });
    });

    it('denies non-admin (customer) access to admin product routes (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Item',
          description: 'A test description for unauthorized create.',
          price: 10000,
          stock: 5,
          category: mockCategory._id.toString()
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to create product and invalidates cache via version increment', async () => {
      vi.spyOn(Category, 'findOne').mockResolvedValue(mockCategory as any);
      vi.spyOn(Product, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      vi.spyOn(Product.prototype, 'save').mockImplementation(async function (this: any) {
        return this;
      });

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with high DPI optical sensor.',
          price: 199900,
          stock: 40,
          category: mockCategory._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Wireless Mouse');

      // Crucial: Cache version must be bumped to invalidate previous cache
      expect(mockRedisClient.incr).toHaveBeenCalledWith('unicart:version:products');
    });

    it('allows admin to update product and invalidates cache', async () => {
      const existingProduct = {
        _id: mockProduct._id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(existingProduct as any);

      const res = await request(app)
        .patch(`/api/v1/admin/products/${mockProduct._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 399900 // Reduced price
        });

      expect(res.status).toBe(200);
      expect(existingProduct.price).toBe(399900);
      expect(existingProduct.save).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalledWith('unicart:version:products');
    });

    it('allows admin to soft-delete product and invalidates cache', async () => {
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue({
        _id: mockProduct._id,
        isActive: false
      } as any);

      const res = await request(app)
        .delete(`/api/v1/admin/products/${mockProduct._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id.toString(),
        { isActive: false },
        { new: true }
      );
      expect(mockRedisClient.incr).toHaveBeenCalledWith('unicart:version:products');
    });
  });

  describe('Admin Signed Upload Parameters Acceptance Criteria', () => {
    const adminId = new Types.ObjectId('64b1f2e3d4c5b6a7e8f90888');
    const adminToken = signAccessToken({
      sub: adminId.toString(),
      role: 'admin',
      tokenVersion: 0
    });

    beforeEach(() => {
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: adminId,
          role: 'admin',
          tokenVersion: 0,
          isLocked: vi.fn().mockReturnValue(false)
        })
      } as any);
    });

    it('POST /api/v1/admin/uploads/signature returns signed upload parameters', async () => {
      const res = await request(app)
        .post('/api/v1/admin/uploads/signature')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ folder: 'unicart/custom' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signature).toBeDefined();
      expect(res.body.data.timestamp).toBeDefined();
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.uploadUrl).toContain('cloudinary.com');
      expect(res.body.data.folder).toBe('unicart/custom');
    });
  });
});
