import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';

export type UserRole = 'customer' | 'admin';

/**
 * RBAC authorization middleware: ensures authenticated user has one of the required roles.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('Forbidden: insufficient role permissions', 'FORBIDDEN')
      );
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const authorize = requireRole;

export default requireRole;
