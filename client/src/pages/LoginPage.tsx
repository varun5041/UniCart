import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginDemo, isLockedOut, resetLockout, triggerLockoutDemo } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('Customer@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = login(email, password);
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Successfully logged in to UniCart.'
      });
      navigate('/');
    } else {
      setErrorMessage(res.error || 'Login failed.');
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: res.error
      });
    }
  };

  const handleDemoLogin = (role: 'customer' | 'admin') => {
    loginDemo(role);
    addToast({
      type: 'success',
      title: 'Demo Session Active',
      message: `Signed in as ${role === 'admin' ? 'Store Admin' : 'Buyer Rahul'}.`
    });
    navigate('/');
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
          <h1 className="text-xl font-black text-slate-900">Sign in to your account</h1>
          <p className="text-xs text-slate-500">
            Access your orders, saved addresses, and wishlisted items
          </p>
        </div>

        {/* STITCH SCREEN 5: ACCOUNT LOCKOUT ALERT STATE */}
        {isLockedOut && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs space-y-3 animate-shake">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-600 text-xl shrink-0">
                lock_clock
              </span>
              <div>
                <h4 className="font-bold text-rose-950">Account Temporarily Locked</h4>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  Too many consecutive failed login attempts. Your account has been secured for 15 minutes to protect against brute-force attacks (OWASP A07:2021).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-rose-200">
              <span className="font-mono font-bold text-rose-900">Lockout: ~14:48 remaining</span>
              <button
                onClick={resetLockout}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors"
              >
                Reset Lockout (Demo)
              </button>
            </div>
          </div>
        )}

        {errorMessage && !isLockedOut && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="login-email-input" className="block text-slate-700 font-bold mb-1">Email Address</label>
            <input
              id="login-email-input"
              type="email"
              required
              disabled={isLockedOut}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-password-input" className="text-slate-700 font-bold">Password</label>
              <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLockedOut}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLockedOut}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sign In to UniCart
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Or Sign In with 1-Click Demo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
            >
              Demo Buyer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="py-2 px-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors"
            >
              Demo Admin
            </button>
          </div>

          <button
            type="button"
            onClick={triggerLockoutDemo}
            className="w-full py-1.5 text-[11px] text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 rounded-lg border border-amber-200 transition-colors"
          >
            ⚡ Test Stitch Screen 5: Trigger Account Lockout
          </button>
        </div>

        {/* Link to Register */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
