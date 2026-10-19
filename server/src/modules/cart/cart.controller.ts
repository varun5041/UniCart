import { Request, Response } from 'express';
import { cartService } from './cart.service.js';

export class CartController {
  async getCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const cart = await cartService.getCart(userId);
    res.status(200).json({
      success: true,
      data: cart
    });
  }

  async addItem(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { productId, qty } = req.body;
    const cart = await cartService.addItem(userId, productId, qty);
    res.status(200).json({
      success: true,
      data: cart
    });
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { productId } = req.params;
    const { qty } = req.body;
    const cart = await cartService.updateItem(userId, productId, qty);
    res.status(200).json({
      success: true,
      data: cart
    });
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const { productId } = req.params;
    const cart = await cartService.removeItem(userId, productId);
    res.status(200).json({
      success: true,
      data: cart
    });
  }

  async clearCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!._id.toString();
    const result = await cartService.clearCart(userId);
    res.status(200).json({
      success: true,
      data: result
    });
  }
}

export const cartController = new CartController();
export default cartController;
