import { env, validateEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

// 1. Strict Env Validation at Boot
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnv();
  } catch {
    logger.fatal('[Boot] Terminating process due to invalid environment variables');
    process.exit(1);
  }
}

export function createShutdownHandler(server: { close: (cb: (err?: Error) => void) => void }) {
  let isShuttingDown = false;

  return async (signal: string, shouldExit = true): Promise<boolean> => {
    if (isShuttingDown) return false;
    isShuttingDown = true;

    logger.info({ msg: `[Shutdown] Received ${signal}. Starting graceful termination...` });

    const forceExitTimer = setTimeout(() => {
      logger.error('[Shutdown] Forced termination after timeout limit (10s)');
      if (shouldExit) process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    try {
      // Close HTTP connections
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('[Shutdown] HTTP connections closed.');

      // Disconnect DB and Redis
      await disconnectDB();
      await disconnectRedis();

      clearTimeout(forceExitTimer);
      logger.info('[Shutdown] Cleanup complete. Exiting process.');

      if (shouldExit) {
        process.exit(0);
      }
      return true;
    } catch (err) {
      logger.error({ msg: '[Shutdown] Error during graceful shutdown cleanup', err });
      if (shouldExit) {
        process.exit(1);
      }
      return false;
    }
  };
}

// 2. Connect external dependencies and listen
async function startServer() {
  try {
    await connectDB().catch((err) => {
      logger.warn({ msg: '[Boot] MongoDB not yet reachable (readiness will report degraded)', err: err.message });
    });

    await connectRedis().catch((err) => {
      logger.warn({ msg: '[Boot] Redis not yet reachable (readiness will report degraded)', err: err.message });
    });

    const server = app.listen(env.PORT, () => {
      logger.info({
        msg: `[UniCart] Server listening on port ${env.PORT}`,
        port: env.PORT,
        env: env.NODE_ENV,
        url: `http://localhost:${env.PORT}`
      });
    });

    const shutdown = createShutdownHandler(server);

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM', true);
    });
    process.on('SIGINT', () => {
      void shutdown('SIGINT', true);
    });

    return { server, shutdown };
  } catch (err) {
    logger.fatal({ msg: '[Boot] Fatal error starting UniCart server', err });
    process.exit(1);
  }
}

import cluster from 'node:cluster';
import os from 'node:os';

// Start if executed directly
if (process.env.NODE_ENV !== 'test') {
  if (process.env.ENABLE_CLUSTER === 'true' && cluster.isPrimary) {
    const numCPUs = Math.min(os.availableParallelism ? os.availableParallelism() : os.cpus().length, 4);
    logger.info(`[Cluster] Primary master ${process.pid} running. Forking ${numCPUs} worker processes...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`[Cluster] Worker ${worker.process.pid} died (${signal || code}). Spawning replacement...`);
      cluster.fork();
    });
  } else {
    void startServer();
  }
}

export { startServer };
