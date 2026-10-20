import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { getCategoryStyle, useCategories } from '../lib/categories';
import { SearchBar } from './SearchBar';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, isAuthenticated, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const { data: categories = [] } = useCategories();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on navigation
  const routeKey = location.pathname + location.search;
  const [prevRouteKey, setPrevRouteKey] = useState(routeKey);
  if (prevRouteKey !== routeKey) {
    setPrevRouteKey(routeKey);
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
  }

  const displayName = (user?.name || user?.email || 'User').split(' ')[0];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="bg-gradient-to-r from-brand-700 to-fuchsia-600 px-4 py-1.5 text-center text-xs font-semibold text-white">
        Free delivery on orders over ₹500 ·{' '}
        <Link to="/deals" className="underline underline-offset-2 hover:text-amber-200">
          Shop today&apos;s deals
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3 sm:h-[72px] sm:gap-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>

          <Link to="/" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-md shadow-brand-500/30 transition-transform group-hover:rotate-[-6deg]">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </span>
            <span className="hidden text-2xl font-extrabold tracking-tight text-slate-900 sm:inline">
              Uni<span className="text-brand-600">Cart</span>
            </span>
          </Link>

          <SearchBar className="hidden flex-1 md:block" />

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/deals"
              className={({ isActive }) =>
                `hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors lg:flex ${
                  isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl text-orange-500">local_offer</span>
              Deals
            </NavLink>

            <NavLink
              to="/wishlist"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-bold transition-colors sm:px-3 ${
                  isActive ? 'bg-rose-50 text-rose-600' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="relative">
                <span className="material-symbols-outlined text-2xl">favorite</span>
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">Wishlist</span>
            </NavLink>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-bold transition-colors sm:px-3 ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="relative">
                <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-[18px] rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">Cart</span>
            </NavLink>

            <div className="relative" ref={accountRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 sm:px-2.5"
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-bold text-slate-800 xl:inline">{displayName}</span>
                  <span className="material-symbols-outlined hidden text-lg text-slate-400 sm:inline">expand_more</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Sign in
                </Link>
              )}

              {isAccountOpen && isAuthenticated && user && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white py-2 shadow-2xl ring-1 ring-slate-200">
                  <div className="border-b border-slate-100 px-4 pb-3 pt-1">
                    <p className="truncate text-sm font-bold text-slate-900">{user.name || 'Customer'}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    {user.role === 'admin' && (
                      <MenuLink to="/admin" icon="dashboard" label="Admin Dashboard" highlight />
                    )}
                    <MenuLink to="/orders" icon="package_2" label="My Orders" />
                    <MenuLink to="/wishlist" icon="favorite" label="My Wishlist" />
                    <MenuLink to="/profile" icon="manage_accounts" label="Profile & Addresses" />
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        void logout();
                        navigate('/login');
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <SearchBar className="pb-3 md:hidden" />
      </div>

      {isMobileMenuOpen && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-6 pt-3 lg:hidden">
          <Link to="/deals" className="mb-2 flex items-center gap-3 rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-700">
            <span className="material-symbols-outlined text-xl">local_offer</span>
            Today&apos;s Deals
          </Link>
          <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="flex items-center gap-2.5 rounded-xl p-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.gradient} text-white`}>
                    <span className="material-symbols-outlined text-lg">{style.icon}</span>
                  </span>
                  <span className="truncate">{style.short}</span>
                </Link>
              );
            })}
          </div>
          {isAuthenticated && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {user?.role === 'admin' && <MenuLink to="/admin" icon="dashboard" label="Admin Dashboard" highlight />}
              <MenuLink to="/orders" icon="package_2" label="My Orders" />
              <MenuLink to="/profile" icon="person" label="Profile & Addresses" />
            </div>
          )}
        </div>
      )}
    </header>
  );
};

const MenuLink: React.FC<{ to: string; icon: string; label: string; highlight?: boolean }> = ({
  to,
  icon,
  label,
  highlight
}) => (
  <Link
    to={to}
    role="menuitem"
    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
      highlight ? 'bg-brand-50 font-bold text-brand-700 hover:bg-brand-100' : 'text-slate-700 hover:bg-slate-50'
    }`}
  >
    <span className={`material-symbols-outlined text-lg ${highlight ? 'text-brand-600' : 'text-slate-400'}`}>{icon}</span>
    {label}
  </Link>
);
