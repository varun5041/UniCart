import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
      enableOfflineQueue: false
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('[Redis] Connection established');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('[Redis] Client ready to receive commands');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.error({ msg: '[Redis] Client error', err: err.message });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('[Redis] Connection closed');
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();
  if (client.status === 'wait' || client.status === 'close') {
    await client.connect();
  }
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      isConnected = false;
      redisClient = null;
      logger.info('[Redis] Disconnected cleanly');
    }
  }
}

export function isRedisConnected(): boolean {
  return isConnected || (redisClient !== null && redisClient.status === 'ready');
}

// Allows setting a custom/mock client for unit tests
export function setRedisClientForTest(mockClient: Redis | null): void {
  redisClient = mockClient;
  isConnected = mockClient !== null && mockClient.status === 'ready';
}

export default { getRedisClient, connectRedis, disconnectRedis, isRedisConnected, setRedisClientForTest };
