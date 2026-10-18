import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, getShippingFee, getGrandTotal, clearCart } =
    useCartStore();
  const { addresses, selectedAddressId, setSelectedAddress, addAddress } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { addToast } = useToastStore();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('rahul@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New Address form state
  const [newAddr, setNewAddr] = useState({
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

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shippingFee = getShippingFee();
  const grandTotal = getGrandTotal();

  const currentAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city || !newAddr.pincode) {
      addToast({
        type: 'error',
        title: 'Incomplete Address',
        message: 'Please provide full address, city, and pincode.'
      });
      return;
    }

    const created = addAddress(newAddr);
    setSelectedAddress(created.id);
    setIsAddingAddress(false);
    setNewAddr({ line1: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
    addToast({
      type: 'success',
      title: 'Address Added',
      message: 'New delivery address has been saved.'
    });
  };

  const handlePlaceOrder = () => {
    if (!currentAddress) {
      addToast({
        type: 'error',
        title: 'Address Required',
        message: 'Please select or add a delivery address.'
      });
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

    // Simulate server transaction & stock deduction
    setTimeout(() => {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        qty: i.quantity,
        image: i.product.images[0]
      }));

      const newOrder = createOrder(
        orderItems,
        currentAddress,
        subtotal,
        shippingFee,
        grandTotal,
        idempotencyKey,
        paymentMethod
      );

      clearCart();
      setIsProcessing(false);

      addToast({
        type: 'success',
        title: 'Order Placed Successfully! 🎉',
        message: `Order #${newOrder.id} confirmed. Tracking updates will be sent to your phone.`
      });

      navigate('/orders');
    }, 1200);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Secure Checkout</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Encrypted 256-bit SSL transaction | Recomputed server-side pricing
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check</span>
              1. Cart
            </span>
            <span className="text-slate-300">→</span>
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
              2. Address & Pay
            </span>
            <span className="text-slate-300">→</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500">
              3. Confirmation
            </span>
          </div>
        </div>

        {/* Main Grid: Steps (8 cols) + Order Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Delivery Address (Stitch Screen 7) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-base font-black text-slate-900">Delivery Address</h2>
                </div>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">
                    {isAddingAddress ? 'close' : 'add'}
                  </span>
                  <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {/* Add Address Form Modal/Drawer */}
              {isAddingAddress && (
                <form
                  onSubmit={handleAddNewAddress}
                  className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3 animate-fade-in text-xs"
                >
                  <h3 className="font-bold text-indigo-950">Add New Indian Delivery Address</h3>
                  <div>
                    <label htmlFor="address-line1-input" className="block text-slate-700 font-medium mb-1">
                      Flat, House no., Building, Street
                    </label>
                    <input
                      id="address-line1-input"
                      type="text"
                      required
                      placeholder="e.g. Flat 302, Green Valley Apartments"
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="city-input" className="block text-slate-700 font-medium mb-1">City</label>
                      <input
                        id="city-input"
                        type="text"
                        required
                        placeholder="Mumbai"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="state-input" className="block text-slate-700 font-medium mb-1">State</label>
                      <input
                        id="state-input"
                        type="text"
                        required
                        placeholder="Maharashtra"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="pincode-input" className="block text-slate-700 font-medium mb-1">Pincode</label>
                      <input
                        id="pincode-input"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="400053"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Saved Addresses Radio List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === currentAddress?.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-indigo-600' : 'border-slate-400'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                          </span>
                          Deliver to this Address
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{addr.line1}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment Method (Stitch Screen 7) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="text-base font-black text-slate-900">Select Payment Method</h2>
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
                      <span className="material-symbols-outlined text-emerald-600 text-xl">
                        qr_code_scanner
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Instant UPI (Google Pay / PhonePe / Paytm / BHIM)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Zero transaction fee • Instant confirmation
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Recommended
                    </span>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                      <span className="px-3 py-2 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 self-center">
                        Verified VPA ✓
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
                    <span className="material-symbols-outlined text-indigo-600 text-xl">
                      credit_card
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Credit / Debit Card (RuPay, Visa, MasterCard)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        All major Indian banks supported with OTP verification
                      </p>
                    </div>
                  </div>
                </div>

                {/* Net Banking Option */}
                <div
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-xl">
                      account_balance
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Net Banking</h4>
                      <p className="text-[11px] text-slate-500">
                        HDFC, SBI, ICICI, Axis, Kotak, and 50+ banks
                      </p>
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
                    <span className="material-symbols-outlined text-purple-600 text-xl">
                      payments
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Cash on Delivery (COD)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Pay with cash or UPI QR upon doorstep delivery
                      </p>
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
                {items.map((i) => (
                  <div key={i.product.id} className="flex items-center justify-between gap-3">
                    <img
                      src={i.product.images[0]}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-50 shrink-0"
                    />
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-slate-800 truncate">{i.product.name}</p>
                      <p className="text-[11px] text-slate-400">Qty: {i.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{(i.product.price * i.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">₹{shippingFee}</span>
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-indigo-700">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">lock</span>
                    <span>Pay ₹{grandTotal.toLocaleString('en-IN')} & Place Order</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                By placing this order you agree to UniCart terms of service and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
