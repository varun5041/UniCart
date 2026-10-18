import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { useToastStore } from '../store/useToastStore';
import type { Order, OrderStatus } from '../types';

type FilterTab = 'all' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export const OrdersPage: React.FC = () => {
  const { orders, cancelOrder } = useOrderStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const handleCancel = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order? Stock will be immediately restored.')) {
      const res = cancelOrder(orderId);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Order Cancelled',
          message: res.message
        });
      } else {
        addToast({
          type: 'error',
          title: 'Cancellation Failed',
          message: res.message
        });
      }
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    addToast({
      type: 'info',
      title: 'Invoice Downloaded',
      message: `Tax Invoice for ${order.id} downloaded successfully.`
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            Shipped & In Transit
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Payment Verified (Processing)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Cancelled & Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Orders & Purchases</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track shipments, download GST tax invoices, and manage past purchases
            </p>
          </div>

          <Link
            to="/"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">shopping_bag</span>
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Status Filter Tabs (Stitch Screen 8) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {(['all', 'paid', 'shipped', 'delivered', 'cancelled'] as FilterTab[]).map((tab) => {
            const count =
              tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
            const isSelected = activeTab === tab;

            const labels: Record<FilterTab, string> = {
              all: 'All Orders',
              paid: 'Processing',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled'
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No orders in this category</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven&apos;t placed any orders matching the selected filter status.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
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
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Total Amount
                      </span>
                      <span className="font-black text-indigo-700">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Ship To
                      </span>
                      <span className="font-bold text-slate-800">
                        {order.shippingAddress.city}, {order.shippingAddress.pincode}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Order ID
                      </span>
                      <span className="font-mono font-bold text-slate-900">{order.id}</span>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="px-6 py-4 bg-white border-b border-slate-100">
                  <div className="flex items-center justify-between max-w-2xl text-[11px] font-bold">
                    <div className="flex flex-col items-center gap-1 text-emerald-600">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      <span>Order Placed</span>
                    </div>
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        order.status !== 'pending_payment' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    ></div>

                    <div
                      className={`flex flex-col items-center gap-1 ${
                        order.status !== 'pending_payment' && order.status !== 'cancelled'
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          order.status !== 'pending_payment' && order.status !== 'cancelled'
                            ? 'bg-emerald-100'
                            : 'bg-slate-100'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Payment Verified</span>
                    </div>
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        order.status === 'shipped' || order.status === 'delivered'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    ></div>

                    <div
                      className={`flex flex-col items-center gap-1 ${
                        order.status === 'shipped' || order.status === 'delivered'
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          order.status === 'shipped' || order.status === 'delivered'
                            ? 'bg-emerald-100'
                            : 'bg-slate-100'
                        }`}
                      >
                        {order.status === 'delivered' ? '✓' : '●'}
                      </span>
                      <span>In Transit</span>
                    </div>
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    ></div>

                    <div
                      className={`flex flex-col items-center gap-1 ${
                        order.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          order.status === 'delivered' ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Order Items List */}
                <div className="p-6 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                        <div>
                          <Link
                            to={`/product/${item.productId}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-slate-500 mt-0.5">
                            Quantity: <strong>{item.qty}</strong> • Unit Price: ₹
                            {item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 block text-sm">
                          ₹{(item.price * item.qty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions Footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400 font-mono text-[11px]">
                    Payment Ref: {order.paymentRef || 'N/A'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Tax Invoice</span>
                    </button>

                    <button
                      onClick={() => setSelectedOrderForTracking(order)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">local_shipping</span>
                      <span>Live Tracking</span>
                    </button>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                    Tracking ID: DELHIVERY-{selectedOrderForTracking.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Close tracking modal"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1"></div>
                  <div>
                    <h5 className="font-bold text-slate-900">Arrived at Local Delivery Hub</h5>
                    <p className="text-slate-500">Andheri West Logistics Facility, Mumbai</p>
                    <span className="text-[10px] text-slate-400">Today, 08:30 AM</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mt-1"></div>
                  <div>
                    <h5 className="font-bold text-slate-900">In Transit from Central Sorting</h5>
                    <p className="text-slate-500">Bhiwandi Fulfillment Center, Maharashtra</p>
                    <span className="text-[10px] text-slate-400">Yesterday, 10:15 PM</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mt-1"></div>
                  <div>
                    <h5 className="font-bold text-slate-900">Order Dispatched by UniCart</h5>
                    <p className="text-slate-500">Warehouse Dock 4, Mumbai</p>
                    <span className="text-[10px] text-slate-400">Oct 16, 04:00 PM</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForTracking(null)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
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
