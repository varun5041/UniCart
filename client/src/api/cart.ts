import { api } from './client';
import type { ApiResponse, CartResponse } from '../types';

export const cartApi = {
  async getCart(): Promise<ApiResponse<CartResponse>> {
    const res = await api.get<ApiResponse<CartResponse>>('/cart');
    return res.data;
  },

  async addItem(productId: string, qty: number = 1): Promise<ApiResponse<CartResponse>> {
    const res = await api.post<ApiResponse<CartResponse>>('/cart/items', { productId, qty });
    return res.data;
  },

  async updateItem(productId: string, qty: number): Promise<ApiResponse<CartResponse>> {
    const res = await api.patch<ApiResponse<CartResponse>>(`/cart/items/${productId}`, { qty });
    return res.data;
  },

  async removeItem(productId: string): Promise<ApiResponse<CartResponse>> {
    const res = await api.delete<ApiResponse<CartResponse>>(`/cart/items/${productId}`);
    return res.data;
  },

  async clearCart(): Promise<ApiResponse<CartResponse>> {
    const res = await api.delete<ApiResponse<CartResponse>>('/cart');
    return res.data;
  }
};
