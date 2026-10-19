import crypto from 'node:crypto';
import mongoose, { Types } from 'mongoose';
import { Product, IProduct } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';
import { cacheAside, incrementCacheVersion } from '../../utils/cache.js';
import {
  ListProductsQuery,
  AdminCreateProductInput,
  AdminUpdateProductInput
} from './product.schema.js';

export interface PaginatedProducts {
  items: unknown[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ProductService {
  /**
   * Helper to slugify string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * List products with caching, text search, filtering, sorting, and pagination
   */
  async listProducts(query: ListProductsQuery): Promise<PaginatedProducts> {
    const cacheKey = `list:${JSON.stringify(query)}`;

    const { data } = await cacheAside<PaginatedProducts>(
      'products',
      cacheKey,
      120, // 2 minutes TTL
      async () => {
        const filter: Record<string, unknown> = { isActive: true };

        // 1. Category Filter (by ObjectId or Slug)
        if (query.category) {
          if (mongoose.isValidObjectId(query.category)) {
            filter.category = new Types.ObjectId(query.category);
          } else {
            const cat = await Category.findOne({ slug: query.category }).lean();
            if (cat) {
              filter.category = cat._id;
            } else {
              // Non-existent category yields empty result
              return {
                items: [],
                meta: { page: query.page, limit: query.limit, total: 0, pages: 0 }
              };
            }
          }
        }

        // 2. Search Query (Text search or regex fallback)
        if (query.q && query.q.trim()) {
          const sanitizedQ = query.q.trim();
          filter.$or = [
            { name: { $regex: sanitizedQ, $options: 'i' } },
            { description: { $regex: sanitizedQ, $options: 'i' } }
          ];
        }

        // 3. Price Filter (in paise)
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
          const priceFilter: Record<string, number> = {};
          if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
          if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
          filter.price = priceFilter;
        }

        // 4. Sorting
        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (query.sort === 'price_asc') sortOption = { price: 1 };
        else if (query.sort === 'price_desc') sortOption = { price: -1 };
        else if (query.sort === 'newest') sortOption = { createdAt: -1 };

        // 5. Pagination
        const skip = (query.page - 1) * query.limit;
        const total = await Product.countDocuments(filter);
        const items = await Product.find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(query.limit)
          .populate('category', 'name slug')
          .lean();

        const pages = Math.ceil(total / query.limit) || 1;

        return {
          items,
          meta: {
            page: query.page,
            limit: query.limit,
            total,
            pages
          }
        };
      }
    );

    return data;
  }

  /**
   * Get single product detail by slug with caching
   */
  async getProductBySlug(slug: string): Promise<unknown> {
    const { data } = await cacheAside<unknown>(
      'products',
      `detail:${slug}`,
      300, // 5 minutes TTL
      async () => {
        const product = await Product.findOne({ slug, isActive: true })
          .populate('category', 'name slug')
          .lean();

        if (!product) {
          throw ApiError.notFound(`Product with slug '${slug}' not found`, 'PRODUCT_NOT_FOUND');
        }

        return product;
      }
    );

    return data;
  }

  /**
   * List all categories with caching
   */
  async listCategories(): Promise<unknown[]> {
    const { data } = await cacheAside<unknown[]>(
      'categories',
      'all',
      300,
      async () => {
        return Category.find().sort({ name: 1 }).lean();
      }
    );

    return data;
  }

  /**
   * Admin: Create a product and invalidate cache
   */
  async createProduct(input: AdminCreateProductInput): Promise<IProduct> {
    let categoryId: Types.ObjectId;

    if (mongoose.isValidObjectId(input.category)) {
      categoryId = new Types.ObjectId(input.category);
    } else {
      const cat = await Category.findOne({ slug: input.category });
      if (!cat) {
        throw ApiError.badRequest(`Category '${input.category}' does not exist`, 'CATEGORY_NOT_FOUND');
      }
      categoryId = cat._id as Types.ObjectId;
    }

    let slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name);
    const existing = await Product.findOne({ slug }).lean();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = new Product({
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      stock: input.stock,
      category: categoryId,
      images: input.images || [],
      isActive: input.isActive !== undefined ? input.isActive : true
    });

    await product.save();

    // Cache invalidation (O(1) scope version bump)
    await incrementCacheVersion('products');

    return product;
  }

  /**
   * Admin: Update product and invalidate cache
   */
  async updateProduct(id: string, input: AdminUpdateProductInput): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    if (input.name !== undefined) product.name = input.name;
    if (input.slug !== undefined) product.slug = this.generateSlug(input.slug);
    if (input.description !== undefined) product.description = input.description;
    if (input.price !== undefined) product.price = input.price;
    if (input.stock !== undefined) product.stock = input.stock;
    if (input.images !== undefined) product.images = input.images;
    if (input.isActive !== undefined) product.isActive = input.isActive;

    if (input.category) {
      if (mongoose.isValidObjectId(input.category)) {
        product.category = new Types.ObjectId(input.category);
      } else {
        const cat = await Category.findOne({ slug: input.category });
        if (!cat) {
          throw ApiError.badRequest(`Category '${input.category}' not found`, 'CATEGORY_NOT_FOUND');
        }
        product.category = cat._id as Types.ObjectId;
      }
    }

    await product.save();

    // Cache invalidation
    await incrementCacheVersion('products');

    return product;
  }

  /**
   * Admin: Soft-delete product and invalidate cache
   */
  async deleteProduct(id: string): Promise<{ message: string }> {
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Cache invalidation
    await incrementCacheVersion('products');

    return { message: 'Product deleted successfully' };
  }

  /**
   * Admin: Bulk soft-delete products and invalidate cache
   */
  async bulkDeleteProducts(input: { ids?: string[]; all?: boolean }): Promise<{ count: number; message: string }> {
    let query: Record<string, unknown> = {};

    if (input.all) {
      query = { isActive: true };
    } else if (input.ids && input.ids.length > 0) {
      const validObjectIds = input.ids
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new Types.ObjectId(id));

      if (validObjectIds.length === 0) {
        return { count: 0, message: 'No valid products to delete' };
      }
      query = { _id: { $in: validObjectIds } };
    } else {
      return { count: 0, message: 'No products targeted for deletion' };
    }

    const result = await Product.updateMany(
      query,
      { $set: { isActive: false } }
    );

    // Cache invalidation
    await incrementCacheVersion('products');

    return {
      count: result.modifiedCount,
      message: `Successfully deactivated ${result.modifiedCount} product(s)`
    };
  }

  /**
   * Admin: Signed upload parameters for direct client-to-cloud upload (Cloudinary/S3)
   */
  generateUploadSignature(folder = 'unicart/products') {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiKey = process.env.CLOUDINARY_API_KEY || 'mock_cloud_api_key';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mock_cloud_api_secret_key_32_bytes_long';

    // Signature computed from string_to_sign
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    return {
      timestamp,
      folder,
      apiKey,
      signature,
      uploadUrl: 'https://api.cloudinary.com/v1_1/unicart/image/upload'
    };
  }
}

export const productService = new ProductService();
export default productService;
