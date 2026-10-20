import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  updateProfileSchema,
  replaceAddressesSchema,
  wishlistBodySchema,
  wishlistParamSchema
} from './user.schema.js';

export const userRouter = Router();

// Every /users/me route acts only on the authenticated caller (no user id accepted from the client)
userRouter.use(authenticate);

userRouter.get('/me', (req, res) => userController.getMe(req, res));

userRouter.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  asyncHandler((req, res) => userController.updateMe(req, res))
);

userRouter.put(
  '/me/addresses',
  validate({ body: replaceAddressesSchema }),
  asyncHandler((req, res) => userController.replaceAddresses(req, res))
);

userRouter.get(
  '/me/wishlist',
  asyncHandler((req, res) => userController.getWishlist(req, res))
);

userRouter.post(
  '/me/wishlist',
  validate({ body: wishlistBodySchema }),
  asyncHandler((req, res) => userController.addToWishlist(req, res))
);

userRouter.delete(
  '/me/wishlist/:productId',
  validate({ params: wishlistParamSchema }),
  asyncHandler((req, res) => userController.removeFromWishlist(req, res))
);

export default userRouter;
