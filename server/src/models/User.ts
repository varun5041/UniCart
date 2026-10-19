import mongoose, { Document, Model, Schema } from 'mongoose';
import argon2 from 'argon2';

export interface IAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  tokenVersion: number;
  failedLogins: number;
  lockUntil?: Date | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India', trim: true }
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
      required: function (this: any) {
        return !this.googleId;
      },
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    avatar: {
      type: String
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
        (val: IAddress[]) => val.length <= 5,
        'Cannot exceed maximum of 5 addresses'
      ]
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1
    });
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare plain candidate password with stored argon2 hash
userSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return argon2.verify(this.password, candidatePassword);
};

// Check if account is currently locked due to failed logins
userSchema.methods.isLocked = function (): boolean {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
