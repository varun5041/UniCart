import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Create a dedicated Prometheus Registry
export const register = new client.Registry();

// Enable standard default Node.js and system metrics
client.collectDefaultMetrics({
  register,
  prefix: 'unicart_'
});

// 1. Latency Histogram (seconds)
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'unicart_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// 2. HTTP Request Counter
export const httpRequestsTotal = new client.Counter({
  name: 'unicart_http_requests_total',
  help: 'Total number of HTTP requests processed by UniCart API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 3. Active in-flight HTTP connections Gauge
export const httpActiveConnections = new client.Gauge({
  name: 'unicart_http_active_connections',
  help: 'Number of currently active in-flight HTTP connections',
  registers: [register]
});

/**
 * Middleware measuring request duration and counting requests by route, method and status code.
 * Routes are normalized using route pattern to prevent high cardinality label explosion.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Do not record internal health and scraper endpoints to prevent skew
  if (req.path === '/metrics' || req.path === '/health/live' || req.path === '/health/ready') {
    next();
    return;
  }

  httpActiveConnections.inc();
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    httpActiveConnections.dec();
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9;

    // Normalize route to avoid high cardinality with IDs
    const matchedRoute = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : req.baseUrl || req.path;

    const labels = {
      method: req.method,
      route: matchedRoute,
      status_code: res.statusCode.toString()
    };

    httpRequestDurationSeconds.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}

/**
 * Handler for GET /metrics endpoint
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.status(200).send(metrics);
}
