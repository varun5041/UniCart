import { faker } from '@faker-js/faker';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  User,
  Category,
  Product,
  Cart,
  Order,
  RefreshToken,
  AuditLog,
  Coupon
} from '../models/index.js';
import { computeSalePrice } from '../utils/pricing.js';

const CATEGORIES_DATA = [
  {
    name: 'Electronics & Gadgets',
    slug: 'electronics-gadgets',
    description: 'High performance smartphones, laptops, audio gear, and smart home devices.'
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    description: 'Curated modern streetwear, formal clothing, and luxury footwear.'
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Premium cookware, ergonomic furniture, and modern interior aesthetics.'
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Best-selling literature, tech manuals, art supplies, and notebooks.'
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Workout accessories, gym machinery, athletic apparel, and camping gear.'
  }
];

const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
];

export async function seedDatabase(): Promise<void> {
  logger.info('[Seed] Initiating UniCart database seed...');

  try {
    await connectDB();

    // 1. Ensure all collection indexes are synchronized with MongoDB
    logger.info('[Seed] Synchronizing and building indexes...');
    try {
      await Order.collection.dropIndexes();
    } catch {
      // Collection might not exist yet; safe to ignore
    }

    await Promise.all([
      User.syncIndexes(),
      Category.syncIndexes(),
      Product.syncIndexes(),
      Cart.syncIndexes(),
      Order.syncIndexes(),
      RefreshToken.syncIndexes(),
      AuditLog.syncIndexes(),
      Coupon.syncIndexes()
    ]);
    logger.info('[Seed] Indexes successfully verified on MongoDB.');

    // 2. Seed Admin User
    const adminEmail = env.ADMIN_EMAIL || 'admin@unicart.dev';
    const adminPassword = env.ADMIN_PASSWORD || 'ChangeMe123!';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'UniCart Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        addresses: [
          {
            line1: '100 Innovation Blvd, Tech Hub',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India'
          }
        ]
      });
      await admin.save();
      logger.info({ msg: '[Seed] Created Admin User', email: adminEmail });
    } else {
      logger.info({ msg: '[Seed] Admin user already exists', email: adminEmail });
    }

    // 3. Seed Standard Categories
    const categoriesMap: Record<string, string> = {};
    for (const catData of CATEGORIES_DATA) {
      const category = await Category.findOneAndUpdate(
        { slug: catData.slug },
        { $set: catData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoriesMap[catData.slug] = category._id.toString();
    }
    logger.info({ msg: '[Seed] Seeded 5 core categories', count: Object.keys(categoriesMap).length });

    // 4. Seed 200 Products
    const categoryIds = Object.values(categoriesMap);
    const existingProductsCount = await Product.countDocuments();

    if (existingProductsCount >= 200) {
      logger.info({
        msg: '[Seed] Catalogue already contains 200+ products. Skipping duplicate generation.',
        count: existingProductsCount
      });
    } else {
      logger.info('[Seed] Generating 200 products with realistic pricing and inventory...');
      const productsToCreate = [];

      for (let i = 1; i <= 200; i++) {
        const title = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.productName()} ${i}`;
        const slug = faker.helpers.slugify(title).toLowerCase() + `-${i}`;
        const rupeePrice = faker.number.int({ min: 199, max: 24999 }); // ₹199 to ₹24,999
        const mrpPaise = rupeePrice * 100; // Converted to paise
        // ~60% of the catalogue carries a 5–70% discount so the Deals page has content
        const discountPercent = i % 5 < 3 ? faker.number.int({ min: 1, max: 14 }) * 5 : 0;

        const categoryId = categoryIds[i % categoryIds.length];
        const selectedImages = [
          CURATED_IMAGES[i % CURATED_IMAGES.length],
          CURATED_IMAGES[(i + 1) % CURATED_IMAGES.length]
        ];

        productsToCreate.push({
          name: title,
          slug,
          description: faker.commerce.productDescription() + ' Guaranteed authentic with manufacturer warranty.',
          mrp: mrpPaise,
          discountPercent,
          price: computeSalePrice(mrpPaise, discountPercent),
          soldCount: faker.number.int({ min: 0, max: 2500 }),
          stock: faker.number.int({ min: 10, max: 350 }),
          category: categoryId,
          images: selectedImages,
          isActive: true
        });
      }

      await Product.deleteMany({}); // Reset product catalog for clean seed
      await Product.insertMany(productsToCreate);
      logger.info({ msg: '[Seed] Successfully seeded 200 products into catalog', count: 200 });
    }

    // 5. Backfill pricing fields on catalogues seeded before discounts existed
    const backfill = await Product.updateMany({ mrp: { $exists: false } }, [
      { $set: { mrp: '$price', discountPercent: 0, soldCount: 0, isDeleted: false } }
    ]);
    if (backfill.modifiedCount > 0) {
      logger.info({ msg: '[Seed] Backfilled MRP on existing products', count: backfill.modifiedCount });
    }

    logger.info('[Seed] Database seeding completed successfully! ✨');
  } catch (err) {
    logger.error({ msg: '[Seed] Error during seeding execution', err });
    throw err;
  } finally {
    await disconnectDB();
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
