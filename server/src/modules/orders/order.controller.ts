import { Request, Response } from 'express';
import { orderService } from './order.service.js';
import { ListOrdersQuery } from './order.schema.js';

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const { shippingAddress } = req.body;

    const order = await orderService.createOrder(userId, idempotencyKey, shippingAddress);

    res.status(201).json({
      success: true,
      data: order
    });
  }

  async payOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { id } = req.params;
    const paymentRef = req.body?.paymentRef;

    const order = await orderService.payOrder(userId, id, paymentRef);

    res.status(200).json({
      success: true,
      data: order
    });
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    const order = await orderService.cancelOrder(userId, id);

    res.status(200).json({
      success: true,
      data: order
    });
  }

  async listUserOrders(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const result = await orderService.listUserOrders(
      userId,
      req.query as unknown as ListOrdersQuery
    );

    res.status(200).json({
      success: true,
      data: result.items,
      meta: result.meta
    });
  }

  async getUserOrderById(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    const order = await orderService.getUserOrderById(userId, id);

    res.status(200).json({
      success: true,
      data: order
    });
  }
}

export const orderController = new OrderController();
export default orderController;
