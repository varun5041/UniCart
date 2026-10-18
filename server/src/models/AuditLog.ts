import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId | null;
  action: string;
  target?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    target: {
      type: String,
      default: null
    },
    ip: {
      type: String,
      default: null
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// TTL index per docs/DATABASE.md: 90 days retention (90 * 24 * 60 * 60 = 7,776,000 seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
