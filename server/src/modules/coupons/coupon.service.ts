import { ClientSession, Types } from 'mongoose';
import { Coupon, ICoupon } from '../../models/Coupon.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ApiError } from '../../utils/ApiError.js';
import { cartService } from '../cart/cart.service.js';
import {
  AdminCreateCouponInput,
  AdminUpdateCouponInput,
  AdminListCouponsQuery
} from './coupon.schema.js';

export interface CouponQuote {
  code: string;
  discountPercent: number;
  subtotal: number; // paise
  discount: number; // paise
  shipping: number; // paise
  total: number; // paise
}

/** Free shipping for orders >= ₹500 (50,000 paise) after discount, else ₹50 (5,000 paise). */
export function computeShipping(subtotalAfterDiscount: number): number {
  return subtotalAfterDiscount >= 50000 ? 0 : 5000;
}

export class CouponService {
  /**
   * Throws if the coupon cannot be applied to a cart with the given subtotal; returns the discount in paise.
   */
  computeDiscount(coupon: ICoupon | null, subtotal: number): number {
    if (!coupon || !coupon.isActive) {
      throw ApiError.badRequest('Invalid or inactive coupon code', 'INVALID_COUPON');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw ApiError.badRequest('This coupon has expired', 'COUPON_EXPIRED');
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw ApiError.badRequest('This coupon has reached its usage limit', 'COUPON_EXHAUSTED');
    }
    if (subtotal < coupon.minOrderValue) {
      const shortfall = Math.ceil((coupon.minOrderValue - subtotal) / 100);
      throw ApiError.badRequest(
        `Add items worth ₹${shortfall} more to use this coupon`,
        'COUPON_MIN_ORDER'
      );
    }

    let discount = Math.round((subtotal * coupon.discountPercent) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    return Math.min(discount, subtotal);
  }

  /**
   * Customer: quote a coupon against the authenticated user's current server-side cart.
   */
  async quoteForUser(userId: string, code: string): Promise<CouponQuote> {
    const cart = await cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty. Add items before applying a coupon.', 'EMPTY_CART');
    }

    const coupon = await Coupon.findOne({ code });
    const discount = this.computeDiscount(coupon, cart.subtotal);
    const afterDiscount = cart.subtotal - discount;
    const shipping = computeShipping(afterDiscount);

    return {
      code,
      discountPercent: coupon!.discountPercent,
      subtotal: cart.subtotal,
      discount,
      shipping,
      total: afterDiscount + shipping
    };
  }

  /**
   * Checkout: redeem a coupon inside the order transaction. The usage limit is re-checked in the
   * update filter so concurrent checkouts can never exceed it.
   */
  async redeem(code: string, subtotal: number, session: ClientSession): Promise<number> {
    const coupon = await Coupon.findOne({ code }).session(session);
    const discount = this.computeDiscount(coupon, subtotal);

    const updated = await Coupon.findOneAndUpdate(
      {
        _id: coupon!._id,
        isActive: true,
        $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }]
      },
      { $inc: { usedCount: 1 } },
      { session, new: true }
    );

    if (!updated) {
      throw ApiError.badRequest('This coupon has reached its usage limit', 'COUPON_EXHAUSTED');
    }
    return discount;
  }

  async list(query: AdminListCouponsQuery) {
    const skip = (query.page - 1) * query.limit;
    const [total, items] = await Promise.all([
      Coupon.countDocuments({}),
      Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean()
    ]);
    return {
      items,
      meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) || 1 }
    };
  }

  async create(input: AdminCreateCouponInput, actorId: string, ip?: string): Promise<ICoupon> {
    const existing = await Coupon.findOne({ code: input.code }).lean();
    if (existing) {
      throw ApiError.conflict(`Coupon '${input.code}' already exists`, 'COUPON_EXISTS');
    }
    const coupon = await Coupon.create(input);
    await this.audit('coupon.create', coupon, actorId, ip);
    return coupon;
  }

  async update(
    id: string,
    input: AdminUpdateCouponInput,
    actorId: string,
    ip?: string
  ): Promise<ICoupon> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
    }
    if (input.code && input.code !== coupon.code) {
      const clash = await Coupon.findOne({ code: input.code }).lean();
      if (clash) {
        throw ApiError.conflict(`Coupon '${input.code}' already exists`, 'COUPON_EXISTS');
      }
    }
    coupon.set(input);
    await coupon.save();
    await this.audit('coupon.update', coupon, actorId, ip);
    return coupon;
  }

  async remove(id: string, actorId: string, ip?: string): Promise<{ id: string }> {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
    }
    await this.audit('coupon.delete', coupon, actorId, ip);
    return { id };
  }

  private async audit(action: string, coupon: ICoupon, actorId: string, ip?: string): Promise<void> {
    await AuditLog.create({
      actorId: new Types.ObjectId(actorId),
      action,
      target: coupon.code,
      ip: ip || null,
      meta: { couponId: coupon._id.toString(), discountPercent: coupon.discountPercent }
    });
  }
}

export const couponService = new CouponService();
export default couponService;
