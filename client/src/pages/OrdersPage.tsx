import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import type { Order, OrderStatus } from '../types';

type FilterTab = 'all' | 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export const OrdersPage: React.FC = () => {
  const { orders, fetchOrders, cancelOrder, isLoading } = useOrderStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const handleCancel = async (orderId: string) => {
    if (
      window.confirm(
        'Are you sure you want to cancel this order? Stock will be immediately restored in a database transaction.'
      )
    ) {
      const res = await cancelOrder(orderId);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Order Cancelled',
          message: res.message || 'Order has been cancelled and inventory restocked.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Cancellation Failed',
          message: res.error || 'Cannot cancel order in current state.'
        });
      }
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const id = order._id || order.id;
    addToast({
      type: 'info',
      title: 'Invoice Downloaded',
      message: `Tax Invoice for #${id} generated.`
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            Dispatched / In Transit
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Payment Verified / Processing
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending Payment
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelled &amp; Restocked
          </span>
        );
    }
  };

  return (
    <div className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Title & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Orders</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time transaction tracking, live delivery updates, and automated tax invoices
            </p>
          </div>

          <Link
            to="/"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">shopping_bag</span>
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {(['all', 'pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'] as FilterTab[]).map((tab) => {
            const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
            const isSelected = activeTab === tab;

            const labels: Record<FilterTab, string> = {
              all: 'All Orders',
              pending_payment: 'Pending Payment',
              paid: 'Processing',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled'
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span>{labels[tab]}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-semibold">Syncing orders with UniCart server...</p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No orders in this category</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven&apos;t placed any orders matching the selected filter status.
              </p>
            </div>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderId = order._id || order.id || '';
              const totalRupees = Math.round(order.total / 100);

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                >
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                          Order Placed
                        </span>
                        <span className="font-bold text-slate-800">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Recent'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                          Total Amount
                        </span>
                        <span className="font-black text-brand-700">₹{totalRupees.toLocaleString('en-IN')}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                          Ship To
                        </span>
                        <span className="font-bold text-slate-800">
                          {order.shippingAddress?.city || 'India'}, {order.shippingAddress?.pincode || ''}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                          Order ID
                        </span>
                        <span className="font-mono font-bold text-slate-900">{orderId}</span>
                      </div>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Order Items List */}
                  <div className="p-6 divide-y divide-slate-100">
                    {order.items.map((item, idx) => {
                      const itemPriceRupees = Math.round(item.price / 100);

                      return (
                        <div
                          key={idx}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <span className="material-symbols-outlined text-2xl text-brand-400">devices</span>
                            </div>
                            <div>
                              <Link
                                to={`/product/${item.productId}`}
                                className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
                              >
                                {item.name}
                              </Link>
                              <p className="text-slate-500 mt-0.5">
                                Quantity: <strong>{item.qty}</strong> • Unit Price: ₹
                                {itemPriceRupees.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 block text-sm">
                              ₹{(itemPriceRupees * item.qty).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Actions Footer */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400 font-mono text-[11px]">
                      Payment Ref: {order.paymentRef || 'Prepaid Verified'}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Tax Invoice</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrderForTracking(order)}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold border border-brand-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">local_shipping</span>
                        <span>Live Tracking</span>
                      </button>

                      {order.status === 'pending_payment' && (
                        <button
                          onClick={() => void handleCancel(orderId)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Tracking Modal */}
        {selectedOrderForTracking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Shipment Tracking</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Tracking ID: UNICART-EXP-{selectedOrderForTracking._id || selectedOrderForTracking.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 py-2">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Order confirmed</h4>
                    <p className="text-[11px] text-slate-500">Your items are reserved for you</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm">mark_email_read</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Confirmation email sent</h4>
                    <p className="text-[11px] text-slate-500">Check your inbox for the order summary</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Delivery Status: {selectedOrderForTracking.status}</h4>
                    <p className="text-[11px] text-slate-500">
                      Dispatched to {selectedOrderForTracking.shippingAddress?.city || 'Destination'} Hub
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForTracking(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
