import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCreateProductSchema,
  adminUpdateProductSchema,
  productIdParamSchema
} from '../products/product.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminRouter = Router();

// All admin routes strictly require authentication and 'admin' role
adminRouter.use(authenticate, authorize('admin'));

// Admin product CRUD
adminRouter.post(
  '/products',
  validate({ body: adminCreateProductSchema }),
  asyncHandler((req, res) => adminController.createProduct(req, res))
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

export default adminRouter;
