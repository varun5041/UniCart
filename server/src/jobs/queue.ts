import { Queue, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { WelcomeEmailData, OrderConfirmationData } from './email.job.js';

export const EMAIL_QUEUE_NAME = 'email_queue';

let emailQueueInstance: Queue | null = null;
let queueRedisConnection: Redis | null = null;

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};

export function getEmailQueue(): Queue {
  if (!emailQueueInstance) {
    queueRedisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: true
    });

    emailQueueInstance = new Queue(EMAIL_QUEUE_NAME, {
      // @ts-expect-error - ioredis connection instance accepted by BullMQ
      connection: queueRedisConnection,
      defaultJobOptions
    });

    emailQueueInstance.on('error', (err) => {
      logger.error({ msg: '[BullMQ] Email queue error', err: err.message });
    });
  }

  return emailQueueInstance;
}

export const emailQueue = getEmailQueue();

/**
 * Enqueues a welcome email job with exponential backoff retry.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    const queue = getEmailQueue();
    const job = await queue.add('welcome_email', data);
    logger.info({ msg: '[Queue] Welcome email job enqueued', jobId: job.id, to: data.email });
    return job;
  } catch (err) {
    logger.warn({ msg: '[Queue] Failed to enqueue welcome email job', err });
    return null;
  }
}

/**
 * Enqueues an order confirmation email job with exponential backoff retry.
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  try {
    const queue = getEmailQueue();
    const job = await queue.add('order_confirmation', data);
    logger.info({ msg: '[Queue] Order confirmation email job enqueued', jobId: job.id, orderId: data.orderId });
    return job;
  } catch (err) {
    logger.warn({ msg: '[Queue] Failed to enqueue order confirmation job', err });
    return null;
  }
}

export async function closeEmailQueue(): Promise<void> {
  if (emailQueueInstance) {
    await emailQueueInstance.close();
    emailQueueInstance = null;
  }
  if (queueRedisConnection) {
    await queueRedisConnection.quit().catch(() => queueRedisConnection?.disconnect());
    queueRedisConnection = null;
  }
}

export default {
  emailQueue,
  getEmailQueue,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  closeEmailQueue
};
