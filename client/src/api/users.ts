import { api } from './client';
import type { ApiResponse, User, Address, Product } from '../types';

export type AddressInput = Pick<Address, 'line1' | 'city' | 'state' | 'pincode' | 'country' | 'isDefault'>;

export const usersApi = {
  async getMe(): Promise<ApiResponse<{ user: User }>> {
    const res = await api.get<ApiResponse<{ user: User }>>('/users/me');
    return res.data;
  },

  async updateMe(data: { name: string }): Promise<ApiResponse<{ user: User }>> {
    const res = await api.patch<ApiResponse<{ user: User }>>('/users/me', data);
    return res.data;
  },

  async replaceAddresses(addresses: AddressInput[]): Promise<ApiResponse<{ user: User }>> {
    const res = await api.put<ApiResponse<{ user: User }>>('/users/me/addresses', { addresses });
    return res.data;
  },

  async getWishlist(): Promise<ApiResponse<Product[]>> {
    const res = await api.get<ApiResponse<Product[]>>('/users/me/wishlist');
    return res.data;
  },

  async addToWishlist(productId: string): Promise<ApiResponse<{ wishlist: string[] }>> {
    const res = await api.post<ApiResponse<{ wishlist: string[] }>>('/users/me/wishlist', { productId });
    return res.data;
  },

  async removeFromWishlist(productId: string): Promise<ApiResponse<{ wishlist: string[] }>> {
    const res = await api.delete<ApiResponse<{ wishlist: string[] }>>(`/users/me/wishlist/${productId}`);
    return res.data;
  }
};
