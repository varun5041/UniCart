import { Router } from 'express';
import { UserController } from './user.controller.js';
import { updateUserProfileSchema } from './user.schema.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const userRouter = Router();

userRouter.get(
  '/me',
  authenticate,
  asyncHandler(UserController.getMe)
);

userRouter.patch(
  '/me',
  authenticate,
  validate(updateUserProfileSchema),
  asyncHandler(UserController.updateMe)
);

export default userRouter;
