import { create } from 'zustand';
import { cartApi } from '../api/cart';
import { couponsApi } from '../api/coupons';
import { computeShipping } from '../lib/validation';
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
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
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

  applyCoupon: async (code: string) => {
    if (!useAuthStore.getState().isAuthenticated) {
      return { success: false, message: 'Please sign in to apply a coupon.' };
    }
    try {
      // The server prices the coupon against the saved cart; nothing here is trusted at checkout
      const res = await couponsApi.validate(code.trim());
      if (res.success && res.data) {
        set({ couponCode: res.data.code, discountPaise: res.data.discount });
        return {
          success: true,
          message: `${res.data.discountPercent}% off — you save ₹${Math.round(res.data.discount / 100).toLocaleString('en-IN')}`
        };
      }
      return { success: false, message: res.error?.message || 'Invalid coupon code' };
    } catch (err: any) {
      const details = err.response?.data?.error?.details;
      const message =
        (Array.isArray(details) && details[0]?.message) ||
        err.response?.data?.error?.message ||
        'Invalid coupon code';
      return { success: false, message };
    }
  },

  removeCoupon: () => set({ couponCode: null, discountPaise: 0 }),

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);
  },

  getShippingFee: () => computeShipping(get().subtotal - get().discountPaise),

  getGrandTotal: () => {
    const sub = get().subtotal;
    const discount = get().discountPaise;
    const shipping = get().getShippingFee();
    return Math.max(0, sub - discount + shipping);
  }
}));

// Re-quote an applied coupon whenever the cart subtotal changes so the displayed discount stays accurate
useCartStore.subscribe((state, prev) => {
  if (!state.couponCode || state.subtotal === prev.subtotal) return;
  const code = state.couponCode;
  if (state.subtotal === 0) {
    useCartStore.setState({ couponCode: null, discountPaise: 0 });
    return;
  }
  void state.applyCoupon(code).then((res) => {
    if (!res.success) useCartStore.setState({ couponCode: null, discountPaise: 0 });
  });
});
