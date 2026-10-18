import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

export interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Computed helper getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShippingFee: () => number;
  getGrandTotal: () => number;
}

export const VALID_COUPONS: Record<string, { type: 'percentage' | 'fixed'; value: number; minSpend?: number }> = {
  'UNICART10': { type: 'percentage', value: 10, minSpend: 999 },
  'SAVE500': { type: 'fixed', value: 500, minSpend: 2999 },
  'WELCOME50': { type: 'fixed', value: 50, minSpend: 499 }
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [
        // Default initialized with 1 item for immediate rich showcase (Boat Rockerz 450)
        {
          product: {
            id: 'prod-001',
            name: 'Boat Rockerz 450 Bluetooth On-Ear Headphone with Mic',
            slug: 'boat-rockerz-450-bluetooth-on-ear-headphone',
            description: 'Up to 15 Hours of Playback, 40mm Dynamic Drivers, Padded Ear Cushions.',
            price: 1499,
            originalPrice: 3990,
            discountPercentage: 62,
            stock: 18,
            category: 'audio-wearables',
            brand: 'Boat',
            rating: 4.4,
            reviewCount: 3840,
            images: [
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
            ]
          },
          quantity: 1
        }
      ],
      coupon: null,

      addToCart: (product: Product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentQty = updatedItems[existingIndex].quantity;
            const newQty = Math.min(currentQty + quantity, product.stock);
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: newQty
            };
            return { items: updatedItems };
          } else {
            return {
              items: [...state.items, { product, quantity: Math.min(quantity, product.stock) }]
            };
          }
        });
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId)
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => {
          const updatedItems = state.items.map((item) => {
            if (item.product.id === productId) {
              return { ...item, quantity: Math.min(quantity, item.product.stock) };
            }
            return item;
          });
          return { items: updatedItems };
        });
      },

      clearCart: () => {
        set({ items: [], coupon: null });
      },

      applyCoupon: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        const found = VALID_COUPONS[cleanCode];
        if (!found) {
          return { success: false, message: 'Invalid coupon code. Try UNICART10 or SAVE500' };
        }
        const subtotal = get().getSubtotal();
        if (found.minSpend && subtotal < found.minSpend) {
          return {
            success: false,
            message: `Coupon requires a minimum order of ₹${found.minSpend}`
          };
        }
        set({
          coupon: {
            code: cleanCode,
            discountType: found.type,
            discountValue: found.value
          }
        });
        return { success: true, message: `Coupon ${cleanCode} applied successfully!` };
      },

      removeCoupon: () => {
        set({ coupon: null });
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      },

      getDiscount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        if (coupon.discountType === 'percentage') {
          return Math.round((subtotal * coupon.discountValue) / 100);
        }
        return Math.min(coupon.discountValue, subtotal);
      },

      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0 || subtotal >= 999) {
          return 0; // Free delivery for orders >= ₹999
        }
        return 99; // Standard delivery fee
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().getShippingFee();
        return Math.max(0, subtotal - discount + shipping);
      }
    }),
    {
      name: 'unicart-cart-storage'
    }
  )
);
