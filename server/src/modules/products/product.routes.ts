import { Router } from 'express';
import { productController } from './product.controller.js';
import { validate } from '../../middleware/validate.js';
import { listProductsQuerySchema, productSlugParamSchema } from './product.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const productRouter = Router();

// GET /api/v1/products
productRouter.get(
  '/',
  validate({ query: listProductsQuerySchema }),
  asyncHandler((req, res) => productController.listProducts(req, res))
);

// GET /api/v1/products/:slug
productRouter.get(
  '/:slug',
  validate({ params: productSlugParamSchema }),
  asyncHandler((req, res) => productController.getProductBySlug(req, res))
);

export default productRouter;
