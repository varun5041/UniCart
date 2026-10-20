import { create } from 'zustand';
import { usersApi } from '../api/users';

interface WishlistStore {
  ids: string[];
  pending: string[];

  setIds: (ids: string[]) => void;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ success: boolean; added?: boolean; error?: string }>;
  reset: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: [],
  pending: [],

  setIds: (ids) => set({ ids }),

  has: (productId) => get().ids.includes(productId),

  toggle: async (productId) => {
    if (!productId || get().pending.includes(productId)) return { success: false };
    const wasSaved = get().ids.includes(productId);

    // Optimistic update, rolled back on failure
    set((s) => ({
      pending: [...s.pending, productId],
      ids: wasSaved ? s.ids.filter((id) => id !== productId) : [productId, ...s.ids]
    }));

    try {
      const res = wasSaved
        ? await usersApi.removeFromWishlist(productId)
        : await usersApi.addToWishlist(productId);
      if (res.success) set({ ids: res.data.wishlist });
      return { success: true, added: !wasSaved };
    } catch (err: any) {
      set((s) => ({
        ids: wasSaved ? [productId, ...s.ids] : s.ids.filter((id) => id !== productId)
      }));
      return {
        success: false,
        error: err.response?.data?.error?.message || 'Could not update your wishlist'
      };
    } finally {
      set((s) => ({ pending: s.pending.filter((id) => id !== productId) }));
    }
  },

  reset: () => set({ ids: [], pending: [] })
}));
