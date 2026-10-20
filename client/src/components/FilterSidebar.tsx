import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '../store/useFilterStore';
import { productsApi } from '../api/products';
import type { Category } from '../types';

export const FilterSidebar: React.FC = () => {
  const {
    selectedCategory,
    setCategory,
    minPrice,
    maxPrice,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    minRating,
    setMinRating,
    resetFilters,
    activeFilterCount
  } = useFilterStore();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await productsApi.getCategories();
        return res.success && Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  });

  const categories: Category[] = categoriesData || [];

  const [localMin, setLocalMin] = useState(minPrice === 0 ? '' : minPrice.toString());
  const [localMax, setLocalMax] = useState(maxPrice === 150000 ? '' : maxPrice.toString());

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = localMin ? parseInt(localMin, 10) : 0;
    const max = localMax ? parseInt(localMax, 10) : 150000;
    setPriceRange(min, max);
  };

  const setPresetPrice = (min: number, max: number) => {
    setLocalMin(min.toString());
    setLocalMax(max.toString());
    setPriceRange(min, max);
  };

  const filterCount = activeFilterCount();

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-xl">tune</span>
          <h2 className="font-bold text-slate-900 text-base">Filters</h2>
          {filterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {filterCount}
            </span>
          )}
        </div>
        {filterCount > 0 && (
          <button
            onClick={() => {
              resetFilters();
              setLocalMin('');
              setLocalMax('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Categories
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-base text-slate-400">
                apps
              </span>
              <span className="truncate">All Categories</span>
            </div>
          </button>

          {categories.length === 0 ? (
            <p className="text-[11px] text-slate-400 px-3 py-1.5 italic">
              No categories listed yet
            </p>
          ) : (
            categories.map((cat) => {
              const catIdentifier = cat.slug || cat._id || cat.name;
              const isSelected = selectedCategory === catIdentifier || selectedCategory === cat.slug;

              return (
                <button
                  key={cat._id || cat.slug || cat.name}
                  onClick={() => setCategory(cat.slug || cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-base text-slate-400">
                      {cat.icon || 'category'}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Price Range (₹)
        </h3>
        <form onSubmit={handleApplyPrice} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="min-price-input" className="block text-[11px] text-slate-600 font-medium mb-1">Min Price (₹)</label>
              <input
                id="min-price-input"
                type="number"
                placeholder="₹ Min"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label htmlFor="max-price-input" className="block text-[11px] text-slate-600 font-medium mb-1">Max Price (₹)</label>
              <input
                id="max-price-input"
                type="number"
                placeholder="₹ Max"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPresetPrice(0, 2000)}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Under ₹2K
            </button>
            <button
              type="button"
              onClick={() => setPresetPrice(2000, 5000)}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              ₹2K - ₹5K
            </button>
            <button
              type="button"
              onClick={() => setPresetPrice(5000, 30000)}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              ₹5K - ₹30K
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            Apply Price
          </button>
        </form>
      </div>


      {/* Availability Filter */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Availability
        </h3>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="font-medium">Exclude Out of Stock items</span>
        </label>
      </div>

      {/* Customer Rating Filter */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Customer Rating
        </h3>
        <div className="space-y-2">
          {[4, 3].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="rating-filter"
                checked={minRating === rating}
                onChange={() => setMinRating(minRating === rating ? 0 : rating)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <span className="font-semibold">{rating}★ & above</span>
              </div>
            </label>
          ))}
          {minRating > 0 && (
            <button
              onClick={() => setMinRating(0)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold pt-1"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
