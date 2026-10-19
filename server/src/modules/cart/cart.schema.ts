import { z } from 'zod';

export const addToCartSchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    qty: z
      .coerce
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(10, 'Quantity cannot exceed 10 items')
      .default(1)
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    qty: z
      .coerce
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(10, 'Quantity cannot exceed 10 items')
  })
  .strict();

export const cartProductIdParamSchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
  })
  .strict();

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
