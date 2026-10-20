import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useToastStore } from '../store/useToastStore';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  productName,
  variant = 'icon',
  className = ''
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const pending = useWishlistStore((s) => s.pending.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const addToast = useToastStore((s) => s.addToast);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast({ type: 'info', title: 'Sign in to save items', message: 'Your wishlist is saved to your account.' });
      navigate('/login');
      return;
    }

    const res = await toggle(productId);
    if (res.success) {
      void queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      addToast({
        type: res.added ? 'success' : 'info',
        title: res.added ? 'Saved to Wishlist' : 'Removed from Wishlist',
        message: productName.slice(0, 48)
      });
    } else if (res.error) {
      addToast({ type: 'error', title: 'Wishlist', message: res.error });
    }
  };

  const label = saved ? 'Remove from wishlist' : 'Add to wishlist';

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-colors disabled:opacity-60 ${
          saved
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-600'
        } ${className}`}
      >
        <span className={`material-symbols-outlined text-xl ${saved ? 'font-variation-fill' : ''}`}>favorite</span>
        <span>{saved ? 'Wishlisted' : 'Wishlist'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 backdrop-blur transition-transform hover:scale-110 disabled:opacity-60 ${
        saved ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
      } ${className}`}
    >
      <span className={`material-symbols-outlined text-[20px] ${saved ? 'font-variation-fill' : ''}`}>favorite</span>
    </button>
  );
};
