import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../config/logger.js';
import { Product, Category } from '../models/index.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { incrementCacheVersion } from '../utils/cache.js';

export async function purgeCatalogue(): Promise<void> {
  logger.info('[Purge] Starting complete catalogue purge...');
  try {
    await connectDB();
    await connectRedis().catch(() => {});

    const deletedProducts = await Product.deleteMany({});
    const deletedCategories = await Category.deleteMany({});

    await incrementCacheVersion('products');
    await incrementCacheVersion('categories');

    logger.info({
      msg: '[Purge] Catalogue purged successfully. 0 seeded products, 0 inbuilt categories.',
      productsRemoved: deletedProducts.deletedCount,
      categoriesRemoved: deletedCategories.deletedCount
    });
  } catch (err) {
    logger.error({ msg: '[Purge] Error purging catalogue', err });
    throw err;
  } finally {
    await disconnectDB();
    await disconnectRedis().catch(() => {});
  }
}

if (process.argv[1]?.includes('purgeCatalogue')) {
  purgeCatalogue()
    .then(() => {
      console.log('✅ Catalogue completely purged. Database is ready for admin additions.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to purge catalogue:', err);
      process.exit(1);
    });
}
