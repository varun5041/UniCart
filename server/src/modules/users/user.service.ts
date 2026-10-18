import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { UpdateUserProfileInput } from './user.schema.js';

export class UserService {
  /**
   * Fetches profile of the currently authenticated user.
   */
  static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Updates name and/or addresses of the authenticated user.
   */
  static async updateProfile(userId: string, input: UpdateUserProfileInput) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found', 'USER_NOT_FOUND');
    }

    if (input.name !== undefined) {
      user.name = input.name;
    }

    if (input.addresses !== undefined) {
      user.addresses = input.addresses;
    }

    await user.save();
    return user;
  }
}

export default UserService;
