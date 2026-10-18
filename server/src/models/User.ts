import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  tokenVersion: number;
  failedLogins: number;
  lockUntil: Date | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'IN' }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    failedLogins: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      default: null
    },
    addresses: {
      type: [addressSchema],
      default: [],
      validate: [
        (val: unknown[]) => val.length <= 5,
        'Cannot store more than 5 addresses'
      ]
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.failedLogins;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.failedLogins;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
