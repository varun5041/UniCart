import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCreateProductInput, type AdminCreateCategoryInput } from '../../api/admin';
import { productsApi } from '../../api/products';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import type { OrderStatus, Product, Category } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'logs'>('products');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    mode: 'selected' | 'all';
    count: number;
  } | null>(null);

  // Category creation states
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<AdminCreateCategoryInput>({ name: '', description: '' });

  // Product category selection mode inside create modal
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>('existing');
  const [newCategoryName, setNewCategoryName] = useState('');

  // New product form state
  const [newProd, setNewProd] = useState({
    name: '',
    category: '',
    priceRupees: 999,
    stock: 20,
    description: '',
    imageUrl: ''
  });

  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');

  // TanStack Query: Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      return res.data || [];
    },
    enabled: isAdmin
  });

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

  // Mutation: Create Category
  const createCategoryMutation = useMutation({
    mutationFn: async (input: AdminCreateCategoryInput) => {
      return adminApi.createCategory(input);
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryForm({ name: '', description: '' });
      setIsCategoryFormOpen(false);
      addToast({
        type: 'success',
        title: 'Category Created',
        message: `Category '${res.data?.name || ''}' added successfully.`
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to create category'
      });
    }
  });

  // Mutation: Delete Category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteCategory(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        type: 'info',
        title: 'Category Deleted',
        message: 'Category removed successfully from database.'
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to delete category'
      });
    }
  });

  // Mutation: Create Product
  const createProductMutation = useMutation({
    mutationFn: async (input: AdminCreateProductInput) => {
      return adminApi.createProduct(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateModalOpen(false);
      setNewProd({
        name: '',
        category: '',
        priceRupees: 999,
        stock: 20,
        description: '',
        imageUrl: ''
      });
      setNewCategoryName('');
      setCategoryMode('existing');
      addToast({
        type: 'success',
        title: 'Product Created',
        message: 'Product catalog cache updated and inventory initialized.'
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
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({
        type: 'info',
        title: 'Product Deleted',
        message: 'Product removed from catalogue and cache updated.'
      });
    }
  });

  // Mutation: Bulk Delete Products
  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload: { ids?: string[]; all?: boolean; hardDelete?: boolean } | string[]) => {
      return adminApi.bulkDeleteProducts(payload);
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      const count = res.data?.count ?? selectedProductIds.length;
      setSelectedProductIds([]);
      setConfirmDeleteModal(null);
      addToast({
        type: 'info',
        title: 'Catalogue Purged',
        message: `Successfully removed ${count} product(s) from database.`
      });
    },
    onError: (err: any) => {
      setConfirmDeleteModal(null);
      addToast({
        type: 'error',
        title: 'Bulk Deletion Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to bulk remove products'
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

  const handleOpenCreateModal = () => {
    if (categoriesData && categoriesData.length > 0) {
      setCategoryMode('existing');
      setNewProd((prev) => ({
        ...prev,
        category: prev.category || categoriesData[0]?.name || ''
      }));
    } else {
      setCategoryMode('new');
      setNewProd((prev) => ({ ...prev, category: '' }));
    }
    setNewCategoryName('');
    setIsCreateModalOpen(true);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCategory = (categoryMode === 'new' ? newCategoryName : newProd.category).trim();

    if (!newProd.name.trim() || !newProd.description.trim() || !effectiveCategory) {
      addToast({
        type: 'error',
        title: 'Incomplete Form',
        message: 'Product name, description, and category are required.'
      });
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
    createProductMutation.mutate({
      name: newProd.name.trim(),
      description: newProd.description.trim(),
      price: Math.max(100, Math.round(newProd.priceRupees * 100)), // convert to paise
      stock: Math.max(0, newProd.stock),
      category: effectiveCategory,
      images: [newProd.imageUrl.trim() || defaultImg]
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
              onClick={handleOpenCreateModal}
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
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Categories ({categoriesData?.length || 0})
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
        {activeTab === 'products' && (() => {
          const productList = productsData || [];
          const validProductIds = productList.map((p: Product) => p._id || p.id || '').filter(Boolean);
          const isAllProductsSelected =
            validProductIds.length > 0 && selectedProductIds.length === validProductIds.length;
          const isSomeProductsSelected =
            selectedProductIds.length > 0 && !isAllProductsSelected;

          const handleToggleSelectAll = () => {
            if (isAllProductsSelected) {
              setSelectedProductIds([]);
            } else {
              setSelectedProductIds([...validProductIds]);
            }
          };

          const handleToggleProduct = (id: string) => {
            setSelectedProductIds((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
          };

          return (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Catalogue Management</h3>
                    <p className="text-xs text-slate-500">Live prices &amp; inventory stocks synced in Redis</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-base text-indigo-600">
                        {isAllProductsSelected ? 'deselect' : 'select_all'}
                      </span>
                      <span>{isAllProductsSelected ? 'Deselect All' : 'Select All'}</span>
                    </button>

                    {selectedProductIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteModal({
                            open: true,
                            mode: 'selected',
                            count: selectedProductIds.length
                          });
                        }}
                        disabled={bulkDeleteMutation.isPending}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>
                          {bulkDeleteMutation.isPending
                            ? 'Deactivating...'
                            : `Delete Selected (${selectedProductIds.length})`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteModal({
                            open: true,
                            mode: 'all',
                            count: validProductIds.length
                          });
                        }}
                        disabled={bulkDeleteMutation.isPending}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                        title="Permanently remove all seeded products and categories from database"
                      >
                        <span className="material-symbols-outlined text-base text-rose-600">delete_forever</span>
                        <span>Purge Seeded Data / Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Selection Notification Bar */}
                {selectedProductIds.length > 0 && (
                  <div className="bg-indigo-50/90 border-b border-indigo-100 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-indigo-900 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {selectedProductIds.length}
                      </span>
                      <span>
                        <strong>{selectedProductIds.length}</strong> of <strong>{validProductIds.length}</strong> items selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteModal({
                            open: true,
                            mode: 'selected',
                            count: selectedProductIds.length
                          });
                        }}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete selected
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        {isAllProductsSelected ? 'Clear selection' : `Select all ${validProductIds.length} products`}
                      </button>
                    </div>
                  </div>
                )}

                {isProductsLoading ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-semibold">
                    Loading catalogue...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={isAllProductsSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isSomeProductsSelected;
                              }}
                              onChange={handleToggleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              title={isAllProductsSelected ? 'Deselect All' : 'Select All'}
                            />
                          </th>
                          <th className="p-4">Product</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price (₹)</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(productList || []).map((prod: Product) => {
                          const pricePaise = prod.price || 0;
                          const priceRupees = Math.round(pricePaise > 1000 ? pricePaise / 100 : pricePaise);
                          const id = prod._id || prod.id || '';
                          const isSelected = selectedProductIds.includes(id);

                          return (
                            <tr
                              key={id}
                              className={`transition-colors ${
                                isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="p-4 w-12 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleProduct(id)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
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
                                {typeof prod.category === 'object' && prod.category !== null ? prod.category.name : prod.category || 'General'}
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
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteProductMutation.mutate(id);
                                  }}
                                  disabled={deleteProductMutation.isPending}
                                  className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer disabled:opacity-50"
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
          );
        })()}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Quick Create Button */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">Custom Categories</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700">
                    {categoriesData?.length || 0} active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Only categories created by admins exist in UniCart. Create new categories anytime or while adding a product.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryFormOpen(!isCategoryFormOpen)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {isCategoryFormOpen ? 'close' : 'add'}
                </span>
                <span>{isCategoryFormOpen ? 'Close Form' : 'New Category'}</span>
              </button>
            </div>

            {/* Create Category Inline Card */}
            {isCategoryFormOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!categoryForm.name.trim()) {
                    addToast({ type: 'error', title: 'Missing Name', message: 'Category name is required.' });
                    return;
                  }
                  createCategoryMutation.mutate({
                    name: categoryForm.name.trim(),
                    description: categoryForm.description?.trim() || undefined
                  });
                }}
                className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-sm space-y-4 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700">
                    Create New Category
                  </h4>
                  <span className="text-[11px] text-slate-400">Slugs are auto-generated from the name</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Mechanical Keyboards, Gaming Mice, Monitors..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={categoryForm.description || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="e.g. Custom mechanical switches, keycaps, and accessories"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryFormOpen(false);
                      setCategoryForm({ name: '', description: '' });
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {createCategoryMutation.isPending ? 'Creating...' : 'Save Category'}
                  </button>
                </div>
              </form>
            )}

            {/* Categories Table / List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {(!categoriesData || categoriesData.length === 0) ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">category</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">No Categories in Database</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are no fixed categories. Click &ldquo;New Category&rdquo; above or add one directly while creating a product.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCategoryFormOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-xs"
                  >
                    + Create First Category
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Category Name</th>
                        <th className="p-4">Slug (URL Key)</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Assigned Products</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoriesData.map((cat: Category) => {
                        const catId = cat._id || cat.id || '';
                        const catName = cat.name;
                        const catSlug = cat.slug;

                        // Count products attached to this category
                        const attachedProductsCount = (productsData || []).filter((p: Product) => {
                          if (typeof p.category === 'object' && p.category !== null) {
                            return p.category._id === catId || p.category.slug === catSlug || p.category.name === catName;
                          }
                          return p.category === catId || p.category === catSlug || p.category === catName;
                        }).length;

                        return (
                          <tr key={catId || catSlug} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="material-symbols-outlined text-indigo-500 text-base">folder</span>
                              <span>{catName}</span>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-600">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {catSlug}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 max-w-xs truncate">
                              {cat.description || '—'}
                            </td>
                            <td className="p-4 text-center font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  attachedProductsCount > 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {attachedProductsCount} product{attachedProductsCount === 1 ? '' : 's'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                disabled={deleteCategoryMutation.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete category "${catName}"? This will permanently remove it from the database.`
                                    )
                                  ) {
                                    deleteCategoryMutation.mutate(catId);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer disabled:opacity-50"
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

        {/* TAB 3: ORDERS MANAGEMENT & STATUS TRANSITIONS */}
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

                {/* Category Selection / Creation */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-800 font-bold text-xs">
                      Category *
                    </label>
                    {categoriesData && categoriesData.length > 0 && (
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryMode('existing');
                            if (!newProd.category && categoriesData.length > 0) {
                              setNewProd({ ...newProd, category: categoriesData[0].name });
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            categoryMode === 'existing'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Choose Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryMode('new')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            categoryMode === 'new'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          + Create New
                        </button>
                      </div>
                    )}
                  </div>

                  {categoryMode === 'existing' && categoriesData && categoriesData.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        required
                        value={newProd.category}
                        onChange={(e) => {
                          if (e.target.value === '__CREATE_NEW__') {
                            setCategoryMode('new');
                          } else {
                            setNewProd({ ...newProd, category: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white"
                      >
                        <option value="">-- Select an Existing Category --</option>
                        {categoriesData.map((cat: Category) => (
                          <option key={cat._id || cat.slug || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                        <option value="__CREATE_NEW__">+ Create a new category...</option>
                      </select>
                      <p className="text-[11px] text-slate-500">
                        Select one of the {categoriesData.length} categories registered by admin.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter new category name (e.g. Mechanical Keyboards)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>A new category will be created and saved to DB.</span>
                        {categoriesData && categoriesData.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryMode('existing')}
                            className="text-indigo-600 font-bold hover:underline cursor-pointer"
                          >
                            ← Choose from existing ({categoriesData.length})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newProd.imageUrl}
                    onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                    placeholder="https://... (or leave empty for default)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
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

        {/* Bulk Delete In-App Confirmation Modal */}
        {confirmDeleteModal?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">delete_sweep</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {confirmDeleteModal.mode === 'all'
                      ? 'Permanently Purge All Products & Categories?'
                      : `Permanently Delete ${confirmDeleteModal.count} Selected Product(s)?`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Admin Catalogue Operation</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                {confirmDeleteModal.mode === 'all'
                  ? 'Are you sure you want to permanently delete ALL products and categories from the database? This purges any seeded data and leaves a completely clean store where only products added by you will be visible.'
                  : `Are you sure you want to permanently delete these ${confirmDeleteModal.count} selected product(s) from the database?`}
              </p>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(null)}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteModal.mode === 'all') {
                      bulkDeleteMutation.mutate({ all: true, hardDelete: true });
                    } else {
                      bulkDeleteMutation.mutate({ ids: selectedProductIds, hardDelete: true });
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>
                    {bulkDeleteMutation.isPending
                      ? 'Deleting...'
                      : confirmDeleteModal.mode === 'all'
                      ? 'Yes, Purge All'
                      : 'Yes, Delete Selected'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
