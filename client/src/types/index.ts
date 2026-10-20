export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  createdAt?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in paise or rupees
  stock: number;
  category: string | Category;
  images: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced fields
  originalPrice?: number;
  discountPercentage?: number;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  isFeatured?: boolean;
  specifications?: Record<string, string>;
}

export interface CartItem {
  productId: string;
  product?: Product;
  name?: string;
  price?: number;
  qty: number;
  quantity?: number;
  images?: string[];
}

export interface CartResponse {
  userId: string;
  items: CartItem[];
  subtotal: number; // paise
  itemCount: number;
}

export interface Address {
  _id?: string;
  id?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  addresses: Address[];
}

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number; // in paise or rupees
  qty: number;
  image?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  userId: string;
  items: OrderItem[];
  subtotal: number; // in paise or rupees
  shipping: number; // in paise or rupees
  total: number; // in paise or rupees
  shippingAddress: Address;
  status: OrderStatus;
  paymentRef?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export function formatInr(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees);
}
