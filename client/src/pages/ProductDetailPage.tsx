import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { ProductRail } from '../components/ProductRail';
import { WishlistButton } from '../components/WishlistButton';
import { PLACEHOLDER_IMAGE } from '../components/ProductCard';
import { FREE_SHIPPING_THRESHOLD } from '../lib/validation';
import { formatRupees, getPricing, getProductId } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { addToast } = useToastStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const { data: serverProduct, isLoading: isServerLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await productsApi.getProductBySlug(id);
        if (res.success && res.data) {
          return res.data;
        }
      } catch {
        // Fallback or not found
      }
      return null;
    }
  });

  if (isServerLoading) {
    return (
      <div className="bg-surface min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!serverProduct) {
    return (
      <div className="bg-surface min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This item is no longer available in the catalogue or has been removed by the store administrator.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = serverProduct;
  const productId = getProductId(product);
  const { price, mrp, discount } = getPricing(product);
  const category = typeof product.category === 'object' ? product.category : null;
  const productImages = product.images && product.images.length > 0 ? product.images : [PLACEHOLDER_IMAGE];

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    void addToCart(product, quantity);
    setIsAdded(true);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name.slice(0, 36)} added to your cart.`
    });
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    void addToCart(product, quantity);
    navigate('/checkout');
  };


  return (
    <div className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto scrollbar-none py-1">
          <Link to="/" className="hover:text-brand-600 font-medium">
            Home
          </Link>
          <span>/</span>
          {category && (
            <Link to={`/category/${category.slug}`} className="hover:text-brand-600 font-medium">
              {category.name}
            </Link>
          )}
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Showcase Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Primary Active Image */}
              <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
                <img
                  src={productImages[selectedImage] || productImages[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-extrabold shadow-md tracking-wide">
                    {discount}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-18 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-50 ${
                        selectedImage === idx
                          ? 'border-brand-600 ring-2 ring-brand-600/20 scale-95'
                          : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Purchase Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header: Title, Brand, Ratings */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.isArray(product.categories) && product.categories.length > 0 ? (
                      product.categories.map((c) => {
                        const catObj = typeof c === 'object' && c ? c : null;
                        if (!catObj) return null;
                        return (
                          <Link
                            key={catObj.slug}
                            to={`/category/${catObj.slug}`}
                            className="text-xs font-extrabold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-1 rounded-md hover:bg-brand-100"
                          >
                            {catObj.name}
                          </Link>
                        );
                      })
                    ) : category ? (
                      <Link
                        to={`/category/${category.slug}`}
                        className="text-xs font-extrabold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-1 rounded-md hover:bg-brand-100"
                      >
                        {category.name}
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Currently Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h1>

              </div>

              {/* Pricing Block */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {discount > 0 && <span className="text-2xl font-extrabold text-rose-600">-{discount}%</span>}
                  <span className="text-3xl font-extrabold text-slate-900">{formatRupees(price)}</span>
                </div>
                {discount > 0 && (
                  <p className="text-sm text-slate-500">
                    M.R.P.: <span className="line-through">{formatRupees(mrp)}</span>
                    <span className="ml-2 font-bold text-emerald-600">You save {formatRupees(mrp - price)}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Inclusive of all taxes ·{' '}
                  {price >= FREE_SHIPPING_THRESHOLD ? 'FREE delivery' : 'FREE delivery on orders over ₹500'}
                </p>
              </div>

              {/* Description summary */}
              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <p>{product.description}</p>
              </div>

              {/* Quantity Selector & CTAs */}
              {isAdmin ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                      <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                        Administrator Preview Mode
                      </h3>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Shopping cart, wishlist, and checkout actions are disabled for store administrators. You can edit this item, modify pricing, or adjust inventory directly in the admin dashboard.
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/admin"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-black active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">dashboard</span>
                          <span>Manage in Admin Panel</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quantity:</span>
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || product.stock <= 0}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-l-xl transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="w-10 text-center text-xs font-black text-slate-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-r-xl transition-colors"
                        aria-label="Increase quantity"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                        product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 active:scale-98'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isAdded ? 'check' : 'shopping_bag'}
                      </span>
                      <span>{isAdded ? 'Added to Cart' : 'Add to Cart'}</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={product.stock <= 0}
                      className={`py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                        product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20 active:scale-98'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      <span>Buy Now</span>
                    </button>

                    <WishlistButton productId={productId} productName={product.name} variant="full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {category && (
          <ProductRail
            title={`More in ${category.name}`}
            icon="storefront"
            query={{ category: category.slug, sort: 'popular' }}
            seeAllHref={`/category/${category.slug}`}
            excludeId={productId}
          />
        )}
      </div>
    </div>
  );
};
