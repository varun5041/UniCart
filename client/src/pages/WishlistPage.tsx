import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { ProductCard } from '../components/ProductCard';
import { getProductId } from '../types';

export const WishlistPage: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const ids = useWishlistStore((s) => s.ids);

  const { data = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await usersApi.getWishlist()).data ?? [],
    enabled: isAuthenticated
  });

  // Hide items removed on this page immediately, without waiting for a refetch
  const items = data.filter((p) => ids.includes(getProductId(p)));

  if (isInitialized && !isAuthenticated) {
    return (
      <Centered
        icon="favorite"
        title="Your wishlist lives in your account"
        text="Sign in to save products you love and find them here later."
        action={
          <Link to="/login" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700">
            Sign in
          </Link>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              <span className="material-symbols-outlined font-variation-fill text-3xl text-rose-500">favorite</span>
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} saved item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link to="/" className="text-sm font-bold text-brand-600 hover:text-brand-800">
            Continue shopping
          </Link>
        </div>

        {isLoading || !isInitialized ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/70" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Centered
            icon="heart_plus"
            title="No saved items yet"
            text="Tap the heart on any product to save it here."
            action={
              <Link to="/deals" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700">
                Explore deals
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={getProductId(p)} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Centered: React.FC<{ icon: string; title: string; text: string; action: React.ReactNode }> = ({
  icon,
  title,
  text,
  action
}) => (
  <div className="flex min-h-[50vh] items-center justify-center px-4">
    <div className="flex max-w-md flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </span>
      <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{text}</p>
      <div className="pt-2">{action}</div>
    </div>
  </div>
);
