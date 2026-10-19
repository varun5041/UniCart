import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCreateProductInput } from '../../api/admin';
import { productsApi } from '../../api/products';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import type { OrderStatus, Product } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'logs'>('products');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');

  // New product form state
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'electronics',
    priceRupees: 1999,
    stock: 50,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
  });

  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');

  // TanStack Query: Fetch Orders
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin-orders', orderStatusFilter],
    queryFn: async () => {
      const res = await adminApi.listOrders({
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        limit: 50
      });
      return res.data || [];
    },
    enabled: isAdmin
  });

  // TanStack Query: Fetch Products
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await productsApi.getProducts({ limit: 50 });
      return res.data || [];
    },
    enabled: isAdmin
  });

  // TanStack Query: Fetch Audit Logs
  const { data: auditLogsData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await adminApi.listAuditLogs({ limit: 30 });
      return res.data || [];
    },
    enabled: isAdmin
  });

  // Mutation: Create Product
  const createProductMutation = useMutation({
    mutationFn: async (input: AdminCreateProductInput) => {
      return adminApi.createProduct(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setNewProd({
        name: '',
        category: 'electronics',
        priceRupees: 1999,
        stock: 50,
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
      });
      addToast({
        type: 'success',
        title: 'Product Created',
        message: 'Product catalog cache version bumped and inventory initialized.'
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to create product'
      });
    }
  });

  // Mutation: Update Order Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      return adminApi.updateOrderStatus(orderId, status);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      addToast({
        type: 'success',
        title: 'Order Status Updated',
        message: `Order #${variables.orderId.slice(-6)} transitioned to '${variables.status}'.`
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Invalid Transition',
        message: err.response?.data?.error?.message || 'Status transition rejected by state machine.'
      });
    }
  });

  // Mutation: Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteProduct(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        type: 'info',
        title: 'Product Deleted',
        message: 'Product deactivated and catalogue cache updated.'
      });
    }
  });

  // Guard: Admin role verification
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Access Denied (403)</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You must be authenticated with the <strong>admin</strong> role to view and manage UniCart administrative controls.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/login?redirect=/admin')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
            >
              Sign In as Admin
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.description) {
      addToast({ type: 'error', title: 'Incomplete Form', message: 'Name and description are required.' });
      return;
    }

    createProductMutation.mutate({
      name: newProd.name,
      description: newProd.description,
      price: Math.round(newProd.priceRupees * 100), // convert to paise
      stock: newProd.stock,
      category: newProd.category,
      images: [newProd.imageUrl]
    });
  };

  const getNextAllowedTransitions = (status: OrderStatus): OrderStatus[] => {
    switch (status) {
      case 'pending_payment':
        return ['paid', 'cancelled'];
      case 'paid':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered', 'cancelled'];
      default:
        return [];
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-500 font-mono">UniCart Control Center</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Store Administration</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_box</span>
              <span>Create Product</span>
            </button>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              View Storefront
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Products Inventory ({productsData?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Orders &amp; Fulfillment ({ordersData?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail ({auditLogsData?.length || 0})
          </button>
        </div>

        {/* TAB 1: PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Catalogue Management</h3>
                  <p className="text-xs text-slate-500">Live prices &amp; inventory stocks synced in Redis</p>
                </div>
              </div>

              {isProductsLoading ? (
                <div className="p-12 text-center text-xs text-slate-500 font-semibold">
                  Loading catalogue...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price (₹)</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(productsData || []).map((prod: Product) => {
                        const pricePaise = prod.price || 0;
                        const priceRupees = Math.round(pricePaise > 1000 ? pricePaise / 100 : pricePaise);
                        const id = prod._id || prod.id || '';

                        return (
                          <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              <img
                                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-xs">{prod.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono">slug: {prod.slug}</span>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-slate-700 capitalize">
                              {typeof prod.category === 'object' ? prod.category.name : prod.category}
                            </td>
                            <td className="p-4 font-black text-slate-900">₹{priceRupees.toLocaleString('en-IN')}</td>
                            <td className="p-4 font-semibold text-slate-700">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  prod.stock > 10
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : prod.stock > 0
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {prod.stock} units
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Deactivate product '${prod.name}'?`)) {
                                    deleteProductMutation.mutate(id);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                              >
                                Delete
                              </button>
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

        {/* TAB 2: ORDERS MANAGEMENT & STATUS TRANSITIONS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['all', 'pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {isOrdersLoading ? (
                <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading orders...</div>
              ) : (ordersData || []).length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 font-semibold">No orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Items</th>
                        <th className="p-4">Total (₹)</th>
                        <th className="p-4">Current Status</th>
                        <th className="p-4">Transition Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ordersData || []).map((order) => {
                        const orderId = order._id || order.id || '';
                        const totalRupees = Math.round(order.total > 1000 ? order.total / 100 : order.total);
                        const nextAllowed = getNextAllowedTransitions(order.status);

                        return (
                          <tr key={orderId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-900">
                              #{orderId.slice(-8)}
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-slate-800 block">
                                {order.shippingAddress?.city || 'Customer'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {order.userId?.slice(-6) || 'N/A'}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-700">
                              {order.items?.length || 0} items
                            </td>
                            <td className="p-4 font-black text-slate-900">
                              ₹{totalRupees.toLocaleString('en-IN')}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  order.status === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : order.status === 'shipped'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : order.status === 'paid'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : order.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {nextAllowed.length > 0 ? (
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateStatusMutation.mutate({
                                        orderId,
                                        status: e.target.value as OrderStatus
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-600 cursor-pointer shadow-xs"
                                >
                                  <option value="" disabled>
                                    Update to...
                                  </option>
                                  {nextAllowed.map((ns) => (
                                    <option key={ns} value={ns}>
                                      → {ns}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">Terminal state</span>
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

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Security Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable 90-day TTL event log of administrative actions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(auditLogsData || []).map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-bold text-indigo-700">{log.action}</td>
                      <td className="p-4 text-slate-600">{log.target || 'N/A'}</td>
                      <td className="p-4 text-slate-700">{log.actorId?.email || 'System'}</td>
                      <td className="p-4 text-slate-500">{log.ip || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREATE PRODUCT MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-base">Add New Product</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Sony WH-1000XM6 Wireless"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                      placeholder="e.g. electronics"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProd.stock}
                      onChange={(e) => setNewProd({ ...newProd, stock: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Retail Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProd.priceRupees}
                      onChange={(e) => setNewProd({ ...newProd, priceRupees: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Image URL</label>
                    <input
                      type="url"
                      required
                      value={newProd.imageUrl}
                      onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    placeholder="Enter detailed technical specifications and features..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {createProductMutation.isPending ? 'Publishing...' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
