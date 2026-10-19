import { create } from 'zustand';
import { cartApi } from '../api/cart';
import { useAuthStore } from './useAuthStore';
import type { CartItem, Product } from '../types';

interface CartStore {
  items: CartItem[];
  subtotal: number; // in paise
  isLoading: boolean;
  couponCode: string | null;
  discountPaise: number;

  syncCart: () => Promise<void>;
  addToCart: (product: Product, qty?: number) => Promise<boolean>;
  updateQuantity: (productId: string, qty: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  getItemCount: () => number;
  getShippingFee: () => number; // in paise
  getGrandTotal: () => number; // in paise
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  subtotal: 0,
  isLoading: false,
  couponCode: null,
  discountPaise: 0,

  syncCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      set({ isLoading: true });
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        set({
          items: res.data.items || [],
          subtotal: res.data.subtotal || 0,
          isLoading: false
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (product: Product, qty = 1) => {
    const { isAuthenticated } = useAuthStore.getState();
    const prodId = product._id || product.id || '';

    if (isAuthenticated) {
      try {
        set({ isLoading: true });
        const res = await cartApi.addItem(prodId, qty);
        if (res.success && res.data) {
          set({
            items: res.data.items || [],
            subtotal: res.data.subtotal || 0,
            isLoading: false
          });
          return true;
        }
      } catch {
        set({ isLoading: false });
        return false;
      }
    } else {
      // Local guest cart
      const currentItems = [...get().items];
      const existingIdx = currentItems.findIndex(
        (i) => i.productId === prodId || (i.product && (i.product._id === prodId || i.product.id === prodId))
      );

      if (existingIdx > -1) {
        const item = currentItems[existingIdx];
        const newQty = Math.min((item.qty || item.quantity || 1) + qty, product.stock || 10);
        currentItems[existingIdx] = {
          ...item,
          qty: newQty,
          quantity: newQty
        };
      } else {
        currentItems.push({
          productId: prodId,
          product,
          name: product.name,
          price: product.price,
          qty,
          quantity: qty,
          images: product.images
        });
      }

      const newSubtotal = currentItems.reduce(
        (acc, item) => acc + (item.price || item.product?.price || 0) * (item.qty || item.quantity || 1),
        0
      );

      set({ items: currentItems, subtotal: newSubtotal });
      return true;
    }
    return false;
  },

  updateQuantity: async (productId: string, qty: number) => {
    if (qty <= 0) {
      return get().removeFromCart(productId);
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        set({ isLoading: true });
        const res = await cartApi.updateItem(productId, qty);
        if (res.success && res.data) {
          set({
            items: res.data.items || [],
            subtotal: res.data.subtotal || 0,
            isLoading: false
          });
          return true;
        }
      } catch {
        set({ isLoading: false });
        return false;
      }
    } else {
      const currentItems = get().items.map((item) => {
        if (item.productId === productId || item.product?._id === productId || item.product?.id === productId) {
          return { ...item, qty, quantity: qty };
        }
        return item;
      });

      const newSubtotal = currentItems.reduce(
        (acc, item) => acc + (item.price || item.product?.price || 0) * (item.qty || item.quantity || 1),
        0
      );

      set({ items: currentItems, subtotal: newSubtotal });
      return true;
    }
    return false;
  },

  removeFromCart: async (productId: string) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        set({ isLoading: true });
        const res = await cartApi.removeItem(productId);
        if (res.success && res.data) {
          set({
            items: res.data.items || [],
            subtotal: res.data.subtotal || 0,
            isLoading: false
          });
          return true;
        }
      } catch {
        set({ isLoading: false });
        return false;
      }
    } else {
      const filtered = get().items.filter(
        (item) => item.productId !== productId && item.product?._id !== productId && item.product?.id !== productId
      );
      const newSubtotal = filtered.reduce(
        (acc, item) => acc + (item.price || item.product?.price || 0) * (item.qty || item.quantity || 1),
        0
      );
      set({ items: filtered, subtotal: newSubtotal });
      return true;
    }
    return false;
  },

  clearCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch {
        // ignore
      }
    }
    set({ items: [], subtotal: 0, couponCode: null, discountPaise: 0 });
    return true;
  },

  applyCoupon: (code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === 'UNICART10') {
      const sub = get().subtotal;
      const discount = Math.round(sub * 0.1);
      set({ couponCode: upper, discountPaise: discount });
      return { success: true, message: '10% discount applied!' };
    }
    if (upper === 'SAVE500') {
      const discount = 50000; // ₹500 in paise
      set({ couponCode: upper, discountPaise: discount });
      return { success: true, message: '₹500 flat discount applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try UNICART10 or SAVE500' };
  },

  removeCoupon: () => set({ couponCode: null, discountPaise: 0 }),

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);
  },

  getShippingFee: () => {
    const sub = get().subtotal;
    if (sub === 0 || sub >= 99900) return 0; // Free delivery over ₹999
    return 9900; // ₹99 in paise
  },

  getGrandTotal: () => {
    const sub = get().subtotal;
    const discount = get().discountPaise;
    const shipping = get().getShippingFee();
    return Math.max(0, sub - discount + shipping);
  }
}));
