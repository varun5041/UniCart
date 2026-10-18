import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-sky-500', text: 'text-sky-600' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-slate-200', text: 'text-slate-400' };
    }
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      addToast({
        type: 'error',
        title: 'Weak Password',
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

    if (!agreed) {
      addToast({
        type: 'error',
        title: 'Agreement Required',
        message: 'Please agree to terms and privacy policy.'
      });
      return;
    }

    // Register & Login simulation
    login(email, password);
    addToast({
      type: 'success',
      title: 'Account Created! 🎉',
      message: `Welcome to UniCart, ${name}!`
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
          <h1 className="text-xl font-black text-slate-900">Create your UniCart account</h1>
          <p className="text-xs text-slate-500">
            Join thousands of shoppers enjoying verified tech products and express pan-India delivery
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="register-full-name-input" className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
            <input
              id="register-full-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="register-email-input" className="block text-slate-700 font-bold mb-1">Email Address</label>
            <input
              id="register-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vikram@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="register-password-input" className="block text-slate-700 font-bold mb-1">Password</label>
            <input
              id="register-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters with numbers & symbols"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
            />

            {/* Password Strength Indicator (Stitch Screen 4) */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Strength:</span>
                  <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="register-confirm-password-input" className="block text-slate-700 font-bold mb-1">Confirm Password</label>
            <input
              id="register-confirm-password-input"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
            />
            <span className="text-slate-600 leading-tight text-[11px]">
              I agree to the <Link to="/" className="text-indigo-600 font-semibold">Terms of Service</Link> and{' '}
              <Link to="/" className="text-indigo-600 font-semibold">Privacy Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            Create UniCart Account
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
