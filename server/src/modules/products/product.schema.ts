import { z } from 'zod';

const booleanFlag = z.enum(['true', 'false']).transform((v) => v === 'true');

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Page limit cannot exceed 50').default(20),
    category: z.string().trim().max(100).optional(),
    q: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
    sort: z
      .enum(['price_asc', 'price_desc', 'newest', 'popular', 'discount'])
      .default('newest'),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    minDiscount: z.coerce.number().int().min(1).max(90).optional(),
    onSale: booleanFlag.optional(),
    inStock: booleanFlag.optional()
  })
  .strict()
  .refine(
    (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
    { message: 'minPrice cannot be greater than maxPrice', path: ['minPrice'] }
  );

export const productSlugParamSchema = z
  .object({
    slug: z.string().trim().min(1, 'Product slug is required').max(200)
  })
  .strict();

export const productIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format')
  })
  .strict();

const discountPercentSchema = z
  .number()
  .int('Discount must be a whole number')
  .min(0, 'Discount cannot be negative')
  .max(90, 'Discount cannot exceed 90%');

const imageStringSchema = z.string().trim().min(1).refine(
  (val) => /^https?:\/\/\S+$/i.test(val) || /^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(val) || /^data:image\/svg\+xml/i.test(val),
  { message: 'Image must be a valid http(s) URL or image data URI' }
);

export const adminCreateProductSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
    slug: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    // Either `mrp` (preferred, with optional discount) or legacy `price` must be supplied
    price: z.number().int().min(0, 'Price must be a non-negative integer in paise').optional(),
    mrp: z.number().int().min(1, 'MRP must be a positive integer in paise').optional(),
    discountPercent: discountPercentSchema.optional().default(0),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    category: z.string().trim().optional(),
    categories: z.array(z.string().trim().min(1)).min(1, 'At least one category is required').optional(),
    images: z.array(imageStringSchema).max(10).optional().default([]),
    isActive: z.boolean().optional().default(true)
  })
  .strict()
  .refine((d) => d.mrp !== undefined || d.price !== undefined, {
    message: 'Either mrp or price is required',
    path: ['mrp']
  })
  .refine((d) => d.category !== undefined || (d.categories !== undefined && d.categories.length > 0), {
    message: 'At least one category is required',
    path: ['category']
  });

export const adminUpdateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    price: z.number().int().min(0).optional(),
    mrp: z.number().int().min(1).optional(),
    discountPercent: discountPercentSchema.optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().trim().optional(),
    categories: z.array(z.string().trim().min(1)).min(1).optional(),
    images: z.array(imageStringSchema).max(10).optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const adminListProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Page limit cannot exceed 50').default(20),
    q: z.string().trim().max(100).optional(),
    status: z.enum(['all', 'listed', 'unlisted']).default('all')
  })
  .strict();

export const categoryIdParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
  })
  .strict();

export const adminCreateCategorySchema = z
  .object({
    name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(60),
    slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    description: z.string().trim().max(1000).optional(),
    image: z.string().trim().optional()
  })
  .strict();

export const adminUpdateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().trim().max(1000).optional(),
    image: z.string().trim().optional()
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type AdminCreateProductInput = z.infer<typeof adminCreateProductSchema>;
export type AdminUpdateProductInput = z.infer<typeof adminUpdateProductSchema>;
export type AdminListProductsQuery = z.infer<typeof adminListProductsQuerySchema>;
export type AdminCreateCategoryInput = z.infer<typeof adminCreateCategorySchema>;
export type AdminUpdateCategoryInput = z.infer<typeof adminUpdateCategorySchema>;
