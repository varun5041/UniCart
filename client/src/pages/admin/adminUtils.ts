export function apiErrorMessage(err: any, fallback: string): string {
  const details = err?.response?.data?.error?.details;
  if (Array.isArray(details) && details[0]?.message) {
    const path = Array.isArray(details[0].path) && details[0].path.length ? `${details[0].path.join('.')}: ` : '';
    return `${path}${details[0].message}`;
  }
  return err?.response?.data?.error?.message || err?.message || fallback;
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';
