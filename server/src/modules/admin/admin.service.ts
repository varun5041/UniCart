import mongoose, { Types } from 'mongoose';
import { Order, IOrder } from '../../models/Order.js';
import { Product } from '../../models/Product.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ApiError } from '../../utils/ApiError.js';
import { incrementCacheVersion } from '../../utils/cache.js';
import {
  AdminListOrdersQuery,
  AdminListAuditLogsQuery
} from './admin.schema.js';

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

export class AdminService {
  /**
   * Retrieves a paginated list of all system orders with optional status filter
   */
  async listOrders(query: AdminListOrdersQuery): Promise<PaginatedResult<unknown>> {
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;
    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('userId', 'name email')
      .lean();

    const pages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages
      }
    };
  }

  /**
   * Validates and updates order status per state machine rules.
   * If cancelled, restores stock in an atomic transaction and clears product cache.
   * Emits audit log entry.
   */
  async updateOrderStatus(
    orderId: string,
    targetStatus: string,
    actorId: string,
    ip?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw ApiError.unprocessable(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: [${allowedTransitions.join(', ')}]`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    if (targetStatus === 'cancelled') {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // Restore inventory stock atomically
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.qty } },
            { session }
          );
        }

        order.status = 'cancelled';
        await order.save({ session });
        await session.commitTransaction();

        // Invalidate products catalogue cache
        await incrementCacheVersion('products');
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      order.status = targetStatus as 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
      await order.save();
    }

    // Record audit event
    await AuditLog.create({
      actorId: new Types.ObjectId(actorId),
      action: 'order.status.update',
      target: order._id.toString(),
      ip: ip || null,
      meta: {
        orderId: order._id.toString(),
        previousStatus: currentStatus,
        newStatus: targetStatus
      }
    });

    return order;
  }

  /**
   * Returns a paginated audit trail of administrative operations
   */
  async listAuditLogs(query: AdminListAuditLogsQuery): Promise<PaginatedResult<unknown>> {
    const filter: Record<string, unknown> = {};
    if (query.action) {
      filter.action = query.action;
    }
    if (query.actorId) {
      filter.actorId = new Types.ObjectId(query.actorId);
    }

    const skip = (query.page - 1) * query.limit;
    const total = await AuditLog.countDocuments(filter);
    const items = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('actorId', 'name email role')
      .lean();

    const pages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages
      }
    };
  }
}

export const adminService = new AdminService();
export default adminService;
