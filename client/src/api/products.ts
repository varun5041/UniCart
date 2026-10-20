import { api } from './client';
import type { ApiResponse, Product, Category } from '../types';

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'discount';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  sort?: ProductSort;
  minPrice?: number; // paise
  maxPrice?: number; // paise
  minDiscount?: number;
  onSale?: boolean;
  inStock?: boolean;
}

export const productsApi = {
  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<Product[]>> {
    // Booleans are sent only when true, as the API expects the literal strings 'true' / 'false'
    const query: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === '' || value === false) continue;
      query[key] = typeof value === 'boolean' ? 'true' : value;
    }
    const res = await api.get<ApiResponse<Product[]>>('/products', { params: query });
    return res.data;
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    const res = await api.get<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`);
    return res.data;
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data;
  }
};
