import type { Category, Product, User, Order } from '../types';

/**
 * Deprecated: UniCart now strictly pulls all live catalog data from MongoDB.
 * Seeded and mock products/categories are completely disabled.
 */
export const MOCK_CATEGORIES: Category[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const MOCK_ORDERS: Order[] = [];
export const MOCK_USER: User | null = null;
