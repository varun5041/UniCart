import { z } from 'zod';
import { shippingAddressSchema } from '../orders/order.schema.js';
import { MAX_ADDRESSES } from '../../models/User.js';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters')
  })
  .strict();

export const savedAddressSchema = shippingAddressSchema
  .extend({
    isDefault: z.boolean().optional().default(false)
  })
  .strict();

export const replaceAddressesSchema = z
  .object({
    addresses: z
      .array(savedAddressSchema)
      .max(MAX_ADDRESSES, `You can save at most ${MAX_ADDRESSES} addresses`)
  })
  .strict();

export const wishlistBodySchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
  })
  .strict();

export const wishlistParamSchema = wishlistBodySchema;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SavedAddressInput = z.infer<typeof savedAddressSchema>;
