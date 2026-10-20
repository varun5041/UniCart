import { Request, Response } from 'express';
import { userService, toPublicUser } from './user.service.js';

export class UserController {
  getMe(req: Request, res: Response): void {
    res.status(200).json({ success: true, data: { user: toPublicUser(req.user!) } });
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    const user = await userService.updateProfile(req.user!._id.toString(), req.body.name);
    res.status(200).json({ success: true, data: { user } });
  }

  async replaceAddresses(req: Request, res: Response): Promise<void> {
    const user = await userService.replaceAddresses(req.user!._id.toString(), req.body.addresses);
    res.status(200).json({ success: true, data: { user } });
  }

  async getWishlist(req: Request, res: Response): Promise<void> {
    const items = await userService.getWishlist(req.user!._id.toString());
    res.status(200).json({ success: true, data: items });
  }

  async addToWishlist(req: Request, res: Response): Promise<void> {
    const ids = await userService.addToWishlist(req.user!._id.toString(), req.body.productId);
    res.status(200).json({ success: true, data: { wishlist: ids } });
  }

  async removeFromWishlist(req: Request, res: Response): Promise<void> {
    const ids = await userService.removeFromWishlist(req.user!._id.toString(), req.params.productId);
    res.status(200).json({ success: true, data: { wishlist: ids } });
  }
}

export const userController = new UserController();
export default userController;
