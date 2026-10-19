import { Types } from 'mongoose';
import { Cart } from '../../models/Cart.js';
import { Product } from '../../models/Product.js';
import { ApiError } from '../../utils/ApiError.js';

export interface PopulatedCartItem {
  productId: string;
  name: string;
  slug: string;
  price: number; // Current live price in paise
  images: string[];
  stock: number;
  qty: number;
  itemTotal: number; // price * qty
}

export interface CartResponse {
  items: PopulatedCartItem[];
  subtotal: number;
  itemCount: number;
}

export class CartService {
  /**
   * Retrieves user cart with live prices and computed subtotals directly from DB
   */
  async getCart(userId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        itemCount: 0
      };
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const populatedItems: PopulatedCartItem[] = [];
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const p = productMap.get(item.productId.toString());
      if (p) {
        const itemTotal = p.price * item.qty;
        subtotal += itemTotal;
        itemCount += item.qty;

        populatedItems.push({
          productId: p._id.toString(),
          name: p.name,
          slug: p.slug,
          price: p.price,
          images: p.images || [],
          stock: p.stock,
          qty: item.qty,
          itemTotal
        });
      }
    }

    return {
      items: populatedItems,
      subtotal,
      itemCount
    };
  }

  /**
   * Adds an item to the user's cart (capped at 10 items max per product)
   */
  async addItem(userId: string, productId: string, qty: number): Promise<CartResponse> {
    const product = await Product.findOne({
      _id: new Types.ObjectId(productId),
      isActive: true
    });

    if (!product) {
      throw ApiError.notFound('Product not found or is currently inactive', 'PRODUCT_NOT_FOUND');
    }

    if (product.stock < 1) {
      throw ApiError.conflict('Product is currently out of stock', 'OUT_OF_STOCK');
    }

    let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) {
      cart = new Cart({
        userId: new Types.ObjectId(userId),
        items: []
      });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId
    );

    if (existingIndex > -1) {
      const currentQty = cart.items[existingIndex].qty;
      const targetQty = currentQty + qty;

      if (targetQty > 10) {
        throw ApiError.badRequest(
          `Cannot add ${qty} more. Maximum limit is 10 units per item (currently in cart: ${currentQty}).`,
          'MAX_QUANTITY_EXCEEDED'
        );
      }

      if (product.stock < targetQty) {
        throw ApiError.conflict(
          `Insufficient stock available. Only ${product.stock} units remaining.`,
          'INSUFFICIENT_STOCK'
        );
      }

      cart.items[existingIndex].qty = targetQty;
    } else {
      if (product.stock < qty) {
        throw ApiError.conflict(
          `Insufficient stock available. Only ${product.stock} units remaining.`,
          'INSUFFICIENT_STOCK'
        );
      }

      cart.items.push({
        productId: new Types.ObjectId(productId),
        qty
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Updates the quantity of a specific item in the cart
   */
  async updateItem(userId: string, productId: string, qty: number): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) {
      throw ApiError.notFound('Cart is empty', 'CART_NOT_FOUND');
    }

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) {
      throw ApiError.notFound('Item not found in cart', 'ITEM_NOT_FOUND');
    }

    const product = await Product.findOne({
      _id: new Types.ObjectId(productId),
      isActive: true
    });

    if (!product) {
      throw ApiError.notFound('Product is no longer available', 'PRODUCT_NOT_FOUND');
    }

    if (product.stock < qty) {
      throw ApiError.conflict(
        `Cannot set quantity to ${qty}. Only ${product.stock} units in stock.`,
        'INSUFFICIENT_STOCK'
      );
    }

    item.qty = qty;
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * Removes a single product item from user's cart
   */
  async removeItem(userId: string, productId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (cart) {
      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
      await cart.save();
    }

    return this.getCart(userId);
  }

  /**
   * Clears all items in user cart
   */
  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return { message: 'Cart cleared successfully' };
  }
}

export const cartService = new CartService();
export default cartService;
