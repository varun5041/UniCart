import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';
import type { Address } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discountPaise, getShippingFee, getGrandTotal, clearCart } =
    useCartStore();
  const { user, isAuthenticated, selectedAddress, setSelectedAddress, addAddress } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { addToast } = useToastStore();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('rahul@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New Address form state
  const [newAddr, setNewAddr] = useState<Omit<Address, '_id' | 'id'>>({
    line1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false
  });

  // Unique Idempotency Key generated per checkout attempt to prevent double debits
  const [idempotencyKey] = useState(
    () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const subtotalRupees = Math.round(subtotal / 100);
  const discountRupees = Math.round(discountPaise / 100);
  const shippingRupees = Math.round(getShippingFee() / 100);
  const grandTotalRupees = Math.round(getGrandTotal() / 100);

  const addressesList: Address[] = user?.addresses || [
    {
      id: 'addr-001',
      line1: 'Flat 402, Sunshine Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      country: 'India',
      isDefault: true
    }
  ];

  const currentAddress: Address =
    selectedAddress || addressesList[0];

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city || !newAddr.pincode) {
      addToast({
        type: 'error',
        title: 'Incomplete Address',
        message: 'Please provide full address, city, and pincode.'
      });
      return;
    }

    if (isAuthenticated) {
      await addAddress(newAddr);
    }
    setSelectedAddress({ ...newAddr, id: `addr_${Date.now()}` });
    setIsAddingAddress(false);
    setNewAddr({ line1: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
    addToast({
      type: 'success',
      title: 'Address Saved',
      message: 'Delivery address has been updated.'
    });
  };

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

    setIsProcessing(true);

    try {
      const res = await createOrder(currentAddress, idempotencyKey, true);
      setIsProcessing(false);

      if (res.success && res.order) {
        await clearCart();
        addToast({
          type: 'success',
          title: 'Order Placed Successfully! 🎉',
          message: `Order #${res.order._id || res.order.id} confirmed. Email confirmation dispatched.`
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
      <div className="bg-[#FAF8FF] min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium text-sm">No items in your cart to checkout.</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Steps */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Secure Checkout</h1>
            <p className="text-xs text-slate-500 mt-1">
              Stateless transactional order with atomic stock decrement &amp; BullMQ worker notification
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
              Cart
            </span>
            <span className="text-slate-300">──</span>
            <span className="flex items-center gap-1 text-indigo-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
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
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <h2 className="text-base font-black text-slate-900">Delivery Address</h2>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Add New Address
                  </button>
                )}
              </div>

              {/* Add Address Form Modal / Inline */}
              {isAddingAddress && (
                <form
                  onSubmit={handleAddNewAddress}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    New Shipping Address
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="House / Flat / Street (e.g. 102 Crystal Residency)"
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        required
                        className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        required
                        className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Pincode (6 digits)"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        required
                        maxLength={6}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                      <input
                        type="text"
                        value="India"
                        disabled
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-xs hover:bg-indigo-700"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Address Radio List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addressesList.map((addr, idx) => (
                  <div
                    key={addr.id || idx}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      (currentAddress.line1 === addr.line1)
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 block">Home / Office</span>
                        <p className="text-xs text-slate-600 leading-snug">{addr.line1}</p>
                        <p className="text-xs text-slate-500">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      {(currentAddress.line1 === addr.line1) && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
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
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
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
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600 text-xl">qr_code_2</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">UPI Instant Mock Payment</h4>
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
                        placeholder="username@bank"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 font-mono"
                      />
                      <span className="px-3 py-2 text-xs font-bold bg-slate-100 rounded-xl text-slate-600">
                        Verified ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Credit / Debit Card Option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-indigo-600 text-xl">credit_card</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Credit / Debit Card (Mock)</h4>
                      <p className="text-[11px] text-slate-500">Visa, MasterCard, RuPay, Maestro</p>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-indigo-600 bg-indigo-50/20'
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

            {/* Architecture Idempotency Notice */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Architecture Guarantee:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px]">
                  IDEMPOTENT_CHECKOUT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                Header: <span className="text-indigo-300 font-bold">{idempotencyKey}</span>
                <br />
                Duplicate requests with this key safely return the original order without double debiting.
              </p>
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
                  const itemRupees = Math.round(pricePaise > 1000 ? pricePaise / 100 : pricePaise);
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
                    <span>Discount</span>
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
                  <span className="text-2xl font-black text-indigo-700">
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
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">lock</span>
                    <span>Pay ₹{grandTotalRupees.toLocaleString('en-IN')} &amp; Place Order</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Protected by 256-bit encryption. ACID transactions ensure stock integrity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
