import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { useFilterStore, type SortOption } from '../store/useFilterStore';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../api/mockData';
import { productsApi } from '../api/products';
import type { Product } from '../types';

export const HomePage: React.FC = () => {
  const {
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedBrands,
    inStockOnly,
    minRating,
    sortBy,
    setSortBy,
    currentPage,
    setPage,
    itemsPerPage,
    resetFilters,
    setCategory
  } = useFilterStore();

  // TanStack Query for server state caching & live API integration
  const { data: serverData, isLoading: isServerLoading } = useQuery({
    queryKey: ['products', selectedCategory, searchQuery, sortBy, minPrice, maxPrice, currentPage],
    queryFn: async () => {
      try {
        const res = await productsApi.getProducts({
          page: currentPage,
          limit: itemsPerPage,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          q: searchQuery || undefined,
          sort: sortBy === 'price_asc' || sortBy === 'price_desc' || sortBy === 'newest' ? sortBy : undefined,
          minPrice: minPrice > 0 ? minPrice * 100 : undefined,
          maxPrice: maxPrice < 100000 ? maxPrice * 100 : undefined
        });
        if (res.success && res.data && res.data.length > 0) {
          return {
            items: res.data,
            total: res.meta?.total ?? res.data.length,
            pages: res.meta?.pages ?? 1
          };
        }
      } catch {
        // Fallback to local showcase data
      }
      return null;
    }
  });

  // Client-side fallback filter logic
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = (product.brand || '').toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc) {
          return false;
        }
      }
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }
      if (selectedBrands.length > 0 && (!product.brand || !selectedBrands.includes(product.brand))) {
        return false;
      }
      if (inStockOnly && product.stock <= 0) {
        return false;
      }
      if (minRating > 0 && (product.rating || 0) < minRating) {
        return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery, minPrice, maxPrice, selectedBrands, inStockOnly, minRating]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price_asc') return list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') return list.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'newest') return list.reverse();
    return list;
  }, [filteredProducts, sortBy]);

  const totalProducts = serverData ? serverData.total : sortedProducts.length;
  const totalPages = serverData ? serverData.pages : Math.ceil(totalProducts / itemsPerPage) || 1;

  const displayProducts: Product[] = useMemo(() => {
    if (serverData && serverData.items.length > 0) {
      return serverData.items;
    }
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [serverData, sortedProducts, currentPage, itemsPerPage]);

  const activeCategoryObj = MOCK_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="bg-[#FAF8FF] min-h-screen pb-16">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4F46E5_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Diwali Super Saver Festival • Up to 70% Off</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                India&apos;s Fastest E-Commerce Platform.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                Guaranteed genuine electronics, verified flash deals, sub-100ms API speeds, and same-day dispatch nationwide.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalog"
                  className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  Shop Now
                </a>
                <button
                  onClick={() => setCategory('all')}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-sm border border-white/15 transition-all"
                >
                  View All Deals
                </button>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="text-2xl font-black text-indigo-300">200+</div>
                <div className="text-xs text-slate-300 mt-0.5">Top-Rated Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="text-2xl font-black text-emerald-300">100%</div>
                <div className="text-xs text-slate-300 mt-0.5">ACID Inventory Guarantee</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="text-2xl font-black text-amber-300">&lt;50ms</div>
                <div className="text-xs text-slate-300 mt-0.5">Redis Cached Responses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="text-2xl font-black text-rose-300">Zero</div>
                <div className="text-xs text-slate-300 mt-0.5">Overselling Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Horizontal Quick Bar */}
      <section className="border-b border-slate-200/80 bg-white shadow-xs sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <button
              onClick={() => setCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-base">apps</span>
              <span>All Categories</span>
            </button>
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Layout Grid: Sidebar Filters + Products Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sticky Filters */}
          <FilterSidebar />

          {/* Right Product Grid Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Header Toolbar: Results Count, Active Tags, Sort By */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {activeCategoryObj?.name || 'All Products'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing <span className="font-semibold text-slate-800">{totalProducts}</span> items found
                  {searchQuery && (
                    <span> for &quot;<strong className="text-indigo-600">{searchQuery}</strong>&quot;</span>
                  )}
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <label htmlFor="sort-selector" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Sort By:
                </label>
                <select
                  id="sort-selector"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-600 cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Best Match</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* LOADING SKELETON */}
            {isServerLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4">
                    <div className="w-full h-44 bg-slate-200 rounded-xl"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
                      <div className="h-8 bg-slate-200 rounded-xl w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY STATE */}
            {!isServerLoading && displayProducts.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No products found matching your filters</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Try clearing some filters, expanding your price range, or searching for a different keyword.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* LIVE PRODUCTS GRID */}
            {!isServerLoading && displayProducts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard key={product._id || product.id || product.slug} product={product} />
                  ))}
                </div>

                {/* Numbered Pagination */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
