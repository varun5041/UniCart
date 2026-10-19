import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let queueConnection: Redis | null = null;
let emailQueue: Queue | null = null;

export function getBullMQConnection(): Redis {
  if (!queueConnection) {
    queueConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true
    });
  }
  return queueConnection;
}

export function getEmailQueue(): Queue {
  if (!emailQueue) {
    emailQueue = new Queue('email_queue', {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    emailQueue.on('error', (err) => {
      logger.warn({ msg: '[Queue] email_queue error', err: err.message });
    });
  }
  return emailQueue;
}

export async function closeQueues(): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.close();
    } catch {
      // ignore
    }
    emailQueue = null;
  }
  if (queueConnection) {
    try {
      await queueConnection.quit();
    } catch {
      queueConnection.disconnect();
    }
    queueConnection = null;
  }
}

export default { getEmailQueue, closeQueues, getBullMQConnection };
