import { Request, Response } from 'express';
import { productService } from '../products/product.service.js';

export class AdminController {
  async createProduct(req: Request, res: Response): Promise<void> {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      data: product
    });
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: product
    });
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    const result = await productService.deleteProduct(req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  }

  getUploadSignature(req: Request, res: Response): void {
    const folder = req.body?.folder || 'unicart/products';
    const signature = productService.generateUploadSignature(folder);
    res.status(200).json({
      success: true,
      data: signature
    });
  }
}

export const adminController = new AdminController();
export default adminController;
