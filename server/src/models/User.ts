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
  verifyPassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
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
        (val: IAddress[]) => val.length <= 5,
        'Cannot exceed maximum of 5 addresses'
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

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  // If already hashed (e.g. starts with $argon2 or $2), do not re-hash
  if (this.password.startsWith('$argon2') || this.password.startsWith('$2')) {
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

// Compare plain candidate password with stored hash
userSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  try {
    if (this.password.startsWith('$argon2')) {
      return await argon2.verify(this.password, candidatePassword);
    }
    return false;
  } catch {
    return false;
  }
};

// Check if account is currently locked due to failed logins
userSchema.methods.isLocked = function (): boolean {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
