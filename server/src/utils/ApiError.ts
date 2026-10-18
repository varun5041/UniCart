export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, code, message, true, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, code, message, true);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, code, message, true);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, code, message, true);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT'): ApiError {
    return new ApiError(409, code, message, true);
  }

  static unprocessable(
    message = 'Validation failed',
    code = 'VALIDATION_ERROR',
    details?: unknown
  ): ApiError {
    return new ApiError(422, code, message, true, details);
  }

  static tooManyRequests(
    message = 'Rate limit exceeded. Please try again later.',
    code = 'RATE_LIMIT_EXCEEDED'
  ): ApiError {
    return new ApiError(429, code, message, true);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR'): ApiError {
    return new ApiError(500, code, message, false);
  }
}

export default ApiError;
