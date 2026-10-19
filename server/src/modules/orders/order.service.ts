import mongoose, { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Order, IOrder } from '../../models/Order.js';
import { Product } from '../../models/Product.js';
import { Cart } from '../../models/Cart.js';
import { IAddress } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { getCache, setCache, incrementCacheVersion } from '../../utils/cache.js';
import { logger } from '../../config/logger.js';
import { ListOrdersQuery } from './order.schema.js';

export interface PaginatedOrders {
  items: unknown[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class OrderService {
  /**
   * Creates an order with ACID transaction, atomic stock decrement, and idempotency key
   */
  async createOrder(
    userId: string,
    idempotencyKey: string | undefined,
    shippingAddress: IAddress
  ): Promise<IOrder> {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw ApiError.badRequest(
        'Idempotency-Key header is required for order creation',
        'IDEMPOTENCY_KEY_REQUIRED'
      );
    }

    const trimmedKey = idempotencyKey.trim();
    const redisKey = `unicart:idempotency:order:${trimmedKey}`;

    // 1. Check Redis idempotency cache first
    const cachedOrder = await getCache<IOrder>(redisKey);
    if (cachedOrder) {
      logger.info({ idempotencyKey: trimmedKey }, '[Idempotency] Returning cached order response');
      return cachedOrder;
    }

    // 2. Check MongoDB for existing order with idempotencyKey
    const existingOrder = await Order.findOne({ idempotencyKey: trimmedKey });
    if (existingOrder) {
      await setCache(redisKey, existingOrder.toObject(), 86400);
      return existingOrder;
    }

    // 3. Retrieve user's cart
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty. Add items before checking out.', 'EMPTY_CART');
    }

    // 4. Execute atomic stock decrement and order creation within a MongoDB session/transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderItems: Array<{
        productId: Types.ObjectId;
        name: string;
        price: number;
        qty: number;
      }> = [];

      let subtotal = 0;

      for (const item of cart.items) {
        // Atomic stock decrement with optimistic condition: stock >= item.qty
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.qty },
            isActive: true
          },
          { $inc: { stock: -item.qty } },
          { session, new: true }
        );

        if (!updatedProduct) {
          throw ApiError.conflict(
            `Product '${item.productId}' is out of stock or does not have sufficient quantity available.`,
            'OUT_OF_STOCK'
          );
        }

        orderItems.push({
          productId: updatedProduct._id as Types.ObjectId,
          name: updatedProduct.name,
          price: updatedProduct.price,
          qty: item.qty
        });

        subtotal += updatedProduct.price * item.qty;
      }

      // Recompute shipping & grand total (paise)
      // Free shipping for orders >= ₹500 (50,000 paise), else ₹50 (5,000 paise)
      const shipping = subtotal >= 50000 ? 0 : 5000;
      const total = subtotal + shipping;

      const [order] = await Order.create(
        [
          {
            userId: new Types.ObjectId(userId),
            items: orderItems,
            subtotal,
            shipping,
            total,
            shippingAddress,
            status: 'pending_payment',
            idempotencyKey: trimmedKey
          }
        ],
        { session }
      );

      // Clear the customer's cart
      await Cart.updateOne(
        { userId: new Types.ObjectId(userId) },
        { items: [] },
        { session }
      );

      await session.commitTransaction();

      // Invalidate catalogue cache due to stock decrement
      await incrementCacheVersion('products');

      // Cache order under idempotency key for 24h (86,400s)
      await setCache(redisKey, order.toObject ? order.toObject() : order, 86400);

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Mock payment endpoint: flips status from pending_payment to paid (idempotent)
   */
  async payOrder(userId: string, orderId: string, paymentRef?: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Ownership check (prevents IDOR)
    if (order.userId.toString() !== userId) {
      throw ApiError.forbidden('You lack permissions to access this order', 'FORBIDDEN');
    }

    // Idempotent: already paid
    if (order.status === 'paid') {
      return order;
    }

    if (order.status !== 'pending_payment') {
      throw ApiError.badRequest(
        `Order cannot be paid in current status: '${order.status}'`,
        'INVALID_ORDER_STATUS'
      );
    }

    order.status = 'paid';
    order.paymentRef = paymentRef || `mock_pay_${uuidv4().substring(0, 8)}`;
    await order.save();

    return order;
  }

  /**
   * Cancels order and restores inventory atomically in a transaction
   */
  async cancelOrder(userId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Ownership check (prevents IDOR)
    if (order.userId.toString() !== userId) {
      throw ApiError.forbidden('You lack permissions to cancel this order', 'FORBIDDEN');
    }

    if (order.status !== 'pending_payment') {
      throw ApiError.badRequest(
        `Only orders with 'pending_payment' status can be cancelled. Current status: '${order.status}'`,
        'CANNOT_CANCEL_ORDER'
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Restore stock atomically
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

      // Invalidate catalogue cache due to restored inventory
      await incrementCacheVersion('products');

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Lists authenticated customer's own orders with pagination
   */
  async listUserOrders(userId: string, query: ListOrdersQuery): Promise<PaginatedOrders> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId)
    };

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;
    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
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
   * Retrieves single order by ID with strict ownership validation (IDOR protection)
   */
  async getUserOrderById(userId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.userId.toString() !== userId) {
      throw ApiError.forbidden('You lack permissions to view this order', 'FORBIDDEN');
    }

    return order;
  }
}

export const orderService = new OrderService();
export default orderService;
