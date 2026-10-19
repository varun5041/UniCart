import { api } from './client';
import type { ApiResponse, Product, Category } from '../types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  minPrice?: number;
  maxPrice?: number;
}

export const productsApi = {
  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<Product[]>> {
    const res = await api.get<ApiResponse<Product[]>>('/products', { params });
    return res.data;
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
    return res.data;
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data;
  }
};
