import crypto from 'node:crypto';
import mongoose, { Types } from 'mongoose';
import { Product, IProduct } from '../../models/Product.js';
import { Category, ICategory } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';
import { cacheAside, incrementCacheVersion } from '../../utils/cache.js';
import { computeSalePrice, escapeRegex } from '../../utils/pricing.js';
import { DEFAULT_CATEGORIES } from '../../utils/defaultCategories.js';
import {
  ListProductsQuery,
  AdminCreateProductInput,
  AdminUpdateProductInput,
  AdminListProductsQuery,
  AdminCreateCategoryInput,
  AdminUpdateCategoryInput
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

        let categoryCondition: Record<string, unknown> | null = null;
        let searchCondition: { $or: Record<string, unknown>[] } | null = null;

        // 1. Category Filter (by ObjectId or Slug)
        if (query.category) {
          let catId: Types.ObjectId | null = null;
          if (mongoose.isValidObjectId(query.category)) {
            catId = new Types.ObjectId(query.category);
          } else {
            const cat = await Category.findOne({ slug: query.category }).lean();
            if (cat) {
              catId = cat._id as Types.ObjectId;
            } else {
              // Non-existent category yields empty result
              return {
                items: [],
                meta: { page: query.page, limit: query.limit, total: 0, pages: 0 }
              };
            }
          }
          if (catId) {
            categoryCondition = { $or: [{ category: catId }, { categories: catId }] };
          }
        }

        // 2. Search Query (user input escaped so it is matched literally)
        if (query.q && query.q.trim()) {
          const sanitizedQ = escapeRegex(query.q.trim());
          searchCondition = {
            $or: [
              { name: { $regex: sanitizedQ, $options: 'i' } },
              { description: { $regex: sanitizedQ, $options: 'i' } }
            ]
          };
        }

        if (categoryCondition && searchCondition) {
          filter.$and = [categoryCondition, searchCondition];
        } else if (searchCondition) {
          filter.$or = searchCondition.$or;
        } else if (categoryCondition) {
          filter.$or = (categoryCondition as any).$or;
        }

        // 2b. Deal / availability filters
        if (query.minDiscount !== undefined) {
          filter.discountPercent = { $gte: query.minDiscount };
        } else if (query.onSale) {
          filter.discountPercent = { $gt: 0 };
        }
        if (query.inStock) {
          filter.stock = { $gt: 0 };
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
        else if (query.sort === 'popular') sortOption = { soldCount: -1, createdAt: -1 };
        else if (query.sort === 'discount') sortOption = { discountPercent: -1, createdAt: -1 };

        // 5. Pagination
        const skip = (query.page - 1) * query.limit;
        const total = await Product.countDocuments(filter);
        const items = await Product.find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(query.limit)
          .populate('category', 'name slug image')
          .populate('categories', 'name slug image')
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
          .populate('category', 'name slug image')
          .populate('categories', 'name slug image')
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
    const rawCategories: string[] = [];
    if (Array.isArray(input.categories) && input.categories.length > 0) {
      rawCategories.push(...input.categories);
    } else if (input.category) {
      rawCategories.push(input.category);
    }

    const resolvedCategoryIds: Types.ObjectId[] = [];
    for (const catItem of rawCategories) {
      if (mongoose.isValidObjectId(catItem)) {
        resolvedCategoryIds.push(new Types.ObjectId(catItem));
      } else {
        const cat = await Category.findOne({ slug: catItem });
        if (!cat) {
          throw ApiError.badRequest(`Category '${catItem}' does not exist`, 'CATEGORY_NOT_FOUND');
        }
        resolvedCategoryIds.push(cat._id as Types.ObjectId);
      }
    }

    if (resolvedCategoryIds.length === 0) {
      throw ApiError.badRequest('At least one valid category is required', 'CATEGORY_REQUIRED');
    }

    const primaryCategoryId = resolvedCategoryIds[0];

    let slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name);
    const existing = await Product.findOne({ slug }).lean();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const mrp = input.mrp ?? input.price ?? 0;
    const discountPercent = input.discountPercent ?? 0;

    const product = new Product({
      name: input.name,
      slug,
      description: input.description,
      mrp,
      discountPercent,
      price: computeSalePrice(mrp, discountPercent),
      stock: input.stock,
      category: primaryCategoryId,
      categories: resolvedCategoryIds,
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
    if (input.mrp !== undefined || input.price !== undefined || input.discountPercent !== undefined) {
      // A bare `price` update is treated as a new MRP; the selling price is always derived server-side
      const mrp = input.mrp ?? input.price ?? product.mrp ?? product.price;
      const discountPercent = input.discountPercent ?? product.discountPercent ?? 0;
      product.mrp = mrp;
      product.discountPercent = discountPercent;
      product.price = computeSalePrice(mrp, discountPercent);
    }
    if (input.stock !== undefined) product.stock = input.stock;
    if (input.images !== undefined) product.images = input.images;
    if (input.isActive !== undefined) product.isActive = input.isActive;

    if (input.categories && input.categories.length > 0) {
      const resolvedCategoryIds: Types.ObjectId[] = [];
      for (const catItem of input.categories) {
        if (mongoose.isValidObjectId(catItem)) {
          resolvedCategoryIds.push(new Types.ObjectId(catItem));
        } else {
          const cat = await Category.findOne({ slug: catItem });
          if (!cat) {
            throw ApiError.badRequest(`Category '${catItem}' not found`, 'CATEGORY_NOT_FOUND');
          }
          resolvedCategoryIds.push(cat._id as Types.ObjectId);
        }
      }
      product.categories = resolvedCategoryIds;
      product.category = resolvedCategoryIds[0];
    } else if (input.category) {
      if (mongoose.isValidObjectId(input.category)) {
        const catId = new Types.ObjectId(input.category);
        product.category = catId;
        product.categories = [catId];
      } else {
        const cat = await Category.findOne({ slug: input.category });
        if (!cat) {
          throw ApiError.badRequest(`Category '${input.category}' not found`, 'CATEGORY_NOT_FOUND');
        }
        product.category = cat._id as Types.ObjectId;
        product.categories = [cat._id as Types.ObjectId];
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
      { isActive: false, isDeleted: true },
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
      query = { isDeleted: { $ne: true } };
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
      { $set: { isActive: false, isDeleted: true } }
    );

    // Cache invalidation
    await incrementCacheVersion('products');

    return {
      count: result.modifiedCount,
      message: `Successfully deactivated ${result.modifiedCount} product(s)`
    };
  }

  /**
   * Admin: Paginated catalogue including unlisted products (excludes deleted ones). Never cached.
   */
  async adminListProducts(query: AdminListProductsQuery): Promise<PaginatedProducts> {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (query.status === 'listed') filter.isActive = true;
    if (query.status === 'unlisted') filter.isActive = false;
    if (query.q) {
      filter.name = { $regex: escapeRegex(query.q), $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;
    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('category', 'name slug image')
      .populate('categories', 'name slug image')
      .lean();

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit) || 1
      }
    };
  }

  /**
   * Admin: Create a new category
   */
  async createCategory(input: AdminCreateCategoryInput): Promise<ICategory> {
    const slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name);

    const existing = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(input.name)}$`, 'i') } },
        { slug }
      ]
    }).lean();

    if (existing) {
      throw ApiError.conflict('Category with this name or slug already exists', 'CATEGORY_EXISTS');
    }

    const category = new Category({
      name: input.name,
      slug,
      description: input.description,
      image: input.image
    });

    await category.save();

    await incrementCacheVersion('categories');
    return category;
  }

  /**
   * Admin: Update an existing category
   */
  async updateCategory(id: string, input: AdminUpdateCategoryInput): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }

    const newSlug = input.slug ? this.generateSlug(input.slug) : input.name ? this.generateSlug(input.name) : category.slug;

    if (input.name || input.slug) {
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        $or: [
          ...(input.name ? [{ name: { $regex: new RegExp(`^${escapeRegex(input.name)}$`, 'i') } }] : []),
          { slug: newSlug }
        ]
      }).lean();

      if (existing) {
        throw ApiError.conflict('Category with this name or slug already exists', 'CATEGORY_EXISTS');
      }
    }

    if (input.name) category.name = input.name;
    if (input.slug || input.name) category.slug = newSlug;
    if (input.description !== undefined) category.description = input.description;
    if (input.image !== undefined) category.image = input.image;

    await category.save();

    await incrementCacheVersion('categories');
    await incrementCacheVersion('products');
    return category;
  }

  /**
   * Admin: Delete category with product safety check
   */
  async deleteCategory(id: string): Promise<{ message: string }> {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }

    const inUseCount = await Product.countDocuments({
      category: category._id,
      isDeleted: { $ne: true }
    });

    if (inUseCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete '${category.name}' because ${inUseCount} product(s) are assigned to it as their primary category. Please reassign or update those products first.`,
        'CATEGORY_IN_USE'
      );
    }

    await Category.findByIdAndDelete(id);
    await Product.updateMany({ categories: category._id }, { $pull: { categories: category._id } });

    await incrementCacheVersion('categories');
    await incrementCacheVersion('products');
    return { message: `Category '${category.name}' deleted successfully` };
  }

  /**
   * Admin: Seed default categories (if already exist, skip)
   */
  async seedDefaultCategories(): Promise<{ created: number; skipped: number; total: number }> {
    let created = 0;
    let skipped = 0;

    for (const def of DEFAULT_CATEGORIES) {
      const existing = await Category.findOne({
        $or: [
          { slug: def.slug },
          { name: { $regex: new RegExp(`^${escapeRegex(def.name)}$`, 'i') } }
        ]
      });

      if (existing) {
        // If existing category lacks an image, attach matching icon
        if (!existing.image && def.image) {
          existing.image = def.image;
          await existing.save();
        }
        skipped++;
      } else {
        await Category.create({
          name: def.name,
          slug: def.slug,
          description: def.description,
          image: def.image
        });
        created++;
      }
    }

    if (created > 0) {
      await incrementCacheVersion('categories');
    }

    return {
      created,
      skipped,
      total: DEFAULT_CATEGORIES.length
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
