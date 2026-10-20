import { create } from 'zustand';
import { authApi } from '../api/auth';
import { usersApi, type AddressInput } from '../api/users';
import { useWishlistStore } from './useWishlistStore';
import type { User, Address } from '../types';

type MutationResult = { success: boolean; error?: string };

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  selectedAddress: Address | null;

  initAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSelectedAddress: (addr: Address | null) => void;
  updateName: (name: string) => Promise<MutationResult>;
  addAddress: (addr: AddressInput) => Promise<MutationResult>;
  deleteAddress: (index: number) => Promise<MutationResult>;
  setDefaultAddress: (index: number) => Promise<MutationResult>;
}

function toAddressInput(a: Address): AddressInput {
  return {
    line1: a.line1,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country || 'India',
    isDefault: Boolean(a.isDefault)
  };
}

function errorMessage(err: any, fallback: string): string {
  const details = err.response?.data?.error?.details;
  if (Array.isArray(details) && details[0]?.message) return details[0].message;
  return err.response?.data?.error?.message || fallback;
}

function pickDefault(user: User | null): Address | null {
  return user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;
}

function extractUser(data: any): User | null {
  if (!data) return null;
  if (data.user && typeof data.user === 'object') {
    return data.user as User;
  }
  return data as User;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  selectedAddress: null,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      // Silently refresh token using httpOnly cookie
      const refreshRes = await authApi.refresh();
      if (refreshRes.success) {
        // Fetch fresh profile
        const userRes = await usersApi.getMe();
        if (userRes.success && userRes.data) {
          const user = extractUser(userRes.data);
          if (user) {
            const defaultAddr = pickDefault(user);
            useWishlistStore.getState().setIds(user.wishlist ?? []);
            set({
              user,
              isAuthenticated: true,
              selectedAddress: defaultAddr,
              isInitialized: true
            });
            return;
          }
        }
      }
    } catch {
      // Refresh failed (no active session cookie) - keep guest state
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  login: async (email: string, pass: string) => {
    try {
      set({ isLoading: true });
      const res = await authApi.login({ email, password: pass });
      if (res.success) {
        let user: User | null = null;
        try {
          const userRes = await usersApi.getMe();
          user = extractUser(userRes.data);
        } catch {
          // Fall back to login response payload
        }
        user = user || extractUser(res.data) || null;
        const defaultAddr = pickDefault(user);
        useWishlistStore.getState().setIds(user?.wishlist ?? []);
        set({
          user,
          isAuthenticated: true,
          selectedAddress: defaultAddr,
          isLoading: false
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Login failed' };
    } catch (err: any) {
      set({ isLoading: false });
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async (idToken: string) => {
    try {
      set({ isLoading: true });
      const res = await authApi.googleLogin(idToken);
      if (res.success) {
        let user: User | null = null;
        try {
          const userRes = await usersApi.getMe();
          user = extractUser(userRes.data);
        } catch {
          // Fall back to login response payload
        }
        user = user || extractUser(res.data) || null;
        const defaultAddr = pickDefault(user);
        useWishlistStore.getState().setIds(user?.wishlist ?? []);
        set({
          user,
          isAuthenticated: true,
          selectedAddress: defaultAddr,
          isLoading: false
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Google sign-in failed' };
    } catch (err: any) {
      set({ isLoading: false });
      const msg = err.response?.data?.error?.message || err.message || 'Google sign-in failed';
      return { success: false, error: msg };
    }
  },

  register: async (name: string, email: string, pass: string) => {
    try {
      set({ isLoading: true });
      const res = await authApi.register({ name, email, password: pass });
      if (res.success) {
        let user: User | null = null;
        try {
          const userRes = await usersApi.getMe();
          user = extractUser(userRes.data);
        } catch {
          // Fall back to register response payload
        }
        user = user || extractUser(res.data) || null;
        const defaultAddr = pickDefault(user);
        useWishlistStore.getState().setIds(user?.wishlist ?? []);
        set({
          user,
          isAuthenticated: true,
          selectedAddress: defaultAddr,
          isLoading: false
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.error?.message || 'Registration failed' };
    } catch (err: any) {
      set({ isLoading: false });
      const msg = err.response?.data?.error?.message || err.message || 'Registration failed';
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      useWishlistStore.getState().reset();
      set({
        user: null,
        isAuthenticated: false,
        selectedAddress: null,
        isLoading: false
      });
    }
  },

  logoutAll: async () => {
    try {
      set({ isLoading: true });
      await authApi.logoutAll();
    } catch {
      // Ignore
    } finally {
      useWishlistStore.getState().reset();
      set({
        user: null,
        isAuthenticated: false,
        selectedAddress: null,
        isLoading: false
      });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setSelectedAddress: (addr) => set({ selectedAddress: addr }),

  updateName: async (name) => {
    try {
      const res = await usersApi.updateMe({ name });
      if (res.success) {
        set({ user: extractUser(res.data) || get().user });
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Could not update profile' };
    } catch (err: any) {
      return { success: false, error: errorMessage(err, 'Could not update profile') };
    }
  },

  addAddress: async (addr) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Please sign in first' };
    const current = (user.addresses || []).map(toAddressInput);
    const isFirst = current.length === 0;
    const next = addr.isDefault
      ? [...current.map((a) => ({ ...a, isDefault: false })), { ...addr, isDefault: true }]
      : [...current, { ...addr, isDefault: isFirst }];
    return saveAddresses(next, set, get, addr.isDefault || isFirst ? next.length - 1 : undefined);
  },

  deleteAddress: async (index) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Please sign in first' };
    const next = (user.addresses || []).map(toAddressInput).filter((_, i) => i !== index);
    return saveAddresses(next, set, get);
  },

  setDefaultAddress: async (index) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Please sign in first' };
    const next = (user.addresses || []).map((a, i) => ({ ...toAddressInput(a), isDefault: i === index }));
    return saveAddresses(next, set, get, index);
  }
}));

async function saveAddresses(
  addresses: AddressInput[],
  set: (partial: Partial<AuthStore>) => void,
  get: () => AuthStore,
  selectIndex?: number
): Promise<MutationResult> {
  try {
    const res = await usersApi.replaceAddresses(addresses);
    if (!res.success) return { success: false, error: res.error?.message || 'Could not save address' };
    const user = extractUser(res.data) || get().user;
    const saved = user?.addresses || [];
    const prev = get().selectedAddress;
    // Keep the checkout selection pointing at a saved address
    const selected =
      (selectIndex !== undefined ? saved[selectIndex] : undefined) ||
      saved.find((a) => prev && a.line1 === prev.line1 && a.pincode === prev.pincode) ||
      pickDefault(user);
    set({ user, selectedAddress: selected || null });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: errorMessage(err, 'Could not save address') };
  }
}
