import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number; // Selling price in integer paise (e.g. ₹99.00 = 9900 paise), derived from mrp + discountPercent
  mrp: number; // List price (MRP) in integer paise before discount
  discountPercent: number; // Admin-set discount, 0–90
  soldCount: number; // Units sold, incremented atomically at checkout
  stock: number;
  category: Types.ObjectId;
  categories?: Types.ObjectId[];
  images: string[];
  isActive: boolean; // false = unlisted (hidden from storefront)
  isDeleted: boolean; // true = removed by admin (hidden everywhere)
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer in paise'
      }
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'MRP must be an integer in paise'
      }
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [90, 'Discount cannot exceed 90%'],
      validate: {
        validator: Number.isInteger,
        message: 'Discount must be an integer percentage'
      }
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer'
      }
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    categories: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes mandated in docs/DATABASE.md
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ isActive: 1, discountPercent: -1 });
productSchema.index({ isActive: 1, soldCount: -1 });

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
