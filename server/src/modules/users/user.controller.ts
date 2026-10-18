import { Request, Response } from 'express';
import { UserService } from './user.service.js';

export class UserController {
  static async getMe(req: Request, res: Response) {
    const user = await UserService.getProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: user
    });
  }

  static async updateMe(req: Request, res: Response) {
    const user = await UserService.updateProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      data: user
    });
  }
}

export default UserController;
