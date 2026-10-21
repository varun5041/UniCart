import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRupees, getCategoryName, getPricing, getProductId, type Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { WishlistButton } from './WishlistButton';
import { PLACEHOLDER_IMAGE } from './ProductCard';
import { FREE_SHIPPING_THRESHOLD } from '../lib/validation';

/** Full-width horizontal result row used on the search results page. */
export const ProductListItem: React.FC<{ product: Product }> = ({ product }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [isAdded, setIsAdded] = useState(false);

  const productId = getProductId(product);
  const href = `/product/${product.slug || productId}`;
  const { price, mrp, discount } = getPricing(product);
  const categoryName = getCategoryName(product);
  const outOfStock = product.stock <= 0;

  const handleAdd = async () => {
    if (outOfStock) return;
    const ok = await addToCart(product, 1);
    if (!ok) {
      addToast({ type: 'error', title: 'Could not add to cart', message: 'Please try again.' });
      return;
    }
    setIsAdded(true);
    addToast({ type: 'success', title: 'Added to Cart', message: product.name.slice(0, 48) });
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <article className="flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70 transition-shadow hover:shadow-lg hover:shadow-slate-900/5 sm:gap-6 sm:p-4">
      <Link
        to={href}
        className="relative block h-32 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-48 sm:w-48"
      >
        <img
          src={product.images?.[0] || PLACEHOLDER_IMAGE}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover ${outOfStock ? 'opacity-60 grayscale' : ''}`}
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            {discount}% OFF
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {categoryName && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">{categoryName}</span>
            )}
            <Link to={href}>
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-brand-700 sm:text-base">
                {product.name}
              </h3>
            </Link>
          </div>
          {!isAdmin && <WishlistButton productId={productId} productName={product.name} className="shrink-0" />}
        </div>

        <p className="mt-1 hidden text-sm leading-relaxed text-slate-500 sm:line-clamp-2">{product.description}</p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-extrabold text-slate-900">{formatRupees(price)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-slate-400 line-through">M.R.P. {formatRupees(mrp)}</span>
              <span className="text-sm font-bold text-emerald-600">({discount}% off)</span>
            </>
          )}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {outOfStock ? (
            <span className="font-semibold text-rose-600">Currently unavailable</span>
          ) : product.stock <= 5 ? (
            <span className="font-semibold text-amber-600">Only {product.stock} left in stock</span>
          ) : (
            <span>
              {price >= FREE_SHIPPING_THRESHOLD ? (
                <span className="font-semibold text-emerald-600">FREE delivery</span>
              ) : (
                'Delivery ₹50 · free over ₹500'
              )}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-black active:scale-95"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span>Manage in Admin</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${
                outOfStock
                  ? 'bg-slate-100 text-slate-400'
                  : isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-400 text-slate-900 hover:bg-amber-500'
              }`}
            >
              <span className="material-symbols-outlined text-base">{isAdded ? 'check' : 'add_shopping_cart'}</span>
              {outOfStock ? 'Unavailable' : isAdded ? 'Added' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
