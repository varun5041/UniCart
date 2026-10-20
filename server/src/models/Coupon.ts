import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string; // Uppercase, unique
  description?: string;
  discountPercent: number; // 1–90
  maxDiscount?: number | null; // Cap in integer paise (optional)
  minOrderValue: number; // Minimum cart subtotal in integer paise
  usageLimit?: number | null; // Total redemptions allowed (optional)
  usedCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 20
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
      validate: { validator: Number.isInteger, message: 'Discount must be an integer percentage' }
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ createdAt: -1 });

export const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
