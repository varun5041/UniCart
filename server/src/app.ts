import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(',') : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Root / Hello endpoints
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'UniCart API server running',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health'
    }
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'unicart-api',
    uptime: process.uptime()
  });
});

// Central 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
});

// Central error handler (never leaks stack traces in production)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred'
    }
  });
});

export default app;
