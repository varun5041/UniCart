import React, { useState } from 'react';
import { sanitizePincodeInput, validateAddress, type AddressErrors } from '../lib/validation';
import type { AddressInput } from '../api/users';

const EMPTY: AddressInput = { line1: '', city: '', state: '', pincode: '', country: 'India', isDefault: false };

interface AddressFormProps {
  onSubmit: (addr: AddressInput) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  submitLabel?: string;
  showDefaultToggle?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Save Address',
  showDefaultToggle = true
}) => {
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field: keyof AddressInput, value: string | boolean) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched) setErrors(validateAddress(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const found = validateAddress(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setServerError('');
    const res = await onSubmit({
      ...form,
      line1: form.line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim()
    });
    setSaving(false);
    if (res.success) {
      setForm(EMPTY);
      setTouched(false);
      setErrors({});
    } else {
      setServerError(res.error || 'Could not save address');
    }
  };

  const inputClass = (err?: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
      err
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <Field id="addr-line1" label="House / Flat / Street" error={errors.line1}>
        <input
          id="addr-line1"
          type="text"
          autoComplete="street-address"
          maxLength={120}
          placeholder="e.g. 402 Sunshine Apartments, Linking Road"
          value={form.line1}
          onChange={(e) => setField('line1', e.target.value)}
          aria-invalid={Boolean(errors.line1)}
          className={inputClass(errors.line1)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="addr-city" label="City" error={errors.city}>
          <input
            id="addr-city"
            type="text"
            autoComplete="address-level2"
            maxLength={60}
            placeholder="Mumbai"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            aria-invalid={Boolean(errors.city)}
            className={inputClass(errors.city)}
          />
        </Field>
        <Field id="addr-state" label="State" error={errors.state}>
          <input
            id="addr-state"
            type="text"
            autoComplete="address-level1"
            maxLength={60}
            placeholder="Maharashtra"
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
            aria-invalid={Boolean(errors.state)}
            className={inputClass(errors.state)}
          />
        </Field>
        <Field id="addr-pincode" label="Pincode" error={errors.pincode}>
          <input
            id="addr-pincode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            placeholder="400053"
            value={form.pincode}
            onChange={(e) => setField('pincode', sanitizePincodeInput(e.target.value))}
            aria-invalid={Boolean(errors.pincode)}
            className={inputClass(errors.pincode)}
          />
        </Field>
      </div>

      {showDefaultToggle && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(form.isDefault)}
            onChange={(e) => setField('isDefault', e.target.checked)}
            className="h-4 w-4 rounded accent-brand-600"
          />
          Make this my default address
        </label>
      )}

      {serverError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

const Field: React.FC<{ id: string; label: string; error?: string; children: React.ReactNode }> = ({
  id,
  label,
  error,
  children
}) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-700">
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
  </div>
);
