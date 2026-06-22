import User  from '../models/User.js';
import Product  from '../models/Product.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle all database-backed user Wishlists
 */
class WishlistController {
  /**
   * Fetch all product records currently residing in the user's wishlist
   * GET /api/wishlist
   */
  static async getWishlist(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate({
        path: "wishlist",
        select: "name slug price images stock bestseller featured ratings"
      });

      return ApiResponse.success(res, user.wishlist, "Wishlist loaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggles product in user's wishlist (adds if absent, removes if present)
   * POST /api/wishlist/toggle/:productId
   */
  static async toggleWishlist(req, res, next) {
    try {
      const { productId } = req.params;

      // Verify product exists in DB
      const product = await Product.findById(productId);
      if (!product) {
        return ApiResponse.error(res, "Product not found.", 404);
      }

      const user = await User.findById(req.user._id);

      const inWishlist = user.wishlist.includes(productId);
      let message = "";

      if (inWishlist) {
        // Remove item from wishlist array
        user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
        message = "Removed from wishlist successfully.";
      } else {
        // Add item to wishlist array
        user.wishlist.push(productId);
        message = "Added to wishlist successfully.";
      }

      await user.save();

      // Retrieve full details of the updated wishlist
      const updatedUser = await User.findById(req.user._id).populate({
        path: "wishlist",
        select: "name slug price images stock bestseller featured ratings"
      });

      return ApiResponse.success(res, updatedUser.wishlist, message);
    } catch (error) {
      next(error);
    }
  }
}

export default WishlistController;
