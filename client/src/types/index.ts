export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number; // selling price in paise
  mrp?: number; // list price in paise
  discountPercent?: number;
  soldCount?: number;
  stock: number;
  category: string | Category;
  categories?: (string | Category)[];
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
  slug?: string;
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
  avatar?: string;
  addresses: Address[];
  wishlist?: string[];
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscount?: number | null; // paise
  minOrderValue: number; // paise
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CouponQuote {
  code: string;
  discountPercent: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
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
  discount?: number; // paise
  couponCode?: string | null;
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

/** Formats integer paise as a whole-rupee price, e.g. 129900 -> "₹1,299". */
export function formatRupees(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export function getProductId(product: Pick<Product, '_id' | 'id' | 'slug'>): string {
  return product._id || product.id || '';
}

/** MRP and discount with safe fallbacks for products created before discounts existed. */
export function getPricing(product: Product): { price: number; mrp: number; discount: number } {
  const mrp = product.mrp && product.mrp > product.price ? product.mrp : product.price;
  const discount =
    product.discountPercent && product.discountPercent > 0 && mrp > product.price
      ? product.discountPercent
      : 0;
  return { price: product.price, mrp, discount };
}

export function getCategoryNames(product: Product): string[] {
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    return product.categories
      .map((c) => (typeof c === 'object' && c ? c.name : String(c)))
      .filter(Boolean);
  }
  if (typeof product.category === 'object' && product.category) {
    return [product.category.name];
  }
  return product.category ? [String(product.category)] : [];
}

export function getCategoryName(product: Product): string {
  const names = getCategoryNames(product);
  return names.join(', ');
}
