// Client-side checks mirror the server's Zod rules so users get instant feedback.
// The server remains the source of truth and re-validates every request.

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PLACE_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;

export interface AddressFields {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export type AddressErrors = Partial<Record<keyof AddressFields, string>>;

export function validateAddress(addr: AddressFields): AddressErrors {
  const errors: AddressErrors = {};
  const line1 = addr.line1.trim();
  const city = addr.city.trim();
  const state = addr.state.trim();
  const pincode = addr.pincode.trim();

  if (line1.length < 3) errors.line1 = 'Enter at least 3 characters';
  else if (line1.length > 120) errors.line1 = 'Keep it under 120 characters';

  if (city.length < 2) errors.city = 'Enter a city';
  else if (!PLACE_REGEX.test(city)) errors.city = 'Letters and spaces only';

  if (state.length < 2) errors.state = 'Enter a state';
  else if (!PLACE_REGEX.test(state)) errors.state = 'Letters and spaces only';

  if (!pincode) errors.pincode = 'Enter a pincode';
  else if (!PINCODE_REGEX.test(pincode)) errors.pincode = 'Enter a valid 6-digit pincode';

  return errors;
}

/** Keeps only digits and caps at 6 characters, for use in onChange handlers. */
export function sanitizePincodeInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

/** Server shipping rule: free at ₹500+ after discount, otherwise ₹50 (values in paise). */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 5000;

export function computeShipping(amountPaise: number): number {
  if (amountPaise <= 0) return 0;
  return amountPaise >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
