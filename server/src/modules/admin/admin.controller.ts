import { Request, Response } from 'express';
import { productService } from '../products/product.service.js';
import { adminService } from './admin.service.js';
import {
  AdminListOrdersQuery,
  AdminUpdateOrderStatusInput,
  AdminListAuditLogsQuery
} from './admin.schema.js';

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
    const isPermanent = req.query.permanent === 'true';
    const result = await productService.deleteProduct(req.params.id, isPermanent);
    res.status(200).json({
      success: true,
      data: result
    });
  }

  async bulkDeleteProducts(req: Request, res: Response): Promise<void> {
    const result = await productService.bulkDeleteProducts(req.body);
    res.status(200).json({
      success: true,
      data: result
    });
  }

  async listCategories(_req: Request, res: Response): Promise<void> {
    const categories = await productService.listAllCategories();
    res.status(200).json({
      success: true,
      data: categories
    });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const category = await productService.createCategory(req.body);
    res.status(201).json({
      success: true,
      data: category
    });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const result = await productService.deleteCategory(req.params.id);
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

  async listOrders(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AdminListOrdersQuery;
    const result = await adminService.listOrders(query);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: result.meta
    });
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const body = req.body as AdminUpdateOrderStatusInput;
    const actorId = req.user!.id;
    const ip = req.ip || req.socket.remoteAddress;

    const order = await adminService.updateOrderStatus(id, body.status, actorId, ip);
    res.status(200).json({
      success: true,
      data: order
    });
  }

  async listAuditLogs(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AdminListAuditLogsQuery;
    const result = await adminService.listAuditLogs(query);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: result.meta
    });
  }
}

export const adminController = new AdminController();
export default adminController;
