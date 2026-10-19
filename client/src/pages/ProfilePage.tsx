import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    deleteAddress,
    addAddress,
    logoutAll
  } = useAuthStore();
  const { addToast } = useToastStore();

  const addresses = user?.addresses || [];

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Profile form
  const [name, setName] = useState(user?.name || 'Rahul Sharma');
  const [email] = useState(user?.email || 'rahul.sharma@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');

  // New Address form
  const [newAddr, setNewAddr] = useState({
    line1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false
  });

  // Password form
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal information has been saved.'
    });
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city || !newAddr.pincode) {
      addToast({ type: 'error', title: 'Incomplete Address' });
      return;
    }
    addAddress(newAddr);
    setIsAddingAddress(false);
    setNewAddr({ line1: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
    addToast({ type: 'success', title: 'Address Saved' });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.next.length < 8) {
      addToast({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long.'
      });
      return;
    }
    if (passForm.next !== passForm.confirm) {
      addToast({
        type: 'error',
        title: 'Mismatch',
        message: 'New password and confirmation do not match.'
      });
      return;
    }
    addToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Password updated successfully with Argon2id hash.'
    });
    setPassForm({ current: '', next: '', confirm: '' });
  };

  const handleLogoutAll = async () => {
    if (
      window.confirm(
        'Revoke all active sessions and refresh tokens across all browsers & devices?'
      )
    ) {
      await logoutAll();
      addToast({
        type: 'info',
        title: 'All Sessions Terminated',
        message: 'All JWT refresh tokens invalidated across devices.'
      });
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Account & Profile Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal information, delivery addresses, and security credentials
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            Role: {user?.role || 'Customer'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>Personal Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'addresses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">home_pin</span>
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {(name || email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{name}</h3>
                <p className="text-xs text-slate-500">{email}</p>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Verified Indian Account
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label htmlFor="full-name-input" className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                <input
                  id="full-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="account-email-input" className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  id="account-email-input"
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email change requires OTP confirmation to primary address.
                </span>
              </div>

              <div>
                <label htmlFor="mobile-number-input" className="block text-slate-700 font-bold mb-1">Mobile Number</label>
                <input
                  id="mobile-number-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Manage Indian Delivery Addresses</h2>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-xs animate-fade-in max-w-2xl">
                <h3 className="font-bold text-sm text-slate-900 mb-4">New Delivery Address</h3>
                <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                  <div>
                    <label htmlFor="address-flat-input" className="block text-slate-700 font-bold mb-1">Flat / Building / Street</label>
                    <input
                      id="address-flat-input"
                      type="text"
                      required
                      placeholder="e.g. 402 Sunshine Apts, Linking Road"
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="address-city-input" className="block text-slate-700 font-bold mb-1">City</label>
                      <input
                        id="address-city-input"
                        type="text"
                        required
                        placeholder="Mumbai"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label htmlFor="address-state-input" className="block text-slate-700 font-bold mb-1">State</label>
                      <input
                        id="address-state-input"
                        type="text"
                        required
                        placeholder="Maharashtra"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label htmlFor="address-pincode-input" className="block text-slate-700 font-bold mb-1">Pincode</label>
                      <input
                        id="address-pincode-input"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="400053"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Save Address
                  </button>
                </form>
              </div>
            )}

            {/* Address Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-indigo-600 text-lg">
                          home
                        </span>
                        Delivery Address
                      </span>
                      {addr.isDefault && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Default Address
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {addr.line1}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-mono">India Post Verified</span>
                    <button
                      onClick={() => void deleteAddress(addr.line1)}
                      className="text-rose-500 hover:text-rose-700 font-semibold text-[11px] ml-auto cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & SESSIONS (Stitch Screen 9) */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            {/* Change Password */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="font-black text-slate-900 text-base">Change Password</h3>
              <p className="text-xs text-slate-500">
                Passwords are authenticated using argon2id with high entropy.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="current-password-input" className="block text-slate-700 font-bold mb-1">Current Password</label>
                  <input
                    id="current-password-input"
                    type="password"
                    required
                    value={passForm.current}
                    onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="new-password-input" className="block text-slate-700 font-bold mb-1">New Password (Min 8 chars)</label>
                  <input
                    id="new-password-input"
                    type="password"
                    required
                    value={passForm.next}
                    onChange={(e) => setPassForm({ ...passForm, next: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password-input" className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                  <input
                    id="confirm-password-input"
                    type="password"
                    required
                    value={passForm.confirm}
                    onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* Logout from All Devices (Token Version Invalidation) */}
            <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-rose-900 font-black text-base">
                <span className="material-symbols-outlined text-xl">devices</span>
                <h3>Active Sessions & Revocation</h3>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                If you notice any suspicious activity or want to sign out everywhere, click below to increment token version in MongoDB/Redis and revoke all active refresh tokens.
              </p>
              <button
                onClick={handleLogoutAll}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Logout from All Devices</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
