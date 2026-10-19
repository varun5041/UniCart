import { Router } from 'express';
import { orderController } from './order.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrderSchema,
  orderIdParamSchema,
  listOrdersQuerySchema,
  payOrderSchema
} from './order.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const orderRouter = Router();

// All order endpoints require user authentication
orderRouter.use(authenticate);

// POST /api/v1/orders — Idempotent transactional checkout
orderRouter.post(
  '/',
  validate({ body: createOrderSchema }),
  asyncHandler((req, res) => orderController.createOrder(req, res))
);

// GET /api/v1/orders — List customer orders
orderRouter.get(
  '/',
  validate({ query: listOrdersQuerySchema }),
  asyncHandler((req, res) => orderController.listUserOrders(req, res))
);

// GET /api/v1/orders/:id — View single order detail (ownership protected)
orderRouter.get(
  '/:id',
  validate({ params: orderIdParamSchema }),
  asyncHandler((req, res) => orderController.getUserOrderById(req, res))
);

// POST /api/v1/orders/:id/pay — Mock payment confirmation (idempotent)
orderRouter.post(
  '/:id/pay',
  validate({ params: orderIdParamSchema, body: payOrderSchema }),
  asyncHandler((req, res) => orderController.payOrder(req, res))
);

// POST /api/v1/orders/:id/cancel — Order cancellation with stock restoration
orderRouter.post(
  '/:id/cancel',
  validate({ params: orderIdParamSchema }),
  asyncHandler((req, res) => orderController.cancelOrder(req, res))
);

export default orderRouter;
