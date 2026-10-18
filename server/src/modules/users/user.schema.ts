import { z } from 'zod';

export const addressSchema = z
  .object({
    line1: z.string({ required_error: 'Address line 1 is required' }).trim().min(1, 'Address line 1 is required'),
    city: z.string({ required_error: 'City is required' }).trim().min(1, 'City is required'),
    state: z.string({ required_error: 'State is required' }).trim().min(1, 'State is required'),
    pincode: z.string({ required_error: 'Pincode is required' }).trim().min(1, 'Pincode is required'),
    country: z.string().trim().min(1, 'Country is required').default('IN')
  })
  .strict();

export const updateUserProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(60, 'Name cannot exceed 60 characters')
      .optional(),
    addresses: z
      .array(addressSchema)
      .max(5, 'Cannot store more than 5 addresses')
      .optional()
  })
  .strict();

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
