import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = env.NODE_ENV === 'development';

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    const firstIssue = err.errors[0];
    message = firstIssue?.message || 'Request validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  } else if ('code' in err && (err as { code: unknown }).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    message = 'Resource already exists with unique field';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'Invalid resource identifier format';
  } else if ('type' in err && (err as { type: unknown }).type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request entity exceeded maximum permitted size limit';
  } else if ('status' in err && typeof (err as { status: unknown }).status === 'number') {
    statusCode = (err as { status: number }).status;
    code = statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : 'HTTP_ERROR';
    message = err.message;
  } else {
    // Unknown or internal server error
    if (isDev) {
      message = err.message || message;
    }
  }

  // Structured logging with requestId
  logger.error({
    err,
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    code,
    message
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(isDev && statusCode === 500 ? { stack: err.stack } : {})
    }
  });
}

export default errorHandler;
