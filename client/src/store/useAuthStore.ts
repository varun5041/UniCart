import { create } from 'zustand';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { User, Address } from '../types';

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
  addAddress: (addr: Omit<Address, '_id' | 'id'>) => Promise<boolean>;
  deleteAddress: (addressLine: string) => Promise<boolean>;
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
          const user = userRes.data;
          const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0] || null;
          set({
            user,
            isAuthenticated: true,
            selectedAddress: defaultAddr,
            isInitialized: true
          });
          return;
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
        const userRes = await usersApi.getMe();
        const user = userRes.data;
        const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0] || null;
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
        const userRes = await usersApi.getMe();
        const user = userRes.data;
        const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0] || null;
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
      set({ isLoading: false });
      if (res.success) {
        return { success: true };
      }
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

  addAddress: async (addr) => {
    const { user } = get();
    if (!user) return false;
    const currentAddresses = user.addresses || [];
    const newAddresses: Address[] = [...currentAddresses, { ...addr, isDefault: currentAddresses.length === 0 }];
    try {
      const res = await usersApi.updateMe({ addresses: newAddresses });
      if (res.success) {
        set({
          user: res.data,
          selectedAddress: get().selectedAddress || newAddresses[0]
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteAddress: async (line1) => {
    const { user } = get();
    if (!user) return false;
    const filtered = (user.addresses || []).filter((a) => a.line1 !== line1);
    try {
      const res = await usersApi.updateMe({ addresses: filtered });
      if (res.success) {
        set({ user: res.data });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));
