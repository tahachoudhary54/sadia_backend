import Review  from '../models/Review.js';
import Product  from '../models/Product.js';
import CloudinaryService  from '../services/cloudinaryService.js';
import ApiResponse  from '../utils/apiResponse.js';
import fs from "fs";

/**
 * Controller to handle product customer Reviews & Ratings
 */
class ReviewController {
  /**
   * Submit a new customer review and rating for a product
   * POST /api/reviews
   */
  static async addReview(req, res, next) {
    try {
      const { productId, rating, comment } = req.body;
      const files = req.files || []; // Images uploaded via multer

      if (!productId || !rating || !comment) {
        return ApiResponse.error(res, "Product ID, rating (1-5), and comments are required.", 400);
      }

      // Verify product exists in db
      const product = await Product.findById(productId);
      if (!product) {
        return ApiResponse.error(res, "Product not found.", 404);
      }

      // Ensure user hasn't already reviewed this product
      const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product: productId
      });

      if (alreadyReviewed) {
        return ApiResponse.error(res, "You have already reviewed this product.", 400);
      }

      // Process uploaded images
      const reviewImages = [];
      for (const file of files) {
        const uploadResult = await CloudinaryService.uploadImage(file.path, "sadia-reviews");
        reviewImages.push(uploadResult);

        // Delete temporary file from local storage if using Cloudinary
        if (file.path && fs.existsSync(file.path) && !file.path.includes("uploads/")) {
          fs.unlinkSync(file.path);
        }
      }

      const review = await Review.create({
        user: req.user._id,
        product: productId,
        rating: Number(rating),
        comment,
        images: reviewImages
      });

      return ApiResponse.success(res, review, "Review submitted successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve all public reviews submitted for a single product
   * GET /api/reviews/product/:productId
   */
  static async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;

      const reviews = await Review.find({ product: productId })
        .populate("user", "name")
        .sort("-createdAt");

      return ApiResponse.success(res, reviews, "Product reviews fetched successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
