import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCreateProductSchema,
  adminUpdateProductSchema,
  adminListProductsQuerySchema,
  productIdParamSchema,
  adminCreateCategorySchema,
  adminUpdateCategorySchema,
  categoryIdParamSchema
} from '../products/product.schema.js';
import {
  adminCreateCouponSchema,
  adminUpdateCouponSchema,
  adminListCouponsQuerySchema,
  couponIdParamSchema
} from '../coupons/coupon.schema.js';
import { couponController } from '../coupons/coupon.controller.js';
import { orderIdParamSchema } from '../orders/order.schema.js';
import {
  adminListOrdersQuerySchema,
  adminUpdateOrderStatusSchema,
  adminListAuditLogsQuerySchema,
  adminBulkDeleteProductsSchema
} from './admin.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminRouter = Router();

// All admin routes strictly require authentication and 'admin' role
adminRouter.use(authenticate, authorize('admin'));

// Admin product CRUD
adminRouter.get(
  '/products',
  validate({ query: adminListProductsQuerySchema }),
  asyncHandler((req, res) => adminController.listProducts(req, res))
);

adminRouter.post(
  '/products',
  validate({ body: adminCreateProductSchema }),
  asyncHandler((req, res) => adminController.createProduct(req, res))
);

adminRouter.post(
  '/products/bulk-delete',
  validate({ body: adminBulkDeleteProductsSchema }),
  asyncHandler((req, res) => adminController.bulkDeleteProducts(req, res))
);

adminRouter.patch(
  '/products/:id',
  validate({ params: productIdParamSchema, body: adminUpdateProductSchema }),
  asyncHandler((req, res) => adminController.updateProduct(req, res))
);

adminRouter.delete(
  '/products/:id',
  validate({ params: productIdParamSchema }),
  asyncHandler((req, res) => adminController.deleteProduct(req, res))
);

// Signed direct upload parameters endpoint (Cloudinary/S3)
adminRouter.post(
  '/uploads/signature',
  (req, res) => adminController.getUploadSignature(req, res)
);

// Admin orders management
adminRouter.get(
  '/orders',
  validate({ query: adminListOrdersQuerySchema }),
  asyncHandler((req, res) => adminController.listOrders(req, res))
);

adminRouter.patch(
  '/orders/:id/status',
  validate({ params: orderIdParamSchema, body: adminUpdateOrderStatusSchema }),
  asyncHandler((req, res) => adminController.updateOrderStatus(req, res))
);

// Admin coupon CRUD
adminRouter.get(
  '/coupons',
  validate({ query: adminListCouponsQuerySchema }),
  asyncHandler((req, res) => couponController.list(req, res))
);

adminRouter.post(
  '/coupons',
  validate({ body: adminCreateCouponSchema }),
  asyncHandler((req, res) => couponController.create(req, res))
);

adminRouter.patch(
  '/coupons/:id',
  validate({ params: couponIdParamSchema, body: adminUpdateCouponSchema }),
  asyncHandler((req, res) => couponController.update(req, res))
);

adminRouter.delete(
  '/coupons/:id',
  validate({ params: couponIdParamSchema }),
  asyncHandler((req, res) => couponController.remove(req, res))
);

// Admin audit logs inspection
adminRouter.get(
  '/audit-logs',
  validate({ query: adminListAuditLogsQuerySchema }),
  asyncHandler((req, res) => adminController.listAuditLogs(req, res))
);

// Admin category CRUD & seed
adminRouter.post(
  '/categories',
  validate({ body: adminCreateCategorySchema }),
  asyncHandler((req, res) => adminController.createCategory(req, res))
);

adminRouter.post(
  '/categories/seed-defaults',
  asyncHandler((req, res) => adminController.seedDefaultCategories(req, res))
);

adminRouter.patch(
  '/categories/:id',
  validate({ params: categoryIdParamSchema, body: adminUpdateCategorySchema }),
  asyncHandler((req, res) => adminController.updateCategory(req, res))
);

adminRouter.delete(
  '/categories/:id',
  validate({ params: categoryIdParamSchema }),
  asyncHandler((req, res) => adminController.deleteCategory(req, res))
);

export default adminRouter;
