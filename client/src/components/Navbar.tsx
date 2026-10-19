import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFilterStore } from '../store/useFilterStore';
import { MOCK_CATEGORIES } from '../api/mockData';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { searchQuery, setSearchQuery, selectedCategory, setCategory } = useFilterStore();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  const accountRef = useRef<HTMLDivElement>(null);
  const itemCount = getItemCount();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>⚡ Great Indian Tech Fest: Up to 65% OFF | Free delivery above ₹999</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-300">
            <span className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              100% Genuine Guarantee
            </span>
            <span className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[15px]">autorenew</span>
              7-Day Easy Returns
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">Help & Support</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-8">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 bg-clip-text text-transparent">
                  UniCart
                </span>
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase -mt-1">
                  Marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Delivery Location Chip (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer bg-slate-50/70 transition-colors">
            <span className="material-symbols-outlined text-indigo-600 text-lg">location_on</span>
            <div className="text-left text-xs leading-tight">
              <span className="text-slate-600 block">Deliver to</span>
              <span className="font-semibold text-slate-800">Mumbai 400053 ▾</span>
            </div>
          </div>

          {/* Integrated Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center relative rounded-xl border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 bg-slate-50 transition-all shadow-sm"
          >
            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="h-11 pl-3 pr-8 rounded-l-xl bg-slate-100 text-xs font-semibold text-slate-700 border-r border-slate-300 focus:outline-none cursor-pointer hover:bg-slate-200 transition-colors"
            >
              {MOCK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Input */}
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search smartphones, headphones, laptops, accessories..."
              className="flex-1 h-11 px-4 text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                aria-label="Clear search query"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="h-9 px-4 mr-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
              aria-label="Search catalogue"
            >
              <span className="material-symbols-outlined text-lg">search</span>
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Link */}
            <Link
              to="/"
              className="hidden sm:flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative"
              title="Wishlist"
            >
              <span className="material-symbols-outlined text-2xl">favorite_border</span>
              <span className="sr-only">Wishlist</span>
            </Link>

            {/* Cart Link with Emerald Count Badge */}
            <Link
              to="/cart"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-slate-700 group-hover:text-indigo-600 transition-colors">
                  shopping_cart
                </span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 min-w-[20px] text-center text-[11px] font-bold text-white bg-emerald-500 rounded-full shadow-sm animate-pulse">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-sm">Cart</span>
            </Link>

            {/* User Account Dropdown */}
            <div className="relative" ref={accountRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-xs leading-tight">
                    <span className="text-slate-600 block">Welcome,</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                      {user.name.split(' ')[0]}
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        expand_more
                      </span>
                    </span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Account Dropdown Menu */}
              {isAccountOpen && isAuthenticated && user && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                    <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-indigo-100 text-indigo-700">
                      Role: {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg text-indigo-600">
                          admin_panel_settings
                        </span>
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400">
                        package_2
                      </span>
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400">
                        manage_accounts
                      </span>
                      <span>Profile & Saved Addresses</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 py-2 px-4 bg-slate-50/50">
                    <p className="text-[11px] text-slate-500">
                      Logged in as <strong className="text-slate-800">{user.email}</strong>
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        void logout();
                        setIsAccountOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (Directly below header) */}
        <div className="md:hidden pb-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center relative rounded-xl border border-slate-300 bg-slate-50 shadow-sm"
          >
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products, brands and more..."
              className="flex-1 h-10 px-3.5 text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 px-3 text-slate-500 hover:text-indigo-600"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
            <span className="material-symbols-outlined text-indigo-600 text-base">location_on</span>
            <span className="text-slate-600">Deliver to: <strong>Mumbai 400053</strong></span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Shop Categories
            </p>
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-50 font-bold text-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="material-symbols-outlined text-sm text-slate-400">
                  chevron_right
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg"
              >
                <span className="material-symbols-outlined text-indigo-600">admin_panel_settings</span>
                <span>Admin Dashboard</span>
              </Link>
            )}
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <span className="material-symbols-outlined text-slate-500">package_2</span>
              <span>My Orders</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <span className="material-symbols-outlined text-slate-500">person</span>
              <span>Account & Addresses</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
