import { create } from 'zustand';
import { ordersApi } from '../api/orders';
import { useAuthStore } from './useAuthStore';
import type { Order, Address } from '../types';

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  activeOrder: Order | null;

  fetchOrders: () => Promise<void>;
  createOrder: (
    address: Address,
    idempotencyKey: string,
    autoPay?: boolean,
    couponCode?: string | null
  ) => Promise<{ success: boolean; order?: Order; error?: string }>;
  payOrder: (orderId: string, ref?: string) => Promise<{ success: boolean; error?: string }>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  getOrderById: (orderId: string) => Promise<Order | null>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  isLoading: false,
  activeOrder: null,

  fetchOrders: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      set({ isLoading: true });
      const res = await ordersApi.getOrders({ limit: 50 });
      if (res.success && res.data) {
        set({ orders: res.data, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createOrder: async (address, idempotencyKey, autoPay = true, couponCode = null) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in to place an order.' };
    }

    try {
      set({ isLoading: true });
      const res = await ordersApi.createOrder(address, idempotencyKey, couponCode);
      if (res.success && res.data) {
        let placedOrder = res.data;

        // Auto mock-pay if requested
        if (autoPay) {
          try {
            const payRes = await ordersApi.payOrder(
              placedOrder._id || placedOrder.id || '',
              `PAY_${Date.now()}`
            );
            if (payRes.success && payRes.data) {
              placedOrder = payRes.data;
            }
          } catch {
            // non-fatal, order remains pending_payment
          }
        }

        set((state) => ({
          orders: [placedOrder, ...state.orders],
          activeOrder: placedOrder,
          isLoading: false
        }));

        return { success: true, order: placedOrder };
      }

      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Order creation failed' };
    } catch (err: any) {
      set({ isLoading: false });
      const msg = err.response?.data?.error?.message || err.message || 'Failed to place order';
      return { success: false, error: msg };
    }
  },

  payOrder: async (orderId, ref) => {
    try {
      set({ isLoading: true });
      const res = await ordersApi.payOrder(orderId, ref);
      if (res.success && res.data) {
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId || o.id === orderId ? res.data : o)),
          activeOrder: res.data,
          isLoading: false
        }));
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Payment processing failed' };
    } catch (err: any) {
      set({ isLoading: false });
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message || 'Payment failed'
      };
    }
  },

  cancelOrder: async (orderId) => {
    try {
      set({ isLoading: true });
      const res = await ordersApi.cancelOrder(orderId);
      if (res.success && res.data) {
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId || o.id === orderId ? res.data : o)),
          isLoading: false
        }));
        return { success: true, message: 'Order cancelled successfully and stock restored.' };
      }
      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Failed to cancel order' };
    } catch (err: any) {
      set({ isLoading: false });
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message || 'Cancellation rejected'
      };
    }
  },

  getOrderById: async (orderId) => {
    const existing = get().orders.find((o) => o._id === orderId || o.id === orderId);
    if (existing) return existing;

    try {
      const res = await ordersApi.getOrderById(orderId);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // not found
    }
    return null;
  }
}));
