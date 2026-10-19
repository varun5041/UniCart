import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';

import os from 'node:os';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/error.js';
import { isDBConnected } from './config/db.js';
import { isRedisConnected } from './config/redis.js';
import { ApiError } from './utils/ApiError.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { authenticate } from './middleware/auth.js';
import { authorize } from './middleware/rbac.js';

export const app = express();

// 1. Request ID injection & Instance Hostname Tracking
app.use(requestId);
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Served-By', os.hostname());
  next();
});

// 2. Structured request logging via pino-http
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id || 'unknown',
    autoLogging: env.NODE_ENV !== 'test',
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    }
  })
);

// 3. Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'https://res.cloudinary.com', 'https://images.unsplash.com', 'data:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 4. CORS with configured origins allow-list
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key']
  })
);

// 5. Response compression
app.use(compression());

// 6. Request body parsing with strict 10kb limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 7. Cookie parsing
app.use(cookieParser());

// 8. Sanitization & parameter pollution mitigation
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());

// 9. Global rate limiting per IP
app.use(globalRateLimiter);

// Health & Liveness / Readiness Probes
// Liveness probe: returns 200 if server process is alive
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'unicart-api',
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

// Readiness probe: verifies both DB and Redis are reachable
app.get('/health/ready', (_req: Request, res: Response) => {
  const dbReady = isDBConnected();
  const redisReady = isRedisConnected();

  if (dbReady && redisReady) {
    res.status(200).json({
      status: 'ready',
      hostname: os.hostname(),
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: 'connected',
        redis: 'connected'
      }
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      hostname: os.hostname(),
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: dbReady ? 'connected' : 'disconnected',
        redis: redisReady ? 'connected' : 'disconnected'
      }
    });
  }
});

// Baseline Root info endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'UniCart API operational',
    version: '1.0.0',
    hostname: os.hostname(),
    environment: env.NODE_ENV,
    endpoints: {
      liveness: '/health/live',
      readiness: '/health/ready'
    }
  });
});

// Test endpoints (available in test and development environments)
if (env.NODE_ENV !== 'production') {
  app.get('/test/error', () => {
    throw ApiError.forbidden('You lack permissions to access this item', 'FORBIDDEN_TEST');
  });
  app.post('/test/body', (req: Request, res: Response) => {
    res.status(200).json({ success: true, body: req.body });
  });
}

// 10. API v1 Routes
app.use('/api/v1/auth', authRouter);

app.get('/api/v1/users/me', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        addresses: req.user!.addresses
      }
    }
  });
});

app.get('/api/v1/admin/test', authenticate, authorize('admin'), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    adminId: req.user!._id
  });
});

// 404 Route Catch-all
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
