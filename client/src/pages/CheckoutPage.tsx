import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';
import { AddressForm } from '../components/AddressForm';
import type { Address } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discountPaise, couponCode, getShippingFee, getGrandTotal, clearCart } =
    useCartStore();
  const { user, isAuthenticated, selectedAddress, setSelectedAddress, addAddress } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { addToast } = useToastStore();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // One key per checkout attempt so a retried submit can never create a duplicate order
  const [idempotencyKey] = useState(
    () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const subtotalRupees = Math.round(subtotal / 100);
  const discountRupees = Math.round(discountPaise / 100);
  const shippingRupees = Math.round(getShippingFee() / 100);
  const grandTotalRupees = Math.round(getGrandTotal() / 100);

  const addressesList: Address[] = user?.addresses || [];
  const currentAddress: Address | null = selectedAddress || addressesList[0] || null;
  const isSelected = (addr: Address) =>
    Boolean(currentAddress) &&
    (addr._id && currentAddress?._id
      ? addr._id === currentAddress._id
      : addr.line1 === currentAddress?.line1 && addr.pincode === currentAddress?.pincode);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      addToast({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please sign in or create an account to complete your purchase.'
      });
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      addToast({
        type: 'error',
        title: 'Empty Cart',
        message: 'Your cart has no items.'
      });
      navigate('/');
      return;
    }

    if (!currentAddress) {
      addToast({
        type: 'error',
        title: 'Add a delivery address',
        message: 'Please add where we should deliver your order.'
      });
      setIsAddingAddress(true);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await createOrder(currentAddress, idempotencyKey, true, couponCode);
      setIsProcessing(false);

      if (res.success && res.order) {
        await clearCart();
        addToast({
          type: 'success',
          title: 'Order placed! 🎉',
          message: `Order #${(res.order._id || res.order.id || '').slice(-8).toUpperCase()} is confirmed.`
        });
        navigate('/orders');
      } else {
        addToast({
          type: 'error',
          title: 'Order Placement Failed',
          message: res.error || 'Please review item availability and try again.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      addToast({
        type: 'error',
        title: 'Transaction Error',
        message: err.message || 'Failed to place order'
      });
    }
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="bg-surface min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium text-sm">No items in your cart to checkout.</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Steps */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500 mt-1">Review your address and payment, then place your order.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
              Cart
            </span>
            <span className="text-slate-300">──</span>
            <span className="flex items-center gap-1 text-brand-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">2</span>
              Payment &amp; Address
            </span>
            <span className="text-slate-300">──</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
              Confirmation
            </span>
          </div>
        </div>

        {/* Main Grid: Forms (8 cols) & Order Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: Delivery Address */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <h2 className="text-base font-black text-slate-900">Delivery Address</h2>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Add New Address
                  </button>
                )}
              </div>

              {isAddingAddress && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="mb-3 text-xs font-bold text-slate-800 uppercase tracking-wide">New delivery address</h4>
                  <AddressForm
                    submitLabel="Save & deliver here"
                    showDefaultToggle={addressesList.length > 0}
                    onCancel={addressesList.length > 0 ? () => setIsAddingAddress(false) : undefined}
                    onSubmit={async (addr) => {
                      const res = await addAddress(addr);
                      if (res.success) {
                        const saved = useAuthStore.getState().user?.addresses || [];
                        const match = saved.find((a) => a.line1 === addr.line1 && a.pincode === addr.pincode);
                        if (match) setSelectedAddress(match);
                        setIsAddingAddress(false);
                        addToast({ type: 'success', title: 'Address saved' });
                      }
                      return res;
                    }}
                  />
                </div>
              )}

              {!isAddingAddress && addressesList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500 hover:border-brand-400 hover:text-brand-600"
                >
                  + Add a delivery address
                </button>
              )}

              {/* Address Radio List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addressesList.map((addr, idx) => (
                  <div
                    key={addr._id || addr.id || idx}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected(addr)
                        ? 'border-brand-600 bg-brand-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 block">
                          {addr.isDefault ? 'Default address' : `Address ${idx + 1}`}
                        </span>
                        <p className="text-xs text-slate-600 leading-snug">{addr.line1}</p>
                        <p className="text-xs text-slate-500">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      {isSelected(addr) && (
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: Payment Options */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <h2 className="text-base font-black text-slate-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {/* UPI Option */}
                <div
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand-600 bg-brand-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600 text-xl">qr_code_2</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">UPI</h4>
                        <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Zero Surcharge
                    </span>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        maxLength={50}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-600 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Credit / Debit Card Option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-brand-600 bg-brand-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-brand-600 text-xl">credit_card</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Credit / Debit Card</h4>
                      <p className="text-[11px] text-slate-500">Visa, MasterCard, RuPay, Maestro</p>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-brand-600 bg-brand-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-600 text-xl">payments</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</h4>
                      <p className="text-[11px] text-slate-500">Pay with cash upon doorstep delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Review ({items.length} items)
              </h3>

              {/* Items preview list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-xs">
                {items.map((i) => {
                  const name = i.name || i.product?.name || 'UniCart Product';
                  const pricePaise = i.price || i.product?.price || 0;
                  const itemRupees = Math.round(pricePaise / 100);
                  const img =
                    i.images?.[0] ||
                    i.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                  const qty = i.qty || i.quantity || 1;

                  return (
                    <div key={i.productId || name} className="flex items-center justify-between gap-3">
                      <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-50 shrink-0" />
                      <div className="flex-1 truncate">
                        <p className="font-semibold text-slate-800 truncate">{name}</p>
                        <p className="text-[11px] text-slate-400">Qty: {qty}</p>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        ₹{(itemRupees * qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculations */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotalRupees.toLocaleString('en-IN')}</span>
                </div>
                {discountRupees > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon {couponCode ? `(${couponCode})` : ''}</span>
                    <span>-₹{discountRupees.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span>
                    {shippingRupees === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">₹{shippingRupees}</span>
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-brand-700">
                    ₹{grandTotalRupees.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-75 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Placing your order…</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    <span>Pay ₹{grandTotalRupees.toLocaleString('en-IN')} &amp; Place Order</span>
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
