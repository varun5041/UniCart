import { z } from 'zod';

export const adminListOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Limit cannot exceed 50').default(20),
    status: z
      .enum(['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'])
      .optional()
  })
  .strict();

export const adminUpdateOrderStatusSchema = z
  .object({
    status: z.enum(['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled'])
  })
  .strict();

export const adminListAuditLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50, 'Limit cannot exceed 50').default(20),
    action: z.string().trim().optional(),
    actorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid actor ObjectId').optional()
  })
  .strict();

export const adminBulkDeleteProductsSchema = z
  .object({
    ids: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ObjectId'))
      .optional(),
    all: z.boolean().optional(),
    hardDelete: z.boolean().optional()
  })
  .strict()
  .refine((data) => (data.ids && data.ids.length > 0) || data.all === true, {
    message: 'Must provide product IDs or specify all: true'
  });

export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;
export type AdminListAuditLogsQuery = z.infer<typeof adminListAuditLogsQuerySchema>;
export type AdminBulkDeleteProductsInput = z.infer<typeof adminBulkDeleteProductsSchema>;
