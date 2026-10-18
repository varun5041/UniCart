import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { useFilterStore, type SortOption } from '../store/useFilterStore';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../api/mockData';

type ShowcaseTab = 'live' | 'skeleton' | 'empty' | 'error';

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

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('live');
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Search keyword filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc) {
          return false;
        }
      }

      // Price filter
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // In stock filter
      if (inStockOnly && product.stock <= 0) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, minPrice, maxPrice, selectedBrands, inStockOnly, minRating]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'newest') {
      return list.reverse();
    }
    return list; // 'featured' default
  }, [filteredProducts, sortBy]);

  // Pagination calculation
  const totalProducts = sortedProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

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
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>FESTIVAL TECH CARNIVAL 2026</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Next-Gen Tech Gadgets,{' '}
                <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-indigo-200 bg-clip-text text-transparent">
                  Unbeatable Prices.
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                Explore premium active noise-cancelling headphones, AMOLED smartwatches, Apple accessories, and mechanical keyboards with instant bank discounts & free pan-India delivery.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalog"
                  className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                >
                  Explore Deals
                </a>
                <span className="text-xs text-slate-300 flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="material-symbols-outlined text-amber-400 text-base">savings</span>
                  Extra 10% Instant Off on HDFC & ICICI Cards
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:flex justify-end">
              <div className="relative w-80 h-64 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl p-6 border border-white/15 backdrop-blur-md shadow-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                      Deal of the Day
                    </span>
                    <h3 className="text-white font-extrabold text-lg mt-0.5">Sony WH-1000XM5</h3>
                    <p className="text-xs text-slate-300">Industry-leading Wireless ANC</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-extrabold text-xs">
                    23% OFF
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <span className="text-2xl font-black text-white">₹26,990</span>
                    <span className="text-xs text-slate-400 line-through ml-2">₹34,990</span>
                  </div>
                  <Link
                    to="/product/prod-002"
                    className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Strip */}
      <section className="bg-white border-b border-slate-200 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
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

      {/* Stitch Design Showcase Selector Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-xl">palette</span>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Stitch UI Design Showcase Switcher
              </h4>
              <p className="text-xs text-indigo-800">
                Switch between live interactive grid and dedicated Stitch mock states (Skeleton, Empty, Error).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-xs">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'live'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Catalog
            </button>
            <button
              onClick={() => setActiveTab('skeleton')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'skeleton'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loading Skeleton
            </button>
            <button
              onClick={() => setActiveTab('empty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'empty'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Empty State
            </button>
            <button
              onClick={() => setActiveTab('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'error'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Network Error Banner
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Section */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Inline Error State Banner from Stitch Screen 1 & 2 */}
        {(activeTab === 'error' || (!isErrorDismissed && activeTab === 'live')) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300/80 flex items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">
                wifi_off
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Demo Notice: Showing Cached Catalogue
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Unable to reach primary Redis cache cluster. Showing local stale-while-revalidate catalog.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsErrorDismissed(true);
                  if (activeTab === 'error') setActiveTab('live');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Retry Connection
              </button>
              <button
                onClick={() => setIsErrorDismissed(true)}
                className="text-amber-700 hover:text-amber-900 p-1"
                aria-label="Dismiss banner"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}

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

            {/* TAB 1: SKELETON STATE SHOWCASE (From Stitch Screen 1 Specification) */}
            {activeTab === 'skeleton' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4"
                  >
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

            {/* TAB 2: EMPTY STATE SHOWCASE (From Stitch Screen 1 Specification) */}
            {(activeTab === 'empty' || (activeTab === 'live' && paginatedProducts.length === 0)) && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No products found matching your filters
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Try clearing some filters, expanding your price range, or searching for a different keyword.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetFilters();
                    if (activeTab === 'empty') setActiveTab('live');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* TAB 3: LIVE PRODUCTS GRID (Stitch Screens 1 & 2) */}
            {activeTab === 'live' && paginatedProducts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Numbered Pagination (Stitch Screen 1 Specification) */}
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
