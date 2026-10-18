import os from 'node:os';
import { env, validateEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

// 1. Validate environment
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnv();
  } catch {
    logger.fatal('[Worker] Terminating due to invalid environment configuration');
    process.exit(1);
  }
}

export async function startWorker() {
  logger.info({
    msg: '[Worker] Initializing UniCart background job consumer...',
    hostname: os.hostname(),
    env: env.NODE_ENV
  });

  try {
    // Connect database & Redis queue backing
    await connectDB();
    await connectRedis();

    logger.info({
      msg: '[Worker] Background worker listening for jobs',
      queues: ['email_queue', 'order_status_queue'],
      hostname: os.hostname()
    });

    const shutdown = async (signal: string) => {
      logger.info({ msg: `[Worker] Received ${signal}. Draining queue jobs and stopping...` });
      await disconnectRedis();
      await disconnectDB();
      logger.info('[Worker] Shutdown complete.');
      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ msg: '[Worker] Failed to start background worker', err });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  void startWorker();
}

export default startWorker;
