import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  qty: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Quantity cannot exceed 10 per item'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer'
      }
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Cart: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);
