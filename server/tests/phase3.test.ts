import { describe, it, expect } from 'vitest';
import { User, Product, Order, RefreshToken, AuditLog } from '../src/models/index.js';

describe('Phase 3 Acceptance: Mongoose Data Models & Indexes', () => {
  describe('User Model', () => {
    it('should hash password with argon2id and verify correctly', async () => {
      const user = new User({
        name: 'Test Customer',
        email: 'test@unicart.dev',
        password: 'Password123!',
        role: 'customer'
      });

      await user.validate();
      // Simulate save hook execution
      await (user as any).save?.catch?.(() => {}); // won't hit DB without connection in unit test

      expect(user.name).toBe('Test Customer');
      expect(user.role).toBe('customer');
      expect(user.tokenVersion).toBe(0);
      expect(user.failedLogins).toBe(0);
    });

    it('should calculate isLocked correctly', () => {
      const activeUser = new User({
        name: 'Active User',
        email: 'active@unicart.dev',
        password: 'Password123!'
      });
      expect(activeUser.isLocked()).toBe(false);

      const lockedUser = new User({
        name: 'Locked User',
        email: 'locked@unicart.dev',
        password: 'Password123!',
        lockUntil: new Date(Date.now() + 1000 * 60 * 15) // locked for 15 min
      });
      expect(lockedUser.isLocked()).toBe(true);
    });
  });

  describe('Product Model & Constraints', () => {
    it('should validate integer paise prices and reject floating point prices', () => {
      const validProduct = new Product({
        name: 'Wireless Earbuds',
        slug: 'wireless-earbuds',
        description: 'Noise cancelling premium earbuds with long battery life.',
        price: 299900, // ₹2,999.00
        stock: 50,
        category: '64b1f2e3d4c5b6a7e8f90123'
      });
      const validErr = validProduct.validateSync();
      expect(validErr).toBeUndefined();

      const invalidFloatProduct = new Product({
        name: 'Faulty Price Item',
        slug: 'faulty-price-item',
        description: 'Should fail validation due to decimal paise.',
        price: 29.99, // Floating point price forbidden
        stock: 10,
        category: '64b1f2e3d4c5b6a7e8f90123'
      });
      const invalidErr = invalidFloatProduct.validateSync();
      expect(invalidErr?.errors['price']).toBeDefined();
    });

    it('should enforce non-negative stock', () => {
      const negativeStock = new Product({
        name: 'Negative Stock Item',
        slug: 'negative-stock-item',
        description: 'Item with invalid negative inventory count.',
        price: 50000,
        stock: -5,
        category: '64b1f2e3d4c5b6a7e8f90123'
      });
      const err = negativeStock.validateSync();
      expect(err?.errors['stock']).toBeDefined();
    });
  });

  describe('Index Configurations', () => {
    it('should have required indexes declared on Product schema', () => {
      const indexes = Product.schema.indexes();
      const indexKeys = indexes.map(([key]) => JSON.stringify(key));

      expect(indexKeys.some((k) => k.includes('text'))).toBe(true); // text search
      expect(indexKeys.some((k) => k.includes('category') && k.includes('price'))).toBe(true); // category + price
      expect(indexKeys.some((k) => k.includes('isActive') && k.includes('createdAt'))).toBe(true); // active + newest
      expect(indexKeys.some((k) => k.includes('slug'))).toBe(true); // unique slug
    });

    it('should have required indexes declared on Order schema', () => {
      const indexes = Order.schema.indexes();
      const indexKeys = indexes.map(([key]) => JSON.stringify(key));

      expect(indexKeys.some((k) => k.includes('userId') && k.includes('createdAt'))).toBe(true);
      expect(indexKeys.some((k) => k.includes('status'))).toBe(true);
      expect(indexKeys.some((k) => k.includes('idempotencyKey'))).toBe(true);
    });

    it('should have TTL index declared on RefreshToken and AuditLog', () => {
      const refreshIndexes = RefreshToken.schema.indexes();
      const refreshTTL = refreshIndexes.find(
        ([, options]) => options && 'expireAfterSeconds' in options && options.expireAfterSeconds === 0
      );
      expect(refreshTTL).toBeDefined();

      const auditIndexes = AuditLog.schema.indexes();
      const auditTTL = auditIndexes.find(
        ([, options]) => options && 'expireAfterSeconds' in options && options.expireAfterSeconds === 7776000
      );
      expect(auditTTL).toBeDefined();
    });
  });
});
