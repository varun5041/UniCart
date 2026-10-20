import { Types } from 'mongoose';
import { User, IUser, MAX_WISHLIST_ITEMS } from '../../models/User.js';
import { Product } from '../../models/Product.js';
import { ApiError } from '../../utils/ApiError.js';
import { SavedAddressInput } from './user.schema.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  addresses: unknown[];
  wishlist: string[];
}

export function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    addresses: user.addresses ?? [],
    wishlist: (user.wishlist ?? []).map((id) => id.toString())
  };
}

export class UserService {
  async updateProfile(userId: string, name: string): Promise<PublicUser> {
    const user = await User.findByIdAndUpdate(userId, { $set: { name } }, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    return toPublicUser(user);
  }

  /**
   * Replaces the saved address book. Exactly one address is flagged default when the list is non-empty.
   */
  async replaceAddresses(userId: string, addresses: SavedAddressInput[]): Promise<PublicUser> {
    const defaultIdx = Math.max(0, addresses.findIndex((a) => a.isDefault));
    const normalized = addresses.map((a, i) => ({ ...a, isDefault: i === defaultIdx }));

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { addresses: normalized } },
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    return toPublicUser(user);
  }

  async getWishlist(userId: string): Promise<unknown[]> {
    const user = await User.findById(userId).select('wishlist').lean();
    if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    if (!user.wishlist?.length) return [];

    const products = await Product.find({ _id: { $in: user.wishlist }, isActive: true })
      .populate('category', 'name slug')
      .lean();

    // Preserve most-recently-added-first ordering
    const order = new Map(user.wishlist.map((id, i) => [id.toString(), i]));
    return products.sort(
      (a, b) => (order.get(b._id.toString()) ?? 0) - (order.get(a._id.toString()) ?? 0)
    );
  }

  async addToWishlist(userId: string, productId: string): Promise<string[]> {
    const exists = await Product.exists({ _id: productId, isActive: true });
    if (!exists) throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');

    // Size cap enforced atomically in the filter
    const user = await User.findOneAndUpdate(
      { _id: userId, [`wishlist.${MAX_WISHLIST_ITEMS - 1}`]: { $exists: false } },
      { $addToSet: { wishlist: new Types.ObjectId(productId) } },
      { new: true }
    ).select('wishlist');

    if (!user) {
      throw ApiError.badRequest(
        `Wishlist can hold at most ${MAX_WISHLIST_ITEMS} items`,
        'WISHLIST_FULL'
      );
    }
    return user.wishlist.map((id) => id.toString());
  }

  async removeFromWishlist(userId: string, productId: string): Promise<string[]> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: new Types.ObjectId(productId) } },
      { new: true }
    ).select('wishlist');
    if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    return user.wishlist.map((id) => id.toString());
  }
}

export const userService = new UserService();
export default userService;
