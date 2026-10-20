import { Request, Response } from 'express';
import { couponService } from './coupon.service.js';
import { AdminListCouponsQuery } from './coupon.schema.js';

export class CouponController {
  async validate(req: Request, res: Response): Promise<void> {
    const quote = await couponService.quoteForUser(req.user!._id.toString(), req.body.code);
    res.status(200).json({ success: true, data: quote });
  }

  async list(req: Request, res: Response): Promise<void> {
    const result = await couponService.list(req.query as unknown as AdminListCouponsQuery);
    res.status(200).json({ success: true, data: result.items, meta: result.meta });
  }

  async create(req: Request, res: Response): Promise<void> {
    const coupon = await couponService.create(req.body, req.user!._id.toString(), req.ip);
    res.status(201).json({ success: true, data: coupon });
  }

  async update(req: Request, res: Response): Promise<void> {
    const coupon = await couponService.update(
      req.params.id,
      req.body,
      req.user!._id.toString(),
      req.ip
    );
    res.status(200).json({ success: true, data: coupon });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await couponService.remove(req.params.id, req.user!._id.toString(), req.ip);
    res.status(200).json({ success: true, data: result });
  }
}

export const couponController = new CouponController();
export default couponController;
