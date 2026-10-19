import { Router } from 'express';
import { productController } from './product.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const categoryRouter = Router();

// GET /api/v1/categories
categoryRouter.get(
  '/',
  asyncHandler((req, res) => productController.listCategories(req, res))
);

export default categoryRouter;
