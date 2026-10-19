import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export type UserRole = 'customer' | 'admin';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        ApiError.unauthorized('Authentication is required to access this resource', 'UNAUTHENTICATED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

export default authorize;
