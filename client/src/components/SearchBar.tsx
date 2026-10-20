import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { getCategoryStyle, useCategories } from '../lib/categories';
import { formatRupees, getPricing, type Category, type Product } from '../types';
import { PLACEHOLDER_IMAGE } from './ProductCard';

const MAX_QUERY_LENGTH = 100;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type Suggestion =
  | { kind: 'query'; label: string }
  | { kind: 'category'; category: Category }
  | { kind: 'product'; product: Product };

export const SearchBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const urlQuery = location.pathname === '/search' ? params.get('q') || '' : '';
  const [text, setText] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Keep the box in sync when navigating between searches
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setText(urlQuery);
  }

  const term = useDebounced(text.trim(), 250);
  const { data: categories = [] } = useCategories();
  const { data: products = [], isFetching } = useQuery({
    queryKey: ['products', 'suggest', term],
    queryFn: async () => (await productsApi.getProducts({ q: term, limit: 6, sort: 'popular' })).data ?? [],
    enabled: open && term.length >= 2,
    staleTime: 60_000
  });

  const lower = term.toLowerCase();
  const suggestions: Suggestion[] = [];
  if (term) suggestions.push({ kind: 'query', label: term });
  if (term.length >= 1) {
    categories
      .filter((c) => c.name.toLowerCase().includes(lower) || c.slug.includes(lower))
      .slice(0, 3)
      .forEach((category) => suggestions.push({ kind: 'category', category }));
  }
  if (term.length >= 2) products.forEach((product) => suggestions.push({ kind: 'product', product }));

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (s: Suggestion | null) => {
    setOpen(false);
    setActive(-1);
    if (!s || s.kind === 'query') {
      const q = (s?.label ?? text).trim().slice(0, MAX_QUERY_LENGTH);
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    } else if (s.kind === 'category') {
      navigate(`/category/${s.category.slug}`);
    } else {
      navigate(`/product/${s.product.slug}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const showPanel = open && term.length > 0;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(active >= 0 ? suggestions[active] : null);
        }}
        className="flex items-center rounded-2xl bg-slate-100 ring-1 ring-transparent transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500"
      >
        <span className="material-symbols-outlined pl-3.5 text-xl text-slate-400">search</span>
        <input
          type="search"
          value={text}
          maxLength={MAX_QUERY_LENGTH}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for products, brands and more"
          aria-label="Search products"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => {
              setText('');
              setOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
        <button
          type="submit"
          className="mr-1 h-9 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl bg-white py-2 shadow-2xl ring-1 ring-slate-200"
        >
          {suggestions.map((s, i) => {
            const isActive = i === active;
            const base = `flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm ${isActive ? 'bg-brand-50' : 'hover:bg-slate-50'}`;
            if (s.kind === 'query') {
              return (
                <li key="q" role="option" aria-selected={isActive} className={base} onMouseDown={(e) => e.preventDefault()} onClick={() => go(s)}>
                  <span className="material-symbols-outlined text-lg text-slate-400">search</span>
                  <span className="text-slate-700">
                    Search for <strong className="text-slate-900">“{s.label}”</strong>
                  </span>
                </li>
              );
            }
            if (s.kind === 'category') {
              const style = getCategoryStyle(s.category);
              return (
                <li key={`c-${s.category.slug}`} role="option" aria-selected={isActive} className={base} onMouseDown={(e) => e.preventDefault()} onClick={() => go(s)}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.gradient} text-white`}>
                    <span className="material-symbols-outlined text-lg">{style.icon}</span>
                  </span>
                  <span className="text-slate-700">
                    in <strong className="text-slate-900">{s.category.name}</strong>
                  </span>
                </li>
              );
            }
            const { price, discount } = getPricing(s.product);
            return (
              <li key={`p-${s.product.slug}`} role="option" aria-selected={isActive} className={base} onMouseDown={(e) => e.preventDefault()} onClick={() => go(s)}>
                <img src={s.product.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 object-cover" />
                <span className="min-w-0 flex-1 truncate text-slate-800">{s.product.name}</span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold text-slate-900">{formatRupees(price)}</span>
                  {discount > 0 && <span className="block text-[11px] font-bold text-emerald-600">{discount}% off</span>}
                </span>
              </li>
            );
          })}
          {term.length >= 2 && isFetching && products.length === 0 && (
            <li className="px-4 py-2.5 text-xs text-slate-400">Looking for matches…</li>
          )}
          <li className="mt-1 border-t border-slate-100 px-4 pt-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Advanced search with filters
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
