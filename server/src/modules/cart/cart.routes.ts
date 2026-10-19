import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  cartProductIdParamSchema
} from './cart.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const cartRouter = Router();

// All cart routes require active authentication
cartRouter.use(authenticate);

// GET /api/v1/cart
cartRouter.get(
  '/',
  asyncHandler((req, res) => cartController.getCart(req, res))
);

// POST /api/v1/cart/items
cartRouter.post(
  '/items',
  validate({ body: addToCartSchema }),
  asyncHandler((req, res) => cartController.addItem(req, res))
);

// PATCH /api/v1/cart/items/:productId
cartRouter.patch(
  '/items/:productId',
  validate({ params: cartProductIdParamSchema, body: updateCartItemSchema }),
  asyncHandler((req, res) => cartController.updateItem(req, res))
);

// DELETE /api/v1/cart/items/:productId
cartRouter.delete(
  '/items/:productId',
  validate({ params: cartProductIdParamSchema }),
  asyncHandler((req, res) => cartController.removeItem(req, res))
);

// DELETE /api/v1/cart
cartRouter.delete(
  '/',
  asyncHandler((req, res) => cartController.clearCart(req, res))
);

export default cartRouter;
