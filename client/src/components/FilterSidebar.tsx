import React, { useState } from 'react';
import { useFilterStore } from '../store/useFilterStore';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../api/mockData';

const BRANDS = ['Boat', 'Sony', 'Apple', 'Noise', 'Samsung', 'JBL', 'Logitech', 'Keychron'];

export const FilterSidebar: React.FC = () => {
  const {
    selectedCategory,
    setCategory,
    minPrice,
    maxPrice,
    setPriceRange,
    selectedBrands,
    toggleBrand,
    inStockOnly,
    setInStockOnly,
    minRating,
    setMinRating,
    resetFilters,
    activeFilterCount
  } = useFilterStore();

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

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return MOCK_PRODUCTS.length;
    return MOCK_PRODUCTS.filter((p) => p.category === catId).length;
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
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
          {MOCK_CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.id);
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-base text-slate-400">
                    {cat.icon}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
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

      {/* Brand Filter */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Popular Brands
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {BRANDS.map((brand) => {
            const isChecked = selectedBrands.includes(brand);
            const brandCount = MOCK_PRODUCTS.filter((p) => p.brand === brand).length;

            return (
              <label
                key={brand}
                className="flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>{brand}</span>
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-600">
                  ({brandCount})
                </span>
              </label>
            );
          })}
        </div>
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
