import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    addToCart(product, 1);
    setIsAdded(true);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name.slice(0, 36)}... has been added.`
    });

    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    addToast({
      type: 'info',
      title: !isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist',
      message: product.name.slice(0, 36)
    });
  };

  // Stock status pill
  let stockBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      In Stock
    </span>
  );

  if (product.stock === 0) {
    stockBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Out of Stock
      </span>
    );
  } else if (product.stock <= 5) {
    stockBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Only {product.stock} left
      </span>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image & Badges Container */}
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden bg-slate-50 pt-[100%]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-sm">
            {product.discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:text-rose-500 flex items-center justify-center shadow-md transition-all hover:scale-110"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span
            className={`material-symbols-outlined text-lg ${
              isWishlisted ? 'text-rose-500 fill-current font-variation-fill' : ''
            }`}
          >
            {isWishlisted ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {product.brand}
            </span>
            {stockBadge}
          </div>

          {/* Product Name */}
          <Link to={`/product/${product.id}`}>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 hover:text-indigo-600 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <span>★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-slate-600">
              ({product.reviewCount.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-extrabold text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-600 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isAdded ? 'check' : 'shopping_bag'}
              </span>
              <span>{isAdded ? 'Added to Cart' : 'Add to Cart'}</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200"
            >
              <span className="material-symbols-outlined text-base">remove_shopping_cart</span>
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
