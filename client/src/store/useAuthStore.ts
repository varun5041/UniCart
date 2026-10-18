import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Address } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  tokenVersion: number;
  failedLoginAttempts: number;
  isLockedOut: boolean;
  lockoutRemainingSeconds: number;
  addresses: Address[];
  selectedAddressId: string | null;

  login: (email: string, pass: string) => { success: boolean; error?: string };
  loginDemo: (role?: 'customer' | 'admin') => void;
  logout: () => void;
  logoutAllDevices: () => void;
  triggerLockoutDemo: () => void;
  resetLockout: () => void;

  addAddress: (addr: Omit<Address, 'id'>) => Address;
  updateAddress: (id: string, addr: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  setSelectedAddress: (id: string) => void;
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'addr-001',
    line1: 'Flat 402, Sunshine Heights, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    country: 'India',
    isDefault: true
  },
  {
    id: 'addr-002',
    line1: 'Tower B - 1204, Tech Park Residency, Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    country: 'India',
    isDefault: false
  }
];

const DEFAULT_USER: User = {
  id: 'user-001',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  role: 'customer',
  addresses: DEFAULT_ADDRESSES
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      isAuthenticated: true,
      tokenVersion: 1,
      failedLoginAttempts: 0,
      isLockedOut: false,
      lockoutRemainingSeconds: 0,
      addresses: DEFAULT_ADDRESSES,
      selectedAddressId: 'addr-001',

      login: (email, pass) => {
        const { isLockedOut, failedLoginAttempts } = get();
        if (isLockedOut) {
          return {
            success: false,
            error: 'Account temporarily locked due to excessive failed attempts. Please wait 15 minutes.'
          };
        }

        // Demo credential check
        if (email === 'admin@unicart.in' && pass === 'Admin@12345') {
          const adminUser: User = {
            id: 'admin-001',
            name: 'Priya Patel (Admin)',
            email: 'admin@unicart.in',
            role: 'admin',
            addresses: DEFAULT_ADDRESSES
          };
          set({
            user: adminUser,
            isAuthenticated: true,
            failedLoginAttempts: 0,
            isLockedOut: false
          });
          return { success: true };
        }

        if (email === 'customer@unicart.in' && pass === 'Customer@12345') {
          set({
            user: DEFAULT_USER,
            isAuthenticated: true,
            failedLoginAttempts: 0,
            isLockedOut: false
          });
          return { success: true };
        }

        // Any custom user login simulation
        if (pass.length >= 8) {
          const customUser: User = {
            id: `usr-${Date.now()}`,
            name: email.split('@')[0].replace('.', ' '),
            email,
            role: 'customer',
            addresses: get().addresses
          };
          set({
            user: customUser,
            isAuthenticated: true,
            failedLoginAttempts: 0,
            isLockedOut: false
          });
          return { success: true };
        }

        // Incorrect password handling -> increment failure count
        const newAttempts = failedLoginAttempts + 1;
        if (newAttempts >= 5) {
          set({
            failedLoginAttempts: newAttempts,
            isLockedOut: true,
            lockoutRemainingSeconds: 900 // 15 mins
          });
          return {
            success: false,
            error: '5 consecutive failed attempts. Your account has been locked for 15 minutes.'
          };
        } else {
          set({ failedLoginAttempts: newAttempts });
          return {
            success: false,
            error: `Invalid credentials. Attempt ${newAttempts} of 5 before account lock.`
          };
        }
      },

      loginDemo: (role = 'customer') => {
        if (role === 'admin') {
          const adminUser: User = {
            id: 'admin-001',
            name: 'Priya Patel (Store Admin)',
            email: 'admin@unicart.in',
            role: 'admin',
            addresses: DEFAULT_ADDRESSES
          };
          set({
            user: adminUser,
            isAuthenticated: true,
            failedLoginAttempts: 0,
            isLockedOut: false
          });
        } else {
          set({
            user: DEFAULT_USER,
            isAuthenticated: true,
            failedLoginAttempts: 0,
            isLockedOut: false
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false
        });
      },

      logoutAllDevices: () => {
        set((state) => ({
          user: null,
          isAuthenticated: false,
          tokenVersion: state.tokenVersion + 1
        }));
      },

      triggerLockoutDemo: () => {
        set({
          failedLoginAttempts: 5,
          isLockedOut: true,
          lockoutRemainingSeconds: 894
        });
      },

      resetLockout: () => {
        set({
          failedLoginAttempts: 0,
          isLockedOut: false,
          lockoutRemainingSeconds: 0
        });
      },

      addAddress: (addrData) => {
        const id = `addr-${Date.now()}`;
        const newAddress: Address = {
          ...addrData,
          id,
          isDefault: addrData.isDefault || get().addresses.length === 0
        };

        set((state) => {
          let updated = [...state.addresses];
          if (newAddress.isDefault) {
            updated = updated.map((a) => ({ ...a, isDefault: false }));
          }
          return {
            addresses: [...updated, newAddress],
            selectedAddressId: newAddress.isDefault ? id : state.selectedAddressId
          };
        });
        return newAddress;
      },

      updateAddress: (id, updated) => {
        set((state) => {
          let addresses = state.addresses.map((a) => (a.id === id ? { ...a, ...updated } : a));
          if (updated.isDefault) {
            addresses = addresses.map((a) => (a.id === id ? a : { ...a, isDefault: false }));
          }
          return { addresses };
        });
      },

      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          const newSelected = state.selectedAddressId === id ? (filtered[0]?.id || null) : state.selectedAddressId;
          return { addresses: filtered, selectedAddressId: newSelected };
        });
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
          selectedAddressId: id
        }));
      },

      setSelectedAddress: (id) => {
        set({ selectedAddressId: id });
      }
    }),
    {
      name: 'unicart-auth-storage'
    }
  )
);
