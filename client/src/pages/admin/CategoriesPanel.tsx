import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCategoryInput } from '../../api/admin';
import { productsApi } from '../../api/products';
import { useToastStore } from '../../store/useToastStore';
import type { Category } from '../../types';
import { ConfirmDialog, Modal } from './shared';
import { apiErrorMessage, inputClass } from './adminUtils';
import { ImageUploadInput } from '../../components/ImageUploadInput';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const EMPTY_CATEGORY_FORM: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  image: ''
};

function toCategoryForm(c: Category): CategoryForm {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || ''
  };
}

export const CategoriesPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [editing, setEditing] = useState<{ id: string | null; form: CategoryForm } | null>(null);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories();
      return res.success && Array.isArray(res.data) ? res.data : [];
    }
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: CategoryForm }) => {
      const payload: AdminCategoryInput = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined
      };
      return id ? adminApi.updateCategory(id, payload) : adminApi.createCategory(payload);
    },
    onSuccess: (_res, vars) => {
      refresh();
      setEditing(null);
      addToast({
        type: 'success',
        title: vars.id ? 'Category updated' : 'Category created',
        message: vars.form.name
      });
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save category'))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: (_res, id) => {
      refresh();
      setConfirmDelete(null);
      addToast({ type: 'info', title: 'Category deleted', message: `ID: ${id}` });
    },
    onError: (err) => {
      setConfirmDelete(null);
      addToast({ type: 'error', title: 'Delete failed', message: apiErrorMessage(err, 'Could not delete category') });
    }
  });

  const syncDefaultsMutation = useMutation({
    mutationFn: () => adminApi.seedDefaultCategories(),
    onSuccess: (res) => {
      refresh();
      const info = res.data;
      addToast({
        type: 'success',
        title: 'Categories synchronized',
        message: `Created: ${info?.created ?? 0}, Skipped (already exist): ${info?.skipped ?? 0}`
      });
    },
    onError: (err) => addToast({ type: 'error', title: 'Sync failed', message: apiErrorMessage(err, 'Failed to sync categories') })
  });

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const openEditor = (c?: Category) => {
    setFormError('');
    if (c) {
      setEditing({ id: c._id || c.id || null, form: toCategoryForm(c) });
    } else {
      setEditing({ id: null, form: { ...EMPTY_CATEGORY_FORM } });
    }
  };

  const submitEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const f = editing.form;
    if (f.name.trim().length < 2) {
      setFormError('Category name must be at least 2 characters');
      return;
    }
    setFormError('');
    saveMutation.mutate(editing);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Category Catalog</h2>
          <p className="text-xs text-slate-500">
            Create, modify, and delete categories. Products can belong to one or multiple categories.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => syncDefaultsMutation.mutate()}
            disabled={syncDefaultsMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            title="Import or update standard categories with yellow icons"
          >
            <span className="material-symbols-outlined text-base text-amber-500">
              {syncDefaultsMutation.isPending ? 'progress_activity' : 'sync'}
            </span>
            <span>{syncDefaultsMutation.isPending ? 'Syncing...' : 'Sync Standard Categories'}</span>
          </button>
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Category</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-slate-400">search</span>
          <input
            type="search"
            placeholder="Search categories by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading categories…</div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No categories found. Click &quot;Sync Standard Categories&quot; to populate with icons or create a new one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((c) => {
                const id = c._id || c.id || c.slug;
                return (
                  <tr key={id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-1 overflow-hidden">
                          {c.image ? (
                            <img src={c.image} alt={c.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-xl">category</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                        {c.slug}
                      </code>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {c.description || <span className="text-slate-400 italic">No description</span>}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right text-xs font-bold">
                      <button
                        onClick={() => openEditor(c)}
                        className="px-2 text-brand-600 hover:text-brand-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: String(c._id || c.id), name: c.name })}
                        className="px-2 text-rose-600 hover:text-rose-800"
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

      {editing && (
        <Modal
          title={editing.id ? `Edit category: ${editing.form.name}` : 'New category'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submitEditor} noValidate className="space-y-4 text-sm">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Category Name *</span>
              <input
                className={inputClass}
                required
                maxLength={60}
                placeholder="e.g. 2 Wheelers, Fashion, Electronics"
                value={editing.form.name}
                onChange={(e) => setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Slug (URL identifier)</span>
              <input
                className={inputClass}
                maxLength={60}
                placeholder="Auto-generated if left blank (e.g. two-wheelers)"
                value={editing.form.slug}
                onChange={(e) => setEditing({ ...editing, form: { ...editing.form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } })}
              />
            </label>

            <ImageUploadInput
              label="Category Icon / Image"
              value={editing.form.image}
              onChange={(img) => setEditing({ ...editing, form: { ...editing.form, image: img } })}
              helpText="Upload an icon or image from your device, or provide an image link."
            />

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Description</span>
              <textarea
                rows={3}
                maxLength={1000}
                className={inputClass}
                placeholder="Brief summary of items in this category…"
                value={editing.form.description}
                onChange={(e) => setEditing({ ...editing, form: { ...editing.form, description: e.target.value } })}
              />
            </label>

            {formError && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : editing.id ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete '${confirmDelete.name}'?`}
          message="Are you sure you want to delete this category? If any active products use this as their only category, the deletion will be rejected for catalog safety."
          confirmLabel="Delete"
          busy={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};
