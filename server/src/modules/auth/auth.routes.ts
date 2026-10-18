import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(AuthController.register)
);

authRouter.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(AuthController.login)
);

authRouter.post(
  '/refresh',
  asyncHandler(AuthController.refresh)
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(AuthController.logout)
);

authRouter.post(
  '/logout-all',
  authenticate,
  asyncHandler(AuthController.logoutAll)
);

export default authRouter;
