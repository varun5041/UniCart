import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, googleAuthSchema, changePasswordSchema } from './auth.schema.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler((req, res) => authController.register(req, res))
);

authRouter.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler((req, res) => authController.login(req, res))
);

authRouter.post(
  '/google',
  authRateLimiter,
  validate({ body: googleAuthSchema }),
  asyncHandler((req, res) => authController.googleAuth(req, res))
);

authRouter.post(
  '/refresh',
  asyncHandler((req, res) => authController.refresh(req, res))
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler((req, res) => authController.logout(req, res))
);

authRouter.post(
  '/logout-all',
  authenticate,
  asyncHandler((req, res) => authController.logoutAll(req, res))
);

authRouter.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler((req, res) => authController.changePassword(req, res))
);

export default authRouter;
