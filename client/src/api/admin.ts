import { api } from './client';
import type { ApiResponse, Product, Order, OrderStatus, Coupon } from '../types';

export interface AdminCreateProductInput {
  name: string;
  slug?: string;
  description: string;
  mrp: number; // in paise; selling price is computed by the server
  discountPercent?: number;
  stock: number;
  category: string;
  images?: string[];
  isActive?: boolean;
}

export interface AdminUpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  mrp?: number;
  discountPercent?: number;
  stock?: number;
  category?: string;
  images?: string[];
  isActive?: boolean;
}

export interface AdminUploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface AdminAuditLog {
  _id: string;
  actorId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  target?: string;
  ip?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminCouponInput {
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscount?: number | null; // paise
  minOrderValue?: number; // paise
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export const adminApi = {
  async listProducts(params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: 'all' | 'listed' | 'unlisted';
  }): Promise<ApiResponse<Product[]>> {
    const res = await api.get<ApiResponse<Product[]>>('/admin/products', { params });
    return res.data;
  },

  async listCoupons(params?: { page?: number; limit?: number }): Promise<ApiResponse<Coupon[]>> {
    const res = await api.get<ApiResponse<Coupon[]>>('/admin/coupons', { params });
    return res.data;
  },

  async createCoupon(data: AdminCouponInput): Promise<ApiResponse<Coupon>> {
    const res = await api.post<ApiResponse<Coupon>>('/admin/coupons', data);
    return res.data;
  },

  async updateCoupon(id: string, data: Partial<AdminCouponInput>): Promise<ApiResponse<Coupon>> {
    const res = await api.patch<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data);
    return res.data;
  },

  async deleteCoupon(id: string): Promise<ApiResponse<{ id: string }>> {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/admin/coupons/${id}`);
    return res.data;
  },

  async listOrders(params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }): Promise<ApiResponse<Order[]>> {
    const res = await api.get<ApiResponse<Order[]>>('/admin/orders', { params });
    return res.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    const res = await api.patch<ApiResponse<Order>>(`/admin/orders/${orderId}/status`, { status });
    return res.data;
  },

  async createProduct(data: AdminCreateProductInput): Promise<ApiResponse<Product>> {
    const res = await api.post<ApiResponse<Product>>('/admin/products', data);
    return res.data;
  },

  async updateProduct(id: string, data: AdminUpdateProductInput): Promise<ApiResponse<Product>> {
    const res = await api.patch<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: string): Promise<ApiResponse<{ id: string; isActive: boolean }>> {
    const res = await api.delete<ApiResponse<{ id: string; isActive: boolean }>>(`/admin/products/${id}`);
    return res.data;
  },

  async bulkDeleteProducts(payload: { ids?: string[]; all?: boolean } | string[]): Promise<ApiResponse<{ count: number; message: string }>> {
    const body = Array.isArray(payload) ? { ids: payload } : payload;
    const res = await api.post<ApiResponse<{ count: number; message: string }>>('/admin/products/bulk-delete', body);
    return res.data;
  },

  async getUploadSignature(folder?: string): Promise<ApiResponse<AdminUploadSignature>> {
    const res = await api.post<ApiResponse<AdminUploadSignature>>('/admin/uploads/signature', { folder });
    return res.data;
  },

  async listAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
  }): Promise<ApiResponse<AdminAuditLog[]>> {
    const res = await api.get<ApiResponse<AdminAuditLog[]>>('/admin/audit-logs', { params });
    return res.data;
  }
};
