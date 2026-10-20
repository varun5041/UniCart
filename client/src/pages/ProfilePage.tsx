import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { AddressForm } from '../components/AddressForm';

const MAX_ADDRESSES = 5;

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized, updateName, addAddress, deleteAddress, setDefaultAddress, logoutAll } =
    useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'account'>('profile');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const [prevUserName, setPrevUserName] = useState(user?.name);
  if (prevUserName !== user?.name) {
    setPrevUserName(user?.name);
    setName(user?.name || '');
  }

  if (isInitialized && !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface p-4">
        <div className="space-y-4 rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <h1 className="text-xl font-extrabold text-slate-900">Sign in to view your profile</h1>
          <Link to="/login" className="inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const addresses = user?.addresses || [];
  const email = user?.email || '';
  const trimmedName = name.trim();
  const nameError =
    trimmedName.length < 2 ? 'Name must be at least 2 characters' : trimmedName.length > 60 ? 'Name is too long' : '';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameError) return;
    setSavingName(true);
    const res = await updateName(trimmedName);
    setSavingName(false);
    addToast(
      res.success
        ? { type: 'success', title: 'Profile updated' }
        : { type: 'error', title: 'Could not update profile', message: res.error }
    );
  };

  const runAddressAction = async (index: number, action: () => Promise<{ success: boolean; error?: string }>, ok: string) => {
    setBusyIndex(index);
    const res = await action();
    setBusyIndex(null);
    addToast(res.success ? { type: 'success', title: ok } : { type: 'error', title: 'Something went wrong', message: res.error });
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    addToast({ type: 'info', title: 'Signed out on all devices' });
    navigate('/login');
  };

  const tabs = [
    { id: 'profile' as const, icon: 'person', label: 'Personal info' },
    { id: 'addresses' as const, icon: 'home_pin', label: `Saved addresses (${addresses.length})` },
    { id: 'account' as const, icon: 'devices', label: 'Sign-in & devices' }
  ];

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-2xl font-extrabold text-white shadow-lg shadow-brand-500/30">
            {(user?.name || email || 'U').charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{user?.name || 'My Account'}</h1>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === tab.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-xl rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
            <form onSubmit={handleUpdateProfile} noValidate className="space-y-4">
              <div>
                <label htmlFor="full-name-input" className="mb-1 block text-xs font-bold text-slate-700">
                  Full name
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(nameError)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                {nameError && <p className="mt-1 text-xs font-semibold text-rose-600">{nameError}</p>}
              </div>
              <div>
                <label htmlFor="account-email-input" className="mb-1 block text-xs font-bold text-slate-700">
                  Email address
                </label>
                <input
                  id="account-email-input"
                  type="email"
                  disabled
                  value={email}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingName || Boolean(nameError) || trimmedName === user?.name}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {savingName ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Delivery addresses</h2>
              {addresses.length < MAX_ADDRESSES && (
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
                >
                  <span className="material-symbols-outlined text-lg">{isAddingAddress ? 'close' : 'add'}</span>
                  {isAddingAddress ? 'Cancel' : 'Add address'}
                </button>
              )}
            </div>

            {isAddingAddress && (
              <div className="max-w-2xl rounded-3xl bg-white p-6 ring-1 ring-brand-200">
                <h3 className="mb-4 text-sm font-extrabold text-slate-900">New delivery address</h3>
                <AddressForm
                  onCancel={() => setIsAddingAddress(false)}
                  onSubmit={async (addr) => {
                    const res = await addAddress(addr);
                    if (res.success) {
                      setIsAddingAddress(false);
                      addToast({ type: 'success', title: 'Address saved' });
                    }
                    return res;
                  }}
                />
              </div>
            )}

            {addresses.length === 0 && !isAddingAddress ? (
              <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
                <span className="material-symbols-outlined text-5xl text-slate-300">location_off</span>
                <p className="mt-2 text-sm text-slate-500">You haven&apos;t saved any addresses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {addresses.map((addr, index) => (
                  <div
                    key={addr._id || `${addr.line1}-${addr.pincode}-${index}`}
                    className={`flex flex-col justify-between rounded-3xl bg-white p-5 ring-1 ${
                      addr.isDefault ? 'ring-2 ring-brand-300' : 'ring-slate-200/70'
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <span className="material-symbols-outlined text-lg text-brand-600">home</span>
                          Address {index + 1}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-slate-800">{addr.line1}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {addr.city}, {addr.state} – <strong className="text-slate-700">{addr.pincode}</strong>
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3 text-xs font-bold">
                      {!addr.isDefault && (
                        <button
                          disabled={busyIndex !== null}
                          onClick={() => void runAddressAction(index, () => setDefaultAddress(index), 'Default address updated')}
                          className="text-brand-600 hover:text-brand-800 disabled:opacity-50"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        disabled={busyIndex !== null}
                        onClick={() => void runAddressAction(index, () => deleteAddress(index), 'Address removed')}
                        className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                      >
                        {busyIndex === index ? 'Working…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {addresses.length >= MAX_ADDRESSES && (
              <p className="text-xs text-slate-500">You can save up to {MAX_ADDRESSES} addresses. Delete one to add another.</p>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="max-w-xl space-y-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span className="material-symbols-outlined text-xl text-brand-600">devices</span>
              Signed-in devices
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Signed in on a shared or lost device? Sign out everywhere, including this browser.
            </p>
            {confirmSignOut ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-rose-50 p-3">
                <span className="text-sm font-semibold text-rose-800">Sign out of all devices?</span>
                <button onClick={() => void handleLogoutAll()} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">
                  Yes, sign out
                </button>
                <button onClick={() => setConfirmSignOut(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmSignOut(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sign out of all devices
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
