import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderItem, Address, OrderStatus } from '../types';

interface OrderStore {
  orders: Order[];
  createOrder: (
    items: OrderItem[],
    address: Address,
    subtotal: number,
    shipping: number,
    total: number,
    idempotencyKey: string,
    paymentMethod: string
  ) => Order;
  cancelOrder: (orderId: string) => { success: boolean; message: string };
  getOrderById: (orderId: string) => Order | undefined;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-98241',
    userId: 'user-001',
    items: [
      {
        productId: 'prod-002',
        name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
        price: 26990,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
      }
    ],
    subtotal: 26990,
    shipping: 0,
    total: 26990,
    shippingAddress: {
      id: 'addr-001',
      line1: 'Flat 402, Sunshine Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      country: 'India',
      isDefault: true
    },
    status: 'delivered',
    paymentRef: 'UPI-REF-8947219',
    idempotencyKey: 'idemp_init_001',
    createdAt: '2026-10-12T14:32:00Z'
  },
  {
    id: 'ORD-98242',
    userId: 'user-001',
    items: [
      {
        productId: 'prod-004',
        name: 'Noise ColorFit Pulse 2 Max 1.85" Bluetooth Calling Smartwatch',
        price: 1299,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
      },
      {
        productId: 'prod-005',
        name: 'Apple 20W USB-C Power Adapter (Original)',
        price: 1699,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'
      }
    ],
    subtotal: 2998,
    shipping: 0,
    total: 2998,
    shippingAddress: {
      id: 'addr-001',
      line1: 'Flat 402, Sunshine Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      country: 'India',
      isDefault: true
    },
    status: 'shipped',
    paymentRef: 'UPI-REF-9023412',
    idempotencyKey: 'idemp_init_002',
    createdAt: '2026-10-16T09:15:00Z'
  }
];

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: INITIAL_ORDERS,

      createOrder: (items, address, subtotal, shipping, total, idempotencyKey, paymentMethod) => {
        // Idempotency check: if an order with this key already exists, return it!
        const existing = get().orders.find((o) => o.idempotencyKey === idempotencyKey);
        if (existing) {
          return existing;
        }

        const newOrder: Order = {
          id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: 'user-001',
          items,
          shippingAddress: address,
          subtotal,
          shipping,
          total,
          status: 'paid',
          paymentRef: `${paymentMethod.toUpperCase()}-TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          idempotencyKey,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          orders: [newOrder, ...state.orders]
        }));

        return newOrder;
      },

      cancelOrder: (orderId: string) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) {
          return { success: false, message: 'Order not found' };
        }

        if (order.status === 'delivered') {
          return { success: false, message: 'Cannot cancel an order that has already been delivered' };
        }

        if (order.status === 'cancelled') {
          return { success: false, message: 'Order is already cancelled' };
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
          )
        }));

        return {
          success: true,
          message: `Order #${orderId} has been successfully cancelled and stock restored.`
        };
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((o) => o.id === orderId);
      }
    }),
    {
      name: 'unicart-orders-storage'
    }
  )
);
