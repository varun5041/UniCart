import { Router } from 'express';
import { couponController } from './coupon.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateCouponSchema } from './coupon.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const couponRouter = Router();

// POST /api/v1/coupons/validate — quote a coupon against the caller's server-side cart
couponRouter.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  asyncHandler((req, res) => couponController.validate(req, res))
);

export default couponRouter;
