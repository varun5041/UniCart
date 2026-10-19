import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized('Authentication token required in Bearer format', 'TOKEN_MISSING')
    );
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select('+tokenVersion');

    if (!user) {
      return next(
        ApiError.unauthorized('User associated with token no longer exists', 'USER_NOT_FOUND')
      );
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(
        ApiError.unauthorized(
          'Session has been revoked or invalidated. Please log in again.',
          'SESSION_INVALIDATED'
        )
      );
    }

    if (user.isLocked()) {
      return next(
        ApiError.unauthorized(
          'Account is temporarily locked due to failed login attempts',
          'ACCOUNT_LOCKED'
        )
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid access token', 'TOKEN_INVALID'));
  }
}

export default authenticate;
