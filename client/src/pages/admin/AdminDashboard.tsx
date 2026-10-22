import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { formatRupees, type Order, type OrderStatus } from '../../types';
import { ProductsPanel } from './ProductsPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { CouponsPanel } from './CouponsPanel';
import { apiErrorMessage } from './adminUtils';

type Tab = 'products' | 'categories' | 'orders' | 'coupons' | 'activity';

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'products', icon: 'inventory_2', label: 'Products' },
  { id: 'categories', icon: 'category', label: 'Categories' },
  { id: 'orders', icon: 'receipt_long', label: 'Orders' },
  { id: 'coupons', icon: 'sell', label: 'Coupons' },
  { id: 'activity', icon: 'history', label: 'Activity' }
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700',
  paid: 'bg-sky-50 text-sky-700',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

const ACTION_LABELS: Record<string, string> = {
  'order.status.update': 'Order status changed',
  'coupon.create': 'Coupon created',
  'coupon.update': 'Coupon updated',
  'coupon.delete': 'Coupon deleted'
};

function customerOf(order: Order): { name: string; email: string } {
  const u = order.userId as unknown;
  if (u && typeof u === 'object') {
    const obj = u as { name?: string; email?: string };
    return { name: obj.name || 'Customer', email: obj.email || '' };
  }
  return { name: order.shippingAddress?.city || 'Customer', email: '' };
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');

  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin-orders', orderStatusFilter],
    queryFn: async () => {
      const res = await adminApi.listOrders({
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        limit: 50
      });
      return res.data || [];
    },
    enabled: isAdmin && activeTab === 'orders'
  });

  const { data: activity } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await adminApi.listAuditLogs({ limit: 50 })).data || [],
    enabled: isAdmin && activeTab === 'activity'
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      addToast({
        type: 'success',
        title: 'Order updated',
        message: `Order #${vars.orderId.slice(-8).toUpperCase()} is now ${vars.status.replace('_', ' ')}.`
      });
    },
    onError: (err) =>
      addToast({ type: 'error', title: 'Could not update order', message: apiErrorMessage(err, 'Try again') })
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">Admins only</h2>
          <p className="text-sm text-slate-500">Sign in with an administrator account to manage the store.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => navigate('/login')} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white">
              Sign in
            </button>
            <Link to="/" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <Link to="/" className="shrink-0 transition-transform hover:scale-105" title="Go to storefront">
              <img src="/logo.png" alt="UniCart" className="h-10 w-auto object-contain" />
            </Link>
            <div className="border-l border-slate-200 pl-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Admin Control Center</p>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Store Dashboard</h1>
            </div>
          </div>
          <Link to="/" className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:self-auto">
            View storefront
          </Link>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-slate-200/70">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === tab.id ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && <ProductsPanel />}
        {activeTab === 'categories' && <CategoriesPanel />}
        {activeTab === 'coupons' && <CouponsPanel />}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {(['all', 'pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                    orderStatusFilter === st ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
              {isOrdersLoading ? (
                <p className="p-12 text-center text-sm font-semibold text-slate-500">Loading orders…</p>
              ) : (ordersData || []).length === 0 ? (
                <p className="p-12 text-center text-sm font-semibold text-slate-500">No orders found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-3">Order</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ordersData || []).map((order) => {
                        const orderId = order._id || order.id || '';
                        const customer = customerOf(order);
                        const next = NEXT_STATUS[order.status] ?? [];
                        return (
                          <tr key={orderId} className="hover:bg-slate-50/60">
                            <td className="p-3">
                              <span className="font-mono text-xs font-bold text-slate-900">#{orderId.slice(-8).toUpperCase()}</span>
                              <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{customer.name}</p>
                              {customer.email && <p className="text-xs text-slate-400">{customer.email}</p>}
                            </td>
                            <td className="p-3 text-slate-600">{order.items?.length || 0}</td>
                            <td className="p-3">
                              <p className="font-extrabold text-slate-900">{formatRupees(order.total)}</p>
                              {order.couponCode && <p className="font-mono text-[11px] text-emerald-600">{order.couponCode}</p>}
                            </td>
                            <td className="p-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[order.status]}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3">
                              {next.length > 0 ? (
                                <select
                                  defaultValue=""
                                  aria-label={`Update status for order ${orderId.slice(-8)}`}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateStatusMutation.mutate({ orderId, status: e.target.value as OrderStatus });
                                      e.target.value = '';
                                    }
                                  }}
                                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold focus:border-brand-500 focus:outline-none"
                                >
                                  <option value="" disabled>
                                    Mark as…
                                  </option>
                                  {next.map((ns) => (
                                    <option key={ns} value={ns}>
                                      {ns.replace('_', ' ')}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <h3 className="text-base font-extrabold text-slate-900">Recent activity</h3>
              <p className="text-sm text-slate-500">Changes made by admins to orders and coupons.</p>
            </div>
            {(activity || []).length === 0 ? (
              <p className="p-12 text-center text-sm font-semibold text-slate-500">No activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3">When</th>
                      <th className="p-3">What</th>
                      <th className="p-3">Item</th>
                      <th className="p-3">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activity || []).map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap p-3 text-slate-500">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-semibold text-slate-800">{ACTION_LABELS[log.action] ?? log.action}</td>
                        <td className="p-3 font-mono text-xs text-slate-600">{log.target || '—'}</td>
                        <td className="p-3 text-slate-600">{log.actorId?.name || log.actorId?.email || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
