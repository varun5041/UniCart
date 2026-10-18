import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  tokenHash: string;
  userId: Types.ObjectId;
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedBy?: string | null;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    familyId: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedBy: {
      type: String,
      default: null
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// TTL Index per docs/DATABASE.md: automatically deletes document when expiresAt passes
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models.RefreshToken ||
  mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;
