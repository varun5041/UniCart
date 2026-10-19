import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { logger } from '../config/logger.js';

const DEFAULT_TTL_SECONDS = 120; // 2 minutes default TTL for catalog cache

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;

  try {
    const raw = await getRedisClient().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ key, err: (err as Error).message }, '[Cache] Failed to get key');
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  if (!isRedisConnected()) return;

  try {
    const serialized = JSON.stringify(value);
    await getRedisClient().set(key, serialized, 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ key, err: (err as Error).message }, '[Cache] Failed to set key');
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!isRedisConnected()) return;

  try {
    await getRedisClient().del(key);
  } catch (err) {
    logger.warn({ key, err: (err as Error).message }, '[Cache] Failed to delete key');
  }
}

/**
 * Gets the current version of a cache scope (e.g., 'products')
 */
export async function getCacheVersion(scope: string): Promise<number> {
  if (!isRedisConnected()) return 1;

  try {
    const v = await getRedisClient().get(`unicart:version:${scope}`);
    return v ? parseInt(v, 10) : 1;
  } catch {
    return 1;
  }
}

/**
 * Atomically increments the cache scope version.
 * Instant O(1) invalidation for all cached queries in that scope across all replicas.
 */
export async function incrementCacheVersion(scope: string): Promise<number> {
  if (!isRedisConnected()) return 1;

  try {
    const newVersion = await getRedisClient().incr(`unicart:version:${scope}`);
    logger.info({ scope, newVersion }, '[Cache] Invalidation performed (scope version bumped)');
    return newVersion;
  } catch (err) {
    logger.warn({ scope, err: (err as Error).message }, '[Cache] Failed to increment scope version');
    return 1;
  }
}

/**
 * Executes cache-aside pattern with versioning and hit/miss logging
 */
export async function cacheAside<T>(
  scope: string,
  identifier: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; isHit: boolean }> {
  const version = await getCacheVersion(scope);
  const cacheKey = `unicart:cache:${scope}:v${version}:${identifier}`;

  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    logger.info({ key: cacheKey, hit: true }, '[Cache Hit]');
    return { data: cached, isHit: true };
  }

  logger.info({ key: cacheKey, hit: false }, '[Cache Miss]');
  const data = await fetcher();

  // Asynchronously populate cache
  await setCache(cacheKey, data, ttlSeconds);

  return { data, isHit: false };
}

export default {
  getCache,
  setCache,
  deleteCache,
  getCacheVersion,
  incrementCacheVersion,
  cacheAside
};
