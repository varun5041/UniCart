import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

export interface TokenPayload {
  sub: string;
  role: 'customer' | 'admin';
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'customer' | 'admin';
        tokenVersion: number;
      };
    }
  }
}

/**
 * Authentication middleware: verifies short-lived JWT access token
 * and confirms that the session tokenVersion has not been invalidated.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authorization token provided', 'UNAUTHORIZED'));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(ApiError.unauthorized('Invalid authorization token format', 'UNAUTHORIZED'));
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid or tampered access token', 'INVALID_TOKEN'));
  }

  if (!payload.sub || typeof payload.tokenVersion !== 'number') {
    return next(ApiError.unauthorized('Malformed access token payload', 'MALFORMED_TOKEN'));
  }

  try {
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user) {
      return next(ApiError.unauthorized('User not found or deleted', 'USER_NOT_FOUND'));
    }

    // Token version check: handles immediate revocation across all devices (logout-all)
    if (user.tokenVersion !== payload.tokenVersion) {
      return next(
        ApiError.unauthorized(
          'Token has been invalidated. Please log in again.',
          'TOKEN_INVALIDATED'
        )
      );
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return next(
        ApiError.forbidden(
          'Account is temporarily locked. Please try again later.',
          'ACCOUNT_LOCKED'
        )
      );
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    };

    next();
  } catch (dbErr) {
    next(dbErr);
  }
}

export default authenticate;
