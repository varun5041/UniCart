import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getGrandTotal,
    getItemCount
  } = useCartStore();

  const { addToast } = useToastStore();
  const [couponCode, setCouponCode] = useState('');

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shippingFee = getShippingFee();
  const grandTotal = getGrandTotal();

  // Free delivery threshold is ₹999
  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code) return;

    const res = applyCoupon(code);
    if (res.success) {
      addToast({ type: 'success', title: 'Coupon Applied', message: res.message });
      setCouponCode('');
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
      <div className="bg-[#FAF8FF] min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl">shopping_cart</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Looks like you haven&apos;t added any tech items or accessories yet. Explore our deals to get started!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all"
          >
            <span className="material-symbols-outlined text-base">explore</span>
            <span>Explore Trending Deals</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-indigo-600 font-medium">
            Home
          </Link>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <span className="text-slate-800 font-semibold">Shopping Cart</span>
        </div>

        {/* Free Shipping Progress Indicator (Stitch Screen 6) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            {amountNeeded > 0 ? (
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-base">
                  local_shipping
                </span>
                Add{' '}
                <strong className="text-indigo-600">
                  ₹{amountNeeded.toLocaleString('en-IN')}
                </strong>{' '}
                more to unlock <strong className="text-emerald-600">FREE Delivery</strong>
              </span>
            ) : (
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">
                  check_circle
                </span>
                🎉 You have unlocked FREE Express Delivery on this order!
              </span>
            )}
            <span className="font-bold text-slate-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                amountNeeded === 0 ? 'bg-emerald-500' : 'bg-indigo-600'
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
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                >
                  Clear All Items
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.product.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start">
                    {/* Thumbnail */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                        {item.product.brand}
                      </span>
                      <Link to={`/product/${item.product.id}`}>
                        <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors leading-snug">
                          {item.product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-emerald-600">● In Stock</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500">
                          Unit: ₹{item.product.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Controls: Stepper & Remove */}
                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-extrabold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold transition-colors mt-0.5 inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-2xl shrink-0">
                verified_user
              </span>
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong>Price & Stock Lock Guarantee:</strong> Items in your cart are verified against current warehouse stock. Checkout is idempotent to prevent accidental duplicate charges.
              </p>
            </div>
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              {/* Price Details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <span>Promo Discount</span>
                      {coupon && (
                        <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                          {coupon.code}
                        </span>
                      )}
                    </span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">₹{shippingFee}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Estimated Taxes (GST)</span>
                  <span>Included in price</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-indigo-700">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label htmlFor="coupon-code-input" className="block text-xs font-bold text-slate-700">Apply Promo Code</label>
                {coupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-base">
                        check_circle
                      </span>
                      <span className="font-bold text-emerald-900 font-mono">{coupon.code}</span>
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
                      placeholder="e.g. UNICART10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Available Coupon Chips */}
                {!coupon && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => handleApplyCoupon('UNICART10')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-mono font-bold"
                    >
                      UNICART10 (10% off)
                    </button>
                    <button
                      onClick={() => handleApplyCoupon('WELCOME50')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-mono font-bold"
                    >
                      WELCOME50 (₹50 off)
                    </button>
                  </div>
                )}
              </div>

              {/* Checkout CTA Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
              >
                <span>Proceed to Secure Checkout</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              {/* Trust Logos */}
              <div className="pt-2 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[11px]">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>256-bit Encrypted Transaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
