import { z } from 'zod';
import { couponCodeSchema } from '../coupons/coupon.schema.js';

/** Indian PIN code: exactly 6 digits, first digit 1–9. */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a valid 6-digit Indian PIN code');

const placeNameSchema = (field: string) =>
  z
    .string()
    .trim()
    .min(2, `${field} must be at least 2 characters`)
    .max(60)
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, `${field} may contain only letters, spaces, . ' and -`);

export const shippingAddressSchema = z
  .object({
    line1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters').max(120),
    city: placeNameSchema('City'),
    state: placeNameSchema('State'),
    pincode: pincodeSchema,
    country: z.string().trim().max(60).default('India')
  })
  .strict();

export const createOrderSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    couponCode: couponCodeSchema.optional()
  })
  .strict();

export const orderIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
  })
  .strict();

export const listOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Page limit cannot exceed 50').default(20),
    status: z
      .enum(['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'])
      .optional()
  })
  .strict();

export const payOrderSchema = z
  .object({
    paymentRef: z.string().trim().optional()
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
