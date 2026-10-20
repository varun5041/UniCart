import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminCouponInput } from '../../api/admin';
import { useToastStore } from '../../store/useToastStore';
import { formatRupees, type Coupon } from '../../types';
import { ConfirmDialog, Modal, Pager } from './shared';
import { apiErrorMessage, inputClass } from './adminUtils';

interface CouponForm {
  code: string;
  description: string;
  discountPercent: string;
  maxDiscountRupees: string;
  minOrderRupees: string;
  usageLimit: string;
  expiresAt: string; // yyyy-mm-dd
  isActive: boolean;
}

const EMPTY: CouponForm = {
  code: '',
  description: '',
  discountPercent: '10',
  maxDiscountRupees: '',
  minOrderRupees: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true
};

function toForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    description: c.description ?? '',
    discountPercent: String(c.discountPercent),
    maxDiscountRupees: c.maxDiscount != null ? String(c.maxDiscount / 100) : '',
    minOrderRupees: c.minOrderValue ? String(c.minOrderValue / 100) : '',
    usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    isActive: c.isActive
  };
}

function validate(f: CouponForm): string | null {
  if (!/^[A-Z0-9_-]{3,20}$/.test(f.code)) return 'Code must be 3–20 letters, numbers, - or _';
  const d = Number(f.discountPercent);
  if (!Number.isInteger(d) || d < 1 || d > 90) return 'Discount must be a whole number from 1 to 90';
  if (f.maxDiscountRupees && !(Number(f.maxDiscountRupees) >= 0)) return 'Max discount must be 0 or more';
  if (f.minOrderRupees && !(Number(f.minOrderRupees) >= 0)) return 'Minimum order must be 0 or more';
  if (f.usageLimit && !(Number.isInteger(Number(f.usageLimit)) && Number(f.usageLimit) >= 1)) return 'Usage limit must be a whole number, 1 or more';
  return null;
}

function toPayload(f: CouponForm): AdminCouponInput {
  return {
    code: f.code,
    description: f.description.trim() || undefined,
    discountPercent: Number(f.discountPercent),
    maxDiscount: f.maxDiscountRupees ? Math.round(Number(f.maxDiscountRupees) * 100) : null,
    minOrderValue: f.minOrderRupees ? Math.round(Number(f.minOrderRupees) * 100) : 0,
    usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
    // End of the chosen day in local time
    expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null,
    isActive: f.isActive
  };
}

function couponState(c: Coupon): { label: string; cls: string } {
  if (!c.isActive) return { label: 'Inactive', cls: 'bg-slate-100 text-slate-500' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { label: 'Expired', cls: 'bg-amber-50 text-amber-700' };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { label: 'Used up', cls: 'bg-amber-50 text-amber-700' };
  return { label: 'Active', cls: 'bg-emerald-50 text-emerald-700' };
}

export const CouponsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string | null; form: CouponForm } | null>(null);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: async () => {
      const res = await adminApi.listCoupons({ page, limit: 20 });
      return { items: res.data ?? [], pages: res.meta?.pages ?? 1 };
    }
  });
  const coupons = data?.items ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });

  const saveMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: CouponForm }) =>
      id ? adminApi.updateCoupon(id, toPayload(form)) : adminApi.createCoupon(toPayload(form)),
    onSuccess: (_r, vars) => {
      refresh();
      setEditing(null);
      addToast({ type: 'success', title: vars.id ? 'Coupon updated' : 'Coupon created' });
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save coupon'))
  });

  const toggleMutation = useMutation({
    mutationFn: async (c: Coupon) => adminApi.updateCoupon(c._id, { isActive: !c.isActive }),
    onSuccess: refresh,
    onError: (err) => addToast({ type: 'error', title: 'Update failed', message: apiErrorMessage(err, 'Try again') })
  });

  const deleteMutation = useMutation({
    mutationFn: async (c: Coupon) => adminApi.deleteCoupon(c._id),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      addToast({ type: 'info', title: 'Coupon deleted' });
    },
    onError: (err) => {
      setDeleting(null);
      addToast({ type: 'error', title: 'Delete failed', message: apiErrorMessage(err, 'Try again') });
    }
  });

  const f = editing?.form;
  const setF = (patch: Partial<CouponForm>) => editing && setEditing({ ...editing, form: { ...editing.form, ...patch } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const err = validate(editing.form);
    setFormError(err ?? '');
    if (!err) saveMutation.mutate(editing);
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Coupons</h3>
          <p className="text-sm text-slate-500">Percentage-off codes customers can apply in their cart.</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setEditing({ id: null, form: EMPTY });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New coupon
        </button>
      </div>

      {isLoading ? (
        <p className="p-12 text-center text-sm font-semibold text-slate-500">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <p className="p-12 text-center text-sm font-semibold text-slate-500">No coupons yet. Create your first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min order</th>
                <th className="p-3">Max off</th>
                <th className="p-3">Used</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => {
                const state = couponState(c);
                return (
                  <tr key={c._id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <span className="rounded-lg bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-700">{c.code}</span>
                      {c.description && <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">{c.description}</p>}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">{c.discountPercent}%</td>
                    <td className="p-3 text-slate-600">{c.minOrderValue ? formatRupees(c.minOrderValue) : '—'}</td>
                    <td className="p-3 text-slate-600">{c.maxDiscount != null ? formatRupees(c.maxDiscount) : 'No cap'}</td>
                    <td className="p-3 text-slate-600">
                      {c.usedCount}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="p-3 text-slate-600">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${state.cls}`}>{state.label}</span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-right text-xs font-bold">
                      <button
                        onClick={() => {
                          setFormError('');
                          setEditing({ id: c._id, form: toForm(c) });
                        }}
                        className="px-1.5 text-brand-600 hover:text-brand-800"
                      >
                        Edit
                      </button>
                      <button onClick={() => toggleMutation.mutate(c)} disabled={toggleMutation.isPending} className="px-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-50">
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => setDeleting(c)} className="px-1.5 text-rose-600 hover:text-rose-800">
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
        <Modal title={editing.id ? `Edit ${f.code || 'coupon'}` : 'New coupon'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} noValidate className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Code</span>
                <input
                  className={`${inputClass} font-mono uppercase`}
                  maxLength={20}
                  placeholder="DIWALI20"
                  value={f.code}
                  onChange={(e) => setF({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Discount (%)</span>
                <input type="number" min={1} max={90} step={1} className={inputClass} value={f.discountPercent} onChange={(e) => setF({ discountPercent: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Description (optional)</span>
              <input className={inputClass} maxLength={200} placeholder="Festive offer on all orders" value={f.description} onChange={(e) => setF({ description: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Minimum order (₹)</span>
                <input type="number" min={0} placeholder="No minimum" className={inputClass} value={f.minOrderRupees} onChange={(e) => setF({ minOrderRupees: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Max discount (₹)</span>
                <input type="number" min={0} placeholder="No cap" className={inputClass} value={f.maxDiscountRupees} onChange={(e) => setF({ maxDiscountRupees: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Usage limit</span>
                <input type="number" min={1} step={1} placeholder="Unlimited" className={inputClass} value={f.usageLimit} onChange={(e) => setF({ usageLimit: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Expires on</span>
                <input type="date" className={inputClass} value={f.expiresAt} onChange={(e) => setF({ expiresAt: e.target.value })} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.isActive} onChange={(e) => setF({ isActive: e.target.checked })} />
              Active
            </label>
            {formError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 font-semibold text-rose-700">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" disabled={saveMutation.isPending} className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : editing.id ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete coupon ${deleting.code}?`}
          message="Customers will no longer be able to use this code. Orders that already used it are not affected."
          confirmLabel="Delete coupon"
          busy={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};
