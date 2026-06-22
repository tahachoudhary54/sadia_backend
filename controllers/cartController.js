import User  from '../models/User.js';
import Product  from '../models/Product.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle all database-backed persistent Cart endpoints
 */
class CartController {
  /**
   * Retrieve the user's persistent database cart with product metadata
   * GET /api/cart
   */
  static async getCart(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate({
        path: "cart.product",
        select: "name slug price images sizes stock"
      });

      return ApiResponse.success(res, user.cart, "Cart fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a product item to the user's database cart
   * POST /api/cart/add
   */
  static async addToCart(req, res, next) {
    try {
      const { productId, quantity = 1, size } = req.body;

      if (!productId || !size) {
        return ApiResponse.error(res, "Product ID and size must be provided.", 400);
      }

      // Verify product exists in catalog
      const product = await Product.findById(productId);
      if (!product) {
        return ApiResponse.error(res, "Product not found in catalogue.", 404);
      }

      // Check size options validity
      const sizeMatched = product.sizes.some((s) => s.size === size);
      if (!sizeMatched) {
        return ApiResponse.error(res, `Invalid size: '${size}' for this attar product.`, 400);
      }

      const user = await User.findById(req.user._id);

      // Check if product with the specific size is already present in cart
      const cartItemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId && item.size === size
      );

      if (cartItemIndex > -1) {
        user.cart[cartItemIndex].quantity += Number(quantity);
      } else {
        user.cart.push({
          product: productId,
          quantity: Number(quantity),
          size
        });
      }

      await user.save();

      // Retrieve full updated details to send back
      const updatedUser = await User.findById(req.user._id).populate({
        path: "cart.product",
        select: "name slug price images sizes stock"
      });

      return ApiResponse.success(res, updatedUser.cart, "Item added to cart successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit item quantity or size of cart records
   * PUT /api/cart/update
   */
  static async updateCartItem(req, res, next) {
    try {
      const { productId, quantity, size } = req.body;

      if (!productId || !size || quantity === undefined) {
        return ApiResponse.error(res, "Product ID, size, and quantity must be specified.", 400);
      }

      const user = await User.findById(req.user._id);

      const cartItemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId && item.size === size
      );

      if (cartItemIndex === -1) {
        return ApiResponse.error(res, "Item not found in your cart.", 404);
      }

      if (Number(quantity) <= 0) {
        // Delete item from cart if target quantity is 0 or less
        user.cart.splice(cartItemIndex, 1);
      } else {
        user.cart[cartItemIndex].quantity = Number(quantity);
      }

      await user.save();

      const updatedUser = await User.findById(req.user._id).populate({
        path: "cart.product",
        select: "name slug price images sizes stock"
      });

      return ApiResponse.success(res, updatedUser.cart, "Cart item updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete item from the persistent cart
   * DELETE /api/cart/remove/:productId
   */
  static async removeFromCart(req, res, next) {
    try {
      const { productId } = req.params;
      const { size } = req.query; // Size is optional/required to uniquely target multi-sized items

      if (!size) {
        return ApiResponse.error(res, "Size query parameter is required to identify uniquely.", 400);
      }

      const user = await User.findById(req.user._id);

      user.cart = user.cart.filter(
        (item) => !(item.product.toString() === productId && item.size === size)
      );

      await user.save();

      const updatedUser = await User.findById(req.user._id).populate({
        path: "cart.product",
        select: "name slug price images sizes stock"
      });

      return ApiResponse.success(res, updatedUser.cart, "Item removed from cart.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk-sync Next.js client localStorage cart list to database on login events
   * POST /api/cart/sync
   */
  static async syncCart(req, res, next) {
    try {
      const { cartItems } = req.body; // Array of { product: id, quantity: num, size: str }

      if (!cartItems || !Array.isArray(cartItems)) {
        return ApiResponse.error(res, "Sync items must be formatted as an array list.", 400);
      }

      const user = await User.findById(req.user._id);

      // Merge arrays carefully
      for (const syncItem of cartItems) {
        if (!syncItem.product || !syncItem.size) continue;

        const cartItemIndex = user.cart.findIndex(
          (item) => item.product.toString() === syncItem.product && item.size === syncItem.size
        );

        if (cartItemIndex > -1) {
          // If exists, respect larger quantity or merge them
          user.cart[cartItemIndex].quantity = Math.max(
            user.cart[cartItemIndex].quantity,
            syncItem.quantity
          );
        } else {
          user.cart.push({
            product: syncItem.product,
            quantity: syncItem.quantity,
            size: syncItem.size
          });
        }
      }

      await user.save();

      const updatedUser = await User.findById(req.user._id).populate({
        path: "cart.product",
        select: "name slug price images sizes stock"
      });

      return ApiResponse.success(res, updatedUser.cart, "Cart synced successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default CartController;
