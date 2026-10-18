export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in paise or rupees (we will use rupees for display, paise internally)
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  category: string;
  brand: string;
  images: string[];
  rating: number;
  reviewCount: number;
  tags?: string[];
  specifications?: Record<string, string>;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
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
  price: number; // snapshot in INR
  qty: number;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  status: OrderStatus;
  paymentRef?: string;
  idempotencyKey: string;
  createdAt: string;
}
