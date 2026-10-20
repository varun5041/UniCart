import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login, logout, isLoading, isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (isAuthenticated && user) {
    const destination = user.role === 'admin' ? '/admin' : '/';
    return (
      <div className="bg-[#FAF8FF] min-h-[85vh] flex items-center justify-center py-12 px-4 animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 max-w-md w-full shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700">
              Signed In as {user.role}
            </span>
            <h2 className="text-xl font-black text-slate-900">You already have an active account</h2>
            <p className="text-xs text-slate-500">
              Signed in as <strong>{user.name}</strong> ({user.email}).
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => navigate(destination)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">
                {user.role === 'admin' ? 'admin_panel_settings' : 'storefront'}
              </span>
              <span>{user.role === 'admin' ? 'Go to Admin Dashboard' : 'Continue Shopping'}</span>
            </button>

            <button
              onClick={async () => {
                await logout();
                addToast({
                  type: 'info',
                  title: 'Signed Out',
                  message: 'Signed out successfully. You can now register a new account.'
                });
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base text-slate-400">logout</span>
              <span>Sign Out &amp; Register New Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must have at least 8 characters.'
      });
      return;
    }

    if (password !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match.'
      });
      return;
    }

    const regRes = await register(name, email, password);
    if (!regRes.success) {
      setErrorMessage(regRes.error || 'Registration failed');
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: regRes.error || 'Failed to create user account'
      });
      return;
    }

    // Auto-login upon registration
    const loginRes = await login(email, password);
    if (loginRes.success) {
      addToast({
        type: 'success',
        title: 'Account Created 🎉',
        message: 'Welcome to UniCart! Your account is ready.'
      });
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 max-w-md w-full shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">UniCart</span>
          </Link>
          <h1 className="text-xl font-black text-slate-900">Create your account</h1>
          <p className="text-xs text-slate-500">
            Join thousands of shoppers for super-fast deals and tracked deliveries
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Varun Soni"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type your password"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 transition-colors shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create UniCart Account</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 tracking-wider">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <GoogleSignInButton />

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
