import { z } from 'zod';

export const shippingAddressSchema = z
  .object({
    line1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters').max(120),
    city: z.string().trim().min(2, 'City must be at least 2 characters').max(60),
    state: z.string().trim().min(2, 'State must be at least 2 characters').max(60),
    pincode: z.string().trim().min(4, 'Pincode must be at least 4 characters').max(10),
    country: z.string().trim().default('India')
  })
  .strict();

export const createOrderSchema = z
  .object({
    shippingAddress: shippingAddressSchema
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
