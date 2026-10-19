import { Request, Response } from 'express';
import { productService } from './product.service.js';
import { ListProductsQuery } from './product.schema.js';

export class ProductController {
  async listProducts(req: Request, res: Response): Promise<void> {
    const result = await productService.listProducts(req.query as unknown as ListProductsQuery);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: result.meta
    });
  }

  async getProductBySlug(req: Request, res: Response): Promise<void> {
    const product = await productService.getProductBySlug(req.params.slug);
    res.status(200).json({
      success: true,
      data: product
    });
  }

  async listCategories(_req: Request, res: Response): Promise<void> {
    const categories = await productService.listCategories();
    res.status(200).json({
      success: true,
      data: categories
    });
  }
}

export const productController = new ProductController();
export default productController;
