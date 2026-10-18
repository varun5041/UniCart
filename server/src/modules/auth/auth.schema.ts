import { z } from 'zod';

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'admin123',
  '12345678',
  'qwerty123',
  'welcome123',
  'letmein123',
  'changeme123'
]);

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .refine(
        (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
        'Password is too common and easily guessed'
      )
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required')
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
