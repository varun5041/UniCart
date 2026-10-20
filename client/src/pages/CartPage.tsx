import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { FREE_SHIPPING_THRESHOLD } from '../lib/validation';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    discountPaise,
    couponCode: activeCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getShippingFee,
    getGrandTotal,
    getItemCount
  } = useCartStore();

  const { addToast } = useToastStore();
  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const itemCount = getItemCount();

  // Price calculations in rupees (from paise)
  const subtotalRupees = Math.round(subtotal / 100);
  const discountRupees = Math.round(discountPaise / 100);
  const shippingRupees = Math.round(getShippingFee() / 100);
  const grandTotalRupees = Math.round(getGrandTotal() / 100);

  const freeShippingThreshold = FREE_SHIPPING_THRESHOLD / 100;
  const amountAfterDiscount = subtotalRupees - discountRupees;
  const progressPercent = Math.min(100, Math.round((amountAfterDiscount / freeShippingThreshold) * 100));
  const amountNeeded = Math.max(0, freeShippingThreshold - amountAfterDiscount);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(code)) {
      addToast({ type: 'error', title: 'Coupon Error', message: 'Coupon codes are 3–20 letters or numbers.' });
      return;
    }

    setIsApplying(true);
    const res = await applyCoupon(code);
    setIsApplying(false);
    if (res.success) {
      addToast({ type: 'success', title: 'Coupon Applied', message: res.message });
      setCouponInput('');
    } else {
      addToast({ type: 'error', title: 'Coupon Error', message: res.message });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    addToast({ type: 'info', title: 'Coupon Removed' });
  };

  if (items.length === 0) {
    return (
      <div className="bg-surface min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl">shopping_cart</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Looks like you haven&apos;t added anything yet. Explore today&apos;s deals to get started!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all"
          >
            <span>Start Shopping</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Progress Bar for Free Shipping */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-brand-600">local_shipping</span>
              {amountNeeded > 0 ? (
                <span>
                  Add <strong className="text-brand-600">₹{amountNeeded}</strong> more to unlock{' '}
                  <strong className="text-emerald-600">FREE Delivery</strong>
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  🎉 You&apos;ve unlocked FREE Delivery
                </span>
              )}
            </span>
            <span className="text-slate-400 font-normal">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Main Grid: Item List & Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h1 className="text-lg font-black text-slate-900">
                  Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </h1>
                <button
                  onClick={() => void clearCart()}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                >
                  Clear All Items
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const prodId = item.productId || item.product?._id || item.product?.id || '';
                  const name = item.name || item.product?.name || 'UniCart Item';
                  const pricePaise = item.price || item.product?.price || 0;
                  const itemPriceRupees = Math.round(pricePaise / 100);
                  const imageUrl =
                    item.images?.[0] ||
                    item.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                  const qty = item.qty || item.quantity || 1;
                  const productHref = `/product/${item.slug || item.product?.slug || prodId}`;

                  return (
                    <div
                      key={prodId}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start"
                    >
                      {/* Thumbnail */}
                      <Link
                        to={productHref}
                        className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0"
                      >
                        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 space-y-1">
                        <Link to={productHref}>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors leading-snug">
                            {name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-bold text-emerald-600">● In Stock</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-xs text-slate-500">Unit: ₹{itemPriceRupees.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Controls: Stepper & Remove */}
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                            <button
                              onClick={() => void updateQuantity(prodId, qty - 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-extrabold text-slate-900">{qty}</span>
                            <button
                              onClick={() => void updateQuantity(prodId, qty + 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 block">
                              ₹{(itemPriceRupees * qty).toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => void removeFromCart(prodId)}
                              className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold transition-colors mt-0.5 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">Order Summary</h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Price ({itemCount} items)</span>
                  <span className="font-semibold text-slate-900">₹{subtotalRupees.toLocaleString('en-IN')}</span>
                </div>

                {discountRupees > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <span>Promo Discount</span>
                      {activeCoupon && (
                        <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                          {activeCoupon}
                        </span>
                      )}
                    </span>
                    <span>-₹{discountRupees.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling</span>
                  <span>
                    {shippingRupees === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">₹{shippingRupees}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Estimated Taxes (GST)</span>
                  <span>Included in price</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-brand-700">₹{grandTotalRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label htmlFor="coupon-code-input" className="block text-xs font-bold text-slate-700">
                  Apply Promo Code
                </label>
                {activeCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                      <span className="font-bold text-emerald-900 font-mono">{activeCoupon}</span>
                      <span className="text-emerald-700 text-[11px]">applied</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-emerald-800 hover:text-rose-600 font-bold text-xs"
                      aria-label="Remove promo code"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="coupon-code-input"
                      type="text"
                      placeholder="Enter coupon code"
                      maxLength={20}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleApplyCoupon();
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:border-brand-600"
                    />
                    <button
                      onClick={() => void handleApplyCoupon()}
                      disabled={isApplying || !couponInput}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isApplying ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                )}

              </div>

              {/* Checkout CTA Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5"
              >
                <span>Proceed to Checkout</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
