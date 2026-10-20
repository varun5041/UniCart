import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi, type AdminCreateProductInput } from '../../api/admin';
import { useCategories } from '../../lib/categories';
import { useToastStore } from '../../store/useToastStore';
import { formatRupees, getPricing, getProductId, type Product } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../components/ProductCard';
import { ConfirmDialog, Modal, Pager } from './shared';
import { apiErrorMessage, inputClass } from './adminUtils';

type StatusFilter = 'all' | 'listed' | 'unlisted';

interface ProductForm {
  name: string;
  category: string;
  mrpRupees: string;
  discountPercent: string;
  stock: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  mrpRupees: '',
  discountPercent: '0',
  stock: '0',
  imageUrl: '',
  description: '',
  isActive: true
};

function toForm(p: Product): ProductForm {
  const { mrp, discount } = getPricing(p);
  return {
    name: p.name,
    category: typeof p.category === 'object' ? p.category.slug : String(p.category),
    mrpRupees: String(mrp / 100),
    discountPercent: String(discount),
    stock: String(p.stock),
    imageUrl: p.images?.[0] || '',
    description: p.description,
    isActive: p.isActive !== false
  };
}

function validateForm(f: ProductForm): string | null {
  if (f.name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!f.category) return 'Choose a category';
  const mrp = Number(f.mrpRupees);
  if (!Number.isFinite(mrp) || mrp <= 0) return 'MRP must be greater than 0';
  const d = Number(f.discountPercent);
  if (!Number.isInteger(d) || d < 0 || d > 90) return 'Discount must be a whole number from 0 to 90';
  const stock = Number(f.stock);
  if (!Number.isInteger(stock) || stock < 0) return 'Stock must be a whole number, 0 or more';
  if (f.imageUrl && !/^https?:\/\/\S+$/i.test(f.imageUrl.trim())) return 'Image must be a valid http(s) URL';
  if (f.description.trim().length < 10) return 'Description must be at least 10 characters';
  return null;
}

export const ProductsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { data: categories = [] } = useCategories();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: ProductForm } | null>(null);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<{ mode: 'one' | 'selected' | 'all'; id?: string; count: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', status, search, page],
    queryFn: async () => {
      const res = await adminApi.listProducts({ status, q: search || undefined, page, limit: 20 });
      return { items: res.data ?? [], total: res.meta?.total ?? 0, pages: res.meta?.pages ?? 1 };
    },
    placeholderData: keepPreviousData
  });
  const products = data?.items ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: ProductForm }) => {
      const payload: AdminCreateProductInput = {
        name: form.name.trim(),
        category: form.category,
        mrp: Math.round(Number(form.mrpRupees) * 100),
        discountPercent: Number(form.discountPercent),
        stock: Number(form.stock),
        description: form.description.trim(),
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        isActive: form.isActive
      };
      return id ? adminApi.updateProduct(id, payload) : adminApi.createProduct(payload);
    },
    onSuccess: (_res, vars) => {
      refresh();
      setEditing(null);
      addToast({ type: 'success', title: vars.id ? 'Product updated' : 'Product created' });
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save product'))
  });

  const listingMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateProduct(id, { isActive }),
    onSuccess: (_res, vars) => {
      refresh();
      addToast({
        type: 'info',
        title: vars.isActive ? 'Product listed' : 'Product unlisted',
        message: vars.isActive ? 'It is visible in the store again.' : 'It is hidden from customers but kept here.'
      });
    },
    onError: (err) => addToast({ type: 'error', title: 'Update failed', message: apiErrorMessage(err, 'Try again') })
  });

  const deleteMutation = useMutation({
    mutationFn: async (c: NonNullable<typeof confirm>) => {
      if (c.mode === 'one' && c.id) return adminApi.deleteProduct(c.id);
      return adminApi.bulkDeleteProducts(c.mode === 'all' ? { all: true } : { ids: selected });
    },
    onSuccess: () => {
      refresh();
      setSelected([]);
      setConfirm(null);
      addToast({ type: 'info', title: 'Product(s) deleted' });
    },
    onError: (err) => {
      setConfirm(null);
      addToast({ type: 'error', title: 'Delete failed', message: apiErrorMessage(err, 'Try again') });
    }
  });

  const ids = products.map(getProductId).filter(Boolean);
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));

  const openEditor = (product: Product | null) => {
    setFormError('');
    setEditing({
      id: product ? getProductId(product) : null,
      form: product ? toForm(product) : { ...EMPTY_FORM, category: categories[0]?.slug ?? '' }
    });
  };

  const submitEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const err = validateForm(editing.form);
    setFormError(err ?? '');
    if (!err) saveMutation.mutate(editing);
  };

  const f = editing?.form;
  const previewPrice =
    f && Number(f.mrpRupees) > 0
      ? Math.round(Number(f.mrpRupees) * (100 - (Number(f.discountPercent) || 0))) / 100
      : 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'listed', 'unlisted'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
                setSelected([]);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                status === s ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
          <input
            type="search"
            placeholder="Search by name"
            maxLength={100}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-48 rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 ? (
            <button
              onClick={() => setConfirm({ mode: 'selected', count: selected.length })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Delete selected ({selected.length})
            </button>
          ) : (
            ids.length > 0 && (
              <button
                onClick={() => setConfirm({ mode: 'all', count: data?.total ?? ids.length })}
                className="rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Delete all
              </button>
            )
          )}
          <button
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New product
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="p-12 text-center text-sm font-semibold text-slate-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="p-12 text-center text-sm font-semibold text-slate-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 p-3 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : ids)}
                    className="h-4 w-4 accent-brand-600"
                  />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const id = getProductId(p);
                const { mrp, discount, price } = getPricing(p);
                const listed = p.isActive !== false;
                return (
                  <tr key={id} className={selected.includes(id) ? 'bg-brand-50/50' : 'hover:bg-slate-50/60'}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.includes(id)}
                        onChange={() => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
                        className="h-4 w-4 accent-brand-600"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 object-cover" />
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{typeof p.category === 'object' ? p.category.name : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{formatRupees(mrp)}</td>
                    <td className="p-3">
                      {discount > 0 ? (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">{discount}% off</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">{formatRupees(price)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : p.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${listed ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                        {listed ? 'Listed' : 'Unlisted'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-right text-xs font-bold">
                      <button onClick={() => openEditor(p)} className="px-1.5 text-brand-600 hover:text-brand-800">
                        Edit
                      </button>
                      <button
                        onClick={() => listingMutation.mutate({ id, isActive: !listed })}
                        disabled={listingMutation.isPending}
                        className="px-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      >
                        {listed ? 'Unlist' : 'List'}
                      </button>
                      <button onClick={() => setConfirm({ mode: 'one', id, count: 1 })} className="px-1.5 text-rose-600 hover:text-rose-800">
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
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />

      {editing && f && (
        <Modal title={editing.id ? 'Edit product' : 'New product'} onClose={() => setEditing(null)} wide>
          <form onSubmit={submitEditor} noValidate className="space-y-4 text-sm">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Product name</span>
              <input className={inputClass} maxLength={200} value={f.name} onChange={(e) => setEditing({ ...editing, form: { ...f, name: e.target.value } })} />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Category</span>
                <select className={inputClass} value={f.category} onChange={(e) => setEditing({ ...editing, form: { ...f, category: e.target.value } })}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Stock</span>
                <input type="number" min={0} step={1} className={inputClass} value={f.stock} onChange={(e) => setEditing({ ...editing, form: { ...f, stock: e.target.value } })} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">MRP (₹)</span>
                <input type="number" min={1} step="0.01" className={inputClass} value={f.mrpRupees} onChange={(e) => setEditing({ ...editing, form: { ...f, mrpRupees: e.target.value } })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Discount (%)</span>
                <input type="number" min={0} max={90} step={1} className={inputClass} value={f.discountPercent} onChange={(e) => setEditing({ ...editing, form: { ...f, discountPercent: e.target.value } })} />
              </label>
              <div>
                <span className="mb-1 block text-xs font-bold text-slate-700">Selling price</span>
                <p className="rounded-xl bg-emerald-50 px-3 py-2 font-extrabold text-emerald-700">
                  ₹{previewPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Image URL</span>
              <input type="url" placeholder="https://…" className={inputClass} value={f.imageUrl} onChange={(e) => setEditing({ ...editing, form: { ...f, imageUrl: e.target.value } })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Description</span>
              <textarea rows={3} maxLength={5000} className={inputClass} value={f.description} onChange={(e) => setEditing({ ...editing, form: { ...f, description: e.target.value } })} />
            </label>
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.isActive} onChange={(e) => setEditing({ ...editing, form: { ...f, isActive: e.target.checked } })} />
              Listed (visible to customers)
            </label>
            {formError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 font-semibold text-rose-700">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={saveMutation.isPending} className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : editing.id ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.mode === 'all' ? 'Delete all products?' : `Delete ${confirm.count} product(s)?`}
          message={
            confirm.mode === 'all'
              ? 'Every product will be removed from the store and from this list. To hide a product temporarily, use Unlist instead.'
              : 'Deleted products are removed from the store and from this list. To hide a product temporarily, use Unlist instead.'
          }
          confirmLabel="Delete"
          busy={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};
