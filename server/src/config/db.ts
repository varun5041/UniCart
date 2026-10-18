import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB(uri?: string, poolSize?: number): Promise<typeof mongoose> {
  const targetUri = uri || env.MONGO_URI;
  const maxPoolSize = poolSize || env.MONGO_POOL_SIZE;

  try {
    const conn = await mongoose.connect(targetUri, {
      maxPoolSize,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    logger.info({
      msg: '[MongoDB] Connected successfully',
      host: conn.connection.host,
      name: conn.connection.name,
      poolSize: maxPoolSize
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ msg: '[MongoDB] Runtime connection error', err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[MongoDB] Connection lost / disconnected');
    });

    return conn;
  } catch (err) {
    logger.error({ msg: '[MongoDB] Initial connection failed', err });
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('[MongoDB] Disconnected cleanly');
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default { connectDB, disconnectDB, isDBConnected };
