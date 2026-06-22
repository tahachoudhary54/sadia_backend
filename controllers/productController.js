import Product  from '../models/Product.js';
import Category  from '../models/Category.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle all public-facing Product endpoints
 */
class ProductController {
  /**
   * Retrieves all products with advanced keyword search, category, tag, sorting, and pagination
   * GET /api/products
   */
  static async getProducts(req, res, next) {
    try {
      const { 
        category, 
        search, 
        featured, 
        bestseller, 
        sort, 
        page = 1, 
        limit = 9 
      } = req.query;

      const queryObj = {};

      // Search by keyword in name or description (case-insensitive regex)
      if (search) {
        queryObj.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }

      // Filter by Category slug or Category ID
      if (category) {
        // Resolve slug to category ID if it's not a valid Mongoose ObjectId
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
        if (isObjectId) {
          queryObj.category = category;
        } else {
          const matchedCategory = await Category.findOne({ slug: category });
          if (matchedCategory) {
            queryObj.category = matchedCategory._id;
          } else {
            // Category slug not found: force empty result
            queryObj.category = "000000000000000000000000";
          }
        }
      }

      // Filter by featured/bestseller tags
      if (featured !== undefined) {
        queryObj.featured = featured === "true";
      }

      if (bestseller !== undefined) {
        queryObj.bestseller = bestseller === "true";
      }

      // Database query builder
      let query = Product.find(queryObj).populate("category", "name slug");

      // Sorting maps
      if (sort) {
        switch (sort) {
          case "price-low-high":
            query = query.sort("price");
            break;
          case "price-high-low":
            query = query.sort("-price");
            break;
          case "latest":
            query = query.sort("-createdAt");
            break;
          default:
            query = query.sort("-createdAt"); // default latest
        }
      } else {
        query = query.sort("-createdAt");
      }

      // Pagination mathematical logic
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const totalProducts = await Product.countDocuments(queryObj);
      const totalPages = Math.ceil(totalProducts / limitNum);

      // Execute mongoose query
      const products = await query.skip(skip).limit(limitNum);

      return ApiResponse.success(res, {
        products,
        pagination: {
          totalProducts,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }, "Products fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves detailed single product details by its SEO-friendly slug
   * GET /api/products/:slug
   */
  static async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const product = await Product.findOne({ slug }).populate("category", "name slug description");
      if (!product) {
        return ApiResponse.error(res, "Product not found.", 404);
      }

      return ApiResponse.success(res, product, "Product details loaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all product categories
   * GET /api/products/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = await Category.find({});
      return ApiResponse.success(res, categories, "Categories fetched successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;
