import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  EMAIL_QUEUE_NAME,
  defaultJobOptions
} from './queue.js';
import {
  sendWelcomeEmailMessage,
  sendOrderConfirmationMessage,
  WelcomeEmailData,
  OrderConfirmationData
} from './email.job.js';

let emailWorkerInstance: Worker | null = null;
let workerRedisConnection: Redis | null = null;

/**
 * Creates and initializes the BullMQ background email worker.
 */
export function createEmailWorker(): Worker {
  if (emailWorkerInstance) {
    return emailWorkerInstance;
  }

  workerRedisConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: true
  });

  emailWorkerInstance = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      logger.info({
        msg: `[Worker] Processing job ${job.name}`,
        jobId: job.id,
        attempt: job.attemptsMade + 1
      });

      switch (job.name) {
        case 'welcome_email':
          return await sendWelcomeEmailMessage(job.data as WelcomeEmailData);

        case 'order_confirmation':
          return await sendOrderConfirmationMessage(job.data as OrderConfirmationData);

        default:
          logger.warn({ msg: `[Worker] Unknown job name received: ${job.name}`, jobId: job.id });
          return null;
      }
    },
    {
      // @ts-expect-error - ioredis instance accepted by BullMQ
      connection: workerRedisConnection,
      concurrency: 5
    }
  );

  emailWorkerInstance.on('completed', (job: Job) => {
    logger.info({
      msg: `[Worker] Job completed successfully: ${job.name}`,
      jobId: job.id
    });
  });

  emailWorkerInstance.on('failed', (job: Job | undefined, err: Error) => {
    const attemptsMade = job?.attemptsMade ?? 0;
    const maxAttempts = defaultJobOptions.attempts ?? 3;
    const isFinalFailure = attemptsMade >= maxAttempts;

    logger.error({
      msg: `[Worker] Job failed: ${job?.name || 'unknown'}`,
      jobId: job?.id,
      attemptsMade,
      isFinalFailure,
      err: err.message
    });
  });

  emailWorkerInstance.on('error', (err: Error) => {
    logger.error({ msg: '[Worker] Email worker internal error', err: err.message });
  });

  return emailWorkerInstance;
}

export async function stopEmailWorker(): Promise<void> {
  if (emailWorkerInstance) {
    logger.info('[Worker] Closing email worker gracefully...');
    await emailWorkerInstance.close();
    emailWorkerInstance = null;
  }
  if (workerRedisConnection) {
    await workerRedisConnection.quit().catch(() => workerRedisConnection?.disconnect());
    workerRedisConnection = null;
  }
  logger.info('[Worker] Email worker closed.');
}

export const emailWorker = createEmailWorker;

export default {
  createEmailWorker,
  stopEmailWorker
};
