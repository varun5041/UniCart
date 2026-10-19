import os from 'node:os';
import { Worker, Job } from 'bullmq';
import { env, validateEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { getBullMQConnection, closeQueues } from './jobs/queue.js';
import { sendOrderConfirmationEmail, OrderEmailPayload } from './jobs/email.job.js';

let emailWorker: Worker | null = null;

// 1. Validate environment
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnv();
  } catch {
    logger.fatal('[Worker] Terminating due to invalid environment configuration');
    process.exit(1);
  }
}

export function createEmailWorker(): Worker {
  if (!emailWorker) {
    emailWorker = new Worker(
      'email_queue',
      async (job: Job<OrderEmailPayload>) => {
        logger.info({ jobId: job.id, name: job.name }, '[Worker] Processing queue job');
        if (job.name === 'order_confirmation') {
          await sendOrderConfirmationEmail(job.data);
        }
      },
      {
        connection: getBullMQConnection(),
        concurrency: 5
      }
    );

    emailWorker.on('completed', (job: Job) => {
      logger.info({ jobId: job.id }, '[Worker] Job completed successfully');
    });

    emailWorker.on('failed', (job: Job | undefined, err: Error) => {
      logger.error({ jobId: job?.id, err: err.message }, '[Worker] Job failed');
    });
  }

  return emailWorker;
}

export async function stopWorker(): Promise<void> {
  if (emailWorker) {
    try {
      await emailWorker.close();
    } catch {
      // ignore
    }
    emailWorker = null;
  }
  await closeQueues();
}

export async function startWorker(): Promise<void> {
  logger.info({
    msg: '[Worker] Initializing UniCart background job consumer...',
    hostname: os.hostname(),
    env: env.NODE_ENV
  });

  try {
    // Connect database & Redis queue backing
    await connectDB();
    await connectRedis();

    // Start BullMQ consumers
    createEmailWorker();

    logger.info({
      msg: '[Worker] Background worker listening for jobs',
      queues: ['email_queue'],
      hostname: os.hostname()
    });

    const shutdown = async (signal: string) => {
      logger.info({ msg: `[Worker] Received ${signal}. Draining queue jobs and stopping...` });
      await stopWorker();
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
