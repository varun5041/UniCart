import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login, isLoading } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      const msg = 'Full name must be at least 2 characters long.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (!hasMinLength) {
      const msg = 'Password must be at least 8 characters long.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (!hasUpper) {
      const msg = 'Password must contain at least one uppercase letter (A-Z).';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (!hasLower) {
      const msg = 'Password must contain at least one lowercase letter (a-z).';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (!hasNumber) {
      const msg = 'Password must contain at least one number (0-9).';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: msg
      });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        message: msg
      });
      return;
    }

    const regRes = await register(cleanName, cleanEmail, password);
    if (!regRes.success) {
      const failureMsg = regRes.error || 'Registration failed';
      setErrorMessage(failureMsg);
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: failureMsg
      });
      return;
    }

    // Auto-login upon registration
    const loginRes = await login(cleanEmail, password);
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
    <div className="bg-surface min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 max-w-md w-full shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src="/logo.png" alt="UniCart" className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" />
          </Link>
          <h1 className="text-xl font-black text-slate-900">Create your account</h1>
          <p className="text-xs text-slate-500">
            Join thousands of shoppers for super-fast deals and tracked deliveries
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 shadow-xs">
            <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">error</span>
            <span className="font-semibold">{errorMessage}</span>
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
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Varun Soni"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-600 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="you@domain.com"
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-600 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter a secure password"
                className="w-full px-4 py-3 pr-10 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-600 transition-colors shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Dynamic Password Requirements Checklist */}
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
              <div className="font-bold text-slate-600 text-[10px] uppercase tracking-wider mb-1">
                Password Requirements:
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-xs">
                    {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-xs">
                    {hasUpper ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-xs">
                    {hasLower ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 lowercase (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-xs">
                    {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>1 number (0-9)</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Re-type your password"
                className="w-full px-4 py-3 pr-10 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-600 transition-colors shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-base">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${isMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span className="material-symbols-outlined text-xs">
                  {isMatch ? 'check_circle' : 'cancel'}
                </span>
                {isMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
