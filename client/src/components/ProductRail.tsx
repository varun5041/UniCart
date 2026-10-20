import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductQueryParams } from '../api/products';
import { ProductCard } from './ProductCard';
import { getProductId, type Product } from '../types';

interface ProductRailProps {
  title: string;
  subtitle?: string;
  icon?: string;
  accent?: string; // Tailwind classes for the icon chip
  query?: ProductQueryParams;
  /** Pre-fetched products (skips the query) */
  products?: Product[];
  seeAllHref?: string;
  /** Hide the rail entirely when it has no products */
  hideWhenEmpty?: boolean;
  excludeId?: string;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  title,
  subtitle,
  icon,
  accent = 'bg-brand-100 text-brand-700',
  query,
  products,
  seeAllHref,
  hideWhenEmpty = true,
  excludeId
}) => {
  const scroller = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'rail', query],
    queryFn: async () => {
      const res = await productsApi.getProducts({ limit: 12, ...query });
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    enabled: !products && Boolean(query)
  });

  const items = (products ?? data ?? []).filter((p) => !excludeId || getProductId(p) !== excludeId);
  const loading = !products && isLoading;

  if (!loading && items.length === 0 && hideWhenEmpty) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-6">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </span>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${title} left`}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 md:flex"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${title} right`}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 md:flex"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
          {seeAllHref && (
            <Link
              to={seeAllHref}
              className="ml-1 inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
            >
              See all
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          )}
        </div>
      </header>

      <div ref={scroller} className="scrollbar-none -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-[200px] shrink-0 animate-pulse space-y-3 sm:w-[228px]">
                <div className="aspect-square rounded-2xl bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
              </div>
            ))
          : items.map((p) => <ProductCard key={getProductId(p) || p.slug} product={p} compact />)}
        {!loading && items.length === 0 && (
          <p className="py-8 text-sm text-slate-500">Nothing here yet — check back soon.</p>
        )}
      </div>
    </section>
  );
};
