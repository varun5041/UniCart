import { z } from 'zod';

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Page limit cannot exceed 50').default(20),
    category: z.string().trim().optional(),
    q: z.string().trim().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const productSlugParamSchema = z
  .object({
    slug: z.string().trim().min(1, 'Product slug is required')
  })
  .strict();

export const productIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
  })
  .strict();

export const adminCreateProductSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
    slug: z.string().trim().min(2).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    price: z.number().int().min(0, 'Price must be a non-negative integer in paise'),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    category: z.string().trim().min(1, 'Category ID or slug is required'),
    images: z.array(z.string().url('Images must be valid URLs')).optional().default([]),
    isActive: z.boolean().optional().default(true)
  })
  .strict();

export const adminUpdateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z.string().trim().min(2).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    price: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().trim().optional(),
    images: z.array(z.string().url()).optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type AdminCreateProductInput = z.infer<typeof adminCreateProductSchema>;
export type AdminUpdateProductInput = z.infer<typeof adminUpdateProductSchema>;
