import React from 'react';
import { useToastStore } from '../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-brand-500';
        let iconName = 'info';
        let bgClass = 'bg-white text-slate-800';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500';
          iconName = 'check_circle';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500';
          iconName = 'error';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500';
          iconName = 'warning';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border-l-4 ${borderClass} ${bgClass} transition-all duration-300 animate-slide-in`}
            role="alert"
          >
            <span className="material-symbols-outlined text-xl text-brand-600 select-none">
              {iconName}
            </span>
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight text-slate-900">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
