import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productsApi, type ProductQueryParams, type ProductSort } from '../api/products';
import { getCategoryStyle, useCategories } from '../lib/categories';
import { getProductId } from '../types';
import { ProductCard } from './ProductCard';
import { ProductListItem } from './ProductListItem';

const PAGE_SIZE = 24;

const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: 'popular', label: 'Popularity' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest discount' }
];

const PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Under ₹500', max: 500 },
  { label: '₹500 – ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 – ₹10,000', min: 2000, max: 10000 },
  { label: 'Over ₹10,000', min: 10000 }
];

const DISCOUNT_OPTIONS = [10, 25, 40, 50, 70];

function readInt(value: string | null, min: number, max: number): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
}

interface ProductListingProps {
  title: string;
  subtitle?: string;
  layout: 'list' | 'grid';
  /** Locked filters that the URL cannot override (e.g. a category page's slug) */
  fixed?: Pick<ProductQueryParams, 'category' | 'onSale'>;
  defaultSort?: ProductSort;
  hero?: React.ReactNode;
}

export const ProductListing: React.FC<ProductListingProps> = ({
  title,
  subtitle,
  layout,
  fixed = {},
  defaultSort = 'popular',
  hero
}) => {
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // --- Parse & sanitize URL state -------------------------------------------------
  const q = (params.get('q') || '').trim().slice(0, 100);
  const category = fixed.category ?? (params.get('category') || undefined);
  let minPrice = readInt(params.get('minPrice'), 0, 10_000_000);
  let maxPrice = readInt(params.get('maxPrice'), 0, 10_000_000);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  const minDiscount = readInt(params.get('minDiscount'), 1, 90);
  const inStock = params.get('inStock') === '1';
  const sortParam = params.get('sort') as ProductSort | null;
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as ProductSort) : defaultSort;
  const page = readInt(params.get('page'), 1, 1000) ?? 1;

  const priceKey = `${minPrice ?? ''}|${maxPrice ?? ''}`;
  const [priceDraft, setPriceDraft] = useState({ min: minPrice?.toString() ?? '', max: maxPrice?.toString() ?? '' });
  const [prevPriceKey, setPrevPriceKey] = useState(priceKey);
  if (prevPriceKey !== priceKey) {
    setPrevPriceKey(priceKey);
    setPriceDraft({ min: minPrice?.toString() ?? '', max: maxPrice?.toString() ?? '' });
  }

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const query: ProductQueryParams = {
    page,
    limit: PAGE_SIZE,
    q: q || undefined,
    category,
    sort,
    minPrice: minPrice !== undefined ? minPrice * 100 : undefined,
    maxPrice: maxPrice !== undefined ? maxPrice * 100 : undefined,
    minDiscount,
    onSale: fixed.onSale,
    inStock
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['products', 'listing', query],
    queryFn: async () => {
      const res = await productsApi.getProducts(query);
      return { items: res.data ?? [], total: res.meta?.total ?? 0, pages: res.meta?.pages ?? 1 };
    },
    placeholderData: keepPreviousData
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const activeChips: Array<{ label: string; clear: Record<string, undefined> }> = [];
  if (q) activeChips.push({ label: `“${q}”`, clear: { q: undefined } });
  if (!fixed.category && category) {
    const cat = categories.find((c) => c.slug === category);
    activeChips.push({ label: cat ? getCategoryStyle(cat).short : category, clear: { category: undefined } });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const label =
      minPrice !== undefined && maxPrice !== undefined
        ? `₹${minPrice.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}`
        : minPrice !== undefined
          ? `Over ₹${minPrice.toLocaleString('en-IN')}`
          : `Under ₹${maxPrice!.toLocaleString('en-IN')}`;
    activeChips.push({ label, clear: { minPrice: undefined, maxPrice: undefined } });
  }
  if (minDiscount) activeChips.push({ label: `${minDiscount}%+ off`, clear: { minDiscount: undefined } });
  if (inStock) activeChips.push({ label: 'In stock', clear: { inStock: undefined } });

  const clearAll = () => {
    const next = new URLSearchParams();
    if (params.get('sort')) next.set('sort', params.get('sort')!);
    setParams(next);
  };

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = readInt(priceDraft.min, 0, 10_000_000);
    const max = readInt(priceDraft.max, 0, 10_000_000);
    update({ minPrice: min?.toString(), maxPrice: max?.toString() });
  };

  const filterPanel = (
    <div className="space-y-6 text-sm">
      {!fixed.category && categories.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">Category</legend>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const style = getCategoryStyle(cat);
              const active = category === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => update({ category: active ? undefined : cat.slug })}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    active ? 'bg-brand-50 font-bold text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${style.gradient} text-white`}>
                    <span className="material-symbols-outlined text-base">{style.icon}</span>
                  </span>
                  <span className="truncate">{style.short}</span>
                  {active && <span className="material-symbols-outlined ml-auto text-base">check</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">Price</legend>
        <div className="space-y-1">
          {PRICE_PRESETS.map((p) => {
            const active = minPrice === p.min && maxPrice === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  update(
                    active
                      ? { minPrice: undefined, maxPrice: undefined }
                      : { minPrice: p.min?.toString(), maxPrice: p.max?.toString() }
                  )
                }
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  active ? 'bg-brand-50 font-bold text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={applyPrice} className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="₹ Min"
            aria-label="Minimum price in rupees"
            value={priceDraft.min}
            onChange={(e) => setPriceDraft({ ...priceDraft, min: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="₹ Max"
            aria-label="Maximum price in rupees"
            value={priceDraft.max}
            onChange={(e) => setPriceDraft({ ...priceDraft, max: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
            Go
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">Discount</legend>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_OPTIONS.map((d) => {
            const active = minDiscount === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => update({ minDiscount: active ? undefined : String(d) })}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {d}%+ off
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-slate-700">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => update({ inStock: e.target.checked ? '1' : undefined })}
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          Show in-stock items only
        </label>
      </fieldset>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-16">
      {hero}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-start gap-6">
          {/* Desktop filters */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 overflow-y-auto rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 lg:block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                <span className="material-symbols-outlined text-xl text-brand-600">tune</span>
                Filters
              </h2>
              {activeChips.length > 0 && (
                <button type="button" onClick={clearAll} className="text-xs font-bold text-brand-600 hover:text-brand-800">
                  Clear all
                </button>
              )}
            </div>
            {filterPanel}
          </aside>

          <main className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
                <p className="text-sm text-slate-500">
                  {isLoading ? 'Searching…' : `${total.toLocaleString('en-IN')} result${total === 1 ? '' : 's'}`}
                  {subtitle ? ` · ${subtitle}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 lg:hidden"
                >
                  <span className="material-symbols-outlined text-lg">tune</span>
                  Filters
                  {activeChips.length > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 text-[11px] text-white">{activeChips.length}</span>
                  )}
                </button>
                <label htmlFor="listing-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="listing-sort"
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value })}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-brand-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => update(chip.clear)}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
                  >
                    {chip.label}
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className={layout === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/70 ${layout === 'grid' ? 'aspect-[3/4]' : 'h-40'}`} />
                ))}
              </div>
            ) : isError ? (
              <EmptyState icon="cloud_off" title="Couldn't load products" text="Please check your connection and try again." />
            ) : items.length === 0 ? (
              <EmptyState
                icon="search_off"
                title={q ? `No results for “${q}”` : 'No products match these filters'}
                text="Try a different keyword, or remove some filters."
                action={
                  activeChips.length > 0 ? (
                    <button type="button" onClick={clearAll} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                      Clear filters
                    </button>
                  ) : (
                    <Link to="/" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                      Back to home
                    </Link>
                  )
                }
              />
            ) : (
              <div className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {layout === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {items.map((p) => (
                      <ProductCard key={getProductId(p) || p.slug} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((p) => (
                      <ProductListItem key={getProductId(p) || p.slug} product={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {pages > 1 && items.length > 0 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                  Previous
                </button>
                <span className="px-3 text-sm font-semibold text-slate-600">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => update({ page: String(page + 1) })}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-slate-900/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-base font-extrabold text-slate-900">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close filters">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
            <div className="flex gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={clearAll} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700">
                Clear all
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white">
                Show {total.toLocaleString('en-IN')} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ icon: string; title: string; text: string; action?: React.ReactNode }> = ({
  icon,
  title,
  text,
  action
}) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200/70">
    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </span>
    <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
    <p className="max-w-sm text-sm text-slate-500">{text}</p>
    {action && <div className="pt-2">{action}</div>}
  </div>
);
