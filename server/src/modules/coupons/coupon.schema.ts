import { z } from 'zod';

export const couponCodeSchema = z
  .string()
  .trim()
  .min(3, 'Coupon code must be at least 3 characters')
  .max(20, 'Coupon code cannot exceed 20 characters')
  .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code may contain only letters, numbers, - and _')
  .transform((v) => v.toUpperCase());

const discountPercentSchema = z
  .number()
  .int('Discount must be a whole number')
  .min(1, 'Discount must be at least 1%')
  .max(90, 'Discount cannot exceed 90%');

const optionalFields = {
  description: z.string().trim().max(200).optional(),
  maxDiscount: z.number().int().min(0).nullable().optional(), // paise
  minOrderValue: z.number().int().min(0).optional(), // paise
  usageLimit: z.number().int().min(1).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional()
};

export const adminCreateCouponSchema = z
  .object({
    code: couponCodeSchema,
    discountPercent: discountPercentSchema,
    ...optionalFields
  })
  .strict();

export const adminUpdateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    discountPercent: discountPercentSchema.optional(),
    ...optionalFields
  })
  .strict();

export const couponIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coupon ID format')
  })
  .strict();

export const adminListCouponsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Limit cannot exceed 50').default(20)
  })
  .strict();

export const validateCouponSchema = z
  .object({
    code: couponCodeSchema
  })
  .strict();

export type AdminCreateCouponInput = z.infer<typeof adminCreateCouponSchema>;
export type AdminUpdateCouponInput = z.infer<typeof adminUpdateCouponSchema>;
export type AdminListCouponsQuery = z.infer<typeof adminListCouponsQuerySchema>;
