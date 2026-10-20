import React from 'react';

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title,
  onClose,
  children,
  wide
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel, busy, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </span>
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export const Pager: React.FC<{ page: number; pages: number; onChange: (p: number) => void }> = ({ page, pages, onChange }) =>
  pages > 1 ? (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">
        Previous
      </button>
      <span className="px-2 font-semibold text-slate-600">
        {page} / {pages}
      </span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">
        Next
      </button>
    </div>
  ) : null;
