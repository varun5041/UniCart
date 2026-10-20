import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRupees, getCategoryName, getPricing, getProductId, type Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { WishlistButton } from './WishlistButton';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

interface ProductCardProps {
  product: Product;
  /** Fixed-width card for horizontal rails */
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const addToast = useToastStore((s) => s.addToast);
  const [isAdded, setIsAdded] = useState(false);

  const productId = getProductId(product);
  const href = `/product/${product.slug || productId}`;
  const { price, mrp, discount } = getPricing(product);
  const categoryName = getCategoryName(product);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 hover:ring-brand-200 ${
        compact ? 'w-[200px] shrink-0 snap-start sm:w-[228px]' : 'w-full'
      }`}
    >
      <Link to={href} className="relative block aspect-square overflow-hidden bg-slate-50">
        <img
          src={product.images?.[0] || PLACEHOLDER_IMAGE}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            outOfStock ? 'opacity-60 grayscale' : ''
          }`}
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-md">
            {discount}% OFF
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-900/80 py-1.5 text-center text-xs font-bold text-white backdrop-blur">
            Out of stock
          </span>
        )}
      </Link>

      <WishlistButton productId={productId} productName={product.name} className="absolute right-3 top-3" />

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {categoryName && (
          <span className="mb-1 truncate text-[11px] font-bold uppercase tracking-wider text-brand-600">
            {categoryName}
          </span>
        )}
        <Link to={href}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-brand-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold text-slate-900">{formatRupees(price)}</span>
          {discount > 0 && (
            <>
              <span className="text-xs font-medium text-slate-400 line-through">{formatRupees(mrp)}</span>
              <span className="text-xs font-bold text-emerald-600">{discount}% off</span>
            </>
          )}
        </div>

        <p className="mt-1 h-4 text-[11px] font-semibold text-amber-600">
          {!outOfStock && product.stock <= 5 ? `Only ${product.stock} left` : ''}
        </p>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed ${
            outOfStock
              ? 'bg-slate-100 text-slate-400'
              : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {outOfStock ? 'block' : isAdded ? 'check' : 'add_shopping_cart'}
          </span>
          <span>{outOfStock ? 'Unavailable' : isAdded ? 'Added' : 'Add to Cart'}</span>
        </button>
      </div>
    </article>
  );
};
