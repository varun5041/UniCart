import { api } from './client';
import type { ApiResponse, Order, Address } from '../types';

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const ordersApi = {
  async createOrder(shippingAddress: Address, idempotencyKey: string): Promise<ApiResponse<Order>> {
    const res = await api.post<ApiResponse<Order>>(
      '/orders',
      {
        shippingAddress: {
          line1: shippingAddress.line1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          country: shippingAddress.country || 'India'
        }
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    );
    return res.data;
  },

  async getOrders(params?: ListOrdersParams): Promise<ApiResponse<Order[]>> {
    const res = await api.get<ApiResponse<Order[]>>('/orders', { params });
    return res.data;
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data;
  },

  async payOrder(id: string, paymentRef?: string): Promise<ApiResponse<Order>> {
    const res = await api.post<ApiResponse<Order>>(`/orders/${id}/pay`, { paymentRef });
    return res.data;
  },

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    const res = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return res.data;
  }
};
