import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategoryTiles } from '../components/CategoryTiles';
import { ProductRail } from '../components/ProductRail';
import { getCategoryStyle, useCategories } from '../lib/categories';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import type { Category } from '../types';

const RAIL_ACCENTS = [
  'bg-sky-100 text-sky-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-lime-100 text-lime-700'
];

const HeroBanner: React.FC = () => (
  <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-3 lg:px-8">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-fuchsia-500 p-7 text-white shadow-xl shadow-brand-900/20 sm:p-10 lg:col-span-2">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-fuchsia-300/20" />
      <img
        src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 right-0 hidden h-full w-1/2 object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)] md:block"
      />
      <div className="relative max-w-md space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
          <span className="material-symbols-outlined text-sm">celebration</span>
          Festive Sale is live
        </span>
        <h1 className="text-3xl font-extrabold leading-[1.1] sm:text-5xl">
          Everything you love, <span className="text-amber-300">for less.</span>
        </h1>
        <p className="text-sm text-white/85 sm:text-base">
          Top brands across electronics, fashion, home and more — with fresh deals every day.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            View Deals
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
          <Link
            to="/search?sort=popular"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25"
          >
            Shop Bestsellers
          </Link>
        </div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <Link
        to="/deals?minDiscount=50"
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 p-6 text-white shadow-lg shadow-rose-900/10"
      >
        <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[110px] text-white/20 transition-transform group-hover:scale-110">
          local_offer
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Clearance</p>
        <p className="mt-1 text-2xl font-extrabold">50% off & more</p>
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
          Grab now <span className="material-symbols-outlined text-base">arrow_forward</span>
        </p>
      </Link>
      <Link
        to="/search?sort=newest"
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 p-6 text-white shadow-lg shadow-teal-900/10"
      >
        <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[110px] text-white/20 transition-transform group-hover:scale-110">
          local_shipping
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Free delivery</p>
        <p className="mt-1 text-2xl font-extrabold">On orders over ₹500</p>
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
          New arrivals <span className="material-symbols-outlined text-base">arrow_forward</span>
        </p>
      </Link>
    </div>
  </section>
);

/** Recommendations are drawn from the category of the shopper's most recent wishlist item. */
function useRecommendationCategory(): Category | null {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasWishlist = useWishlistStore((s) => s.ids.length > 0);
  const { data } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await usersApi.getWishlist()).data ?? [],
    enabled: isAuthenticated && hasWishlist
  });
  const first = data?.[0]?.category;
  return first && typeof first === 'object' ? first : null;
}

export const HomePage: React.FC = () => {
  const { data: categories = [] } = useCategories();
  const recoCategory = useRecommendationCategory();

  return (
    <div className="min-h-screen bg-surface pb-16">
      <HeroBanner />

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <CategoryTiles />

        <ProductRail
          title="Recommended for you"
          subtitle={recoCategory ? `Because you liked ${getCategoryStyle(recoCategory).short}` : 'Handpicked premium picks'}
          icon="auto_awesome"
          accent="bg-brand-100 text-brand-700"
          query={
            recoCategory
              ? { category: recoCategory.slug, sort: 'popular', inStock: true }
              : { sort: 'price_desc', inStock: true }
          }
          seeAllHref={recoCategory ? `/category/${recoCategory.slug}` : '/search?sort=price_desc'}
        />

        <ProductRail
          title="Top Deals"
          subtitle="Biggest discounts right now"
          icon="local_fire_department"
          accent="bg-orange-100 text-orange-600"
          query={{ onSale: true, sort: 'discount' }}
          seeAllHref="/deals"
        />

        <ProductRail
          title="Most Selling"
          subtitle="What everyone is buying"
          icon="trending_up"
          accent="bg-rose-100 text-rose-600"
          query={{ sort: 'popular' }}
          seeAllHref="/search?sort=popular"
        />

        {categories.map((cat, i) => {
          const style = getCategoryStyle(cat);
          return (
            <ProductRail
              key={cat.slug}
              title={`Best in ${style.short}`}
              icon={style.icon}
              accent={RAIL_ACCENTS[i % RAIL_ACCENTS.length]}
              query={{ category: cat.slug, sort: 'popular' }}
              seeAllHref={`/category/${cat.slug}`}
            />
          );
        })}

        <ProductRail
          title="New Arrivals"
          subtitle="Fresh in the store"
          icon="new_releases"
          accent="bg-teal-100 text-teal-700"
          query={{ sort: 'newest' }}
          seeAllHref="/search?sort=newest"
        />
      </div>
    </div>
  );
};
