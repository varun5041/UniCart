import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IAddress } from './User.js';

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number; // Snapshot in integer paise at purchase time
  qty: number;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number; // Server-computed integer paise
  discount: number; // Server-computed coupon discount in integer paise
  couponCode?: string | null;
  shipping: number; // Server-computed integer paise
  total: number;    // Server-computed integer paise
  shippingAddress: IAddress;
  status: OrderStatus;
  paymentRef?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Order item price snapshot must be an integer in paise'
      }
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Order item quantity must be an integer'
      }
    }
  },
  { _id: false }
);

const orderAddressSchema = new Schema<IAddress>(
  {
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India', trim: true }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'Order must contain at least one item'
      ]
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Subtotal must be an integer in paise'
      }
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    couponCode: {
      type: String,
      default: null,
      trim: true
    },
    shipping: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Shipping must be an integer in paise'
      }
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Total must be an integer in paise'
      }
    },
    shippingAddress: {
      type: orderAddressSchema,
      required: true
    },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending_payment'
    },
    paymentRef: {
      type: String,
      default: null,
      trim: true
    },
    idempotencyKey: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound and performance indexes per docs/DATABASE.md
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
