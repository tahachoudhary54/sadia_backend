import Coupon  from '../models/Coupon.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle all public validation and coupon routines
 */
class CouponController {
  /**
   * Validate a promo code against a cart subtotal
   * POST /api/coupons/validate
   */
  static async validateCoupon(req, res, next) {
    try {
      const { code, subtotal } = req.body;

      if (!code || subtotal === undefined) {
        return ApiResponse.error(res, "Coupon code and cart subtotal are required.", 400);
      }

      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (!coupon) {
        return ApiResponse.error(res, "Invalid coupon code.", 404);
      }

      if (!coupon.isValid(subtotal)) {
        // Return custom details on validation failure reasons
        const isExpired = new Date() > coupon.expiryDate;
        const isBelowMin = subtotal < coupon.minPurchaseAmount;
        
        let message = "This coupon code is not valid.";
        if (isExpired) message = "This coupon code has expired.";
        else if (isBelowMin) message = `Minimum purchase amount of ₹${coupon.minPurchaseAmount.toLocaleString('en-IN')} required to apply.`;
        else if (!coupon.active) message = "This coupon code is currently disabled.";

        return ApiResponse.error(res, message, 400);
      }

      // Calculate final discount value
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = subtotal * (coupon.discountValue / 100);
      } else {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, subtotal); // Prevent negative balances

      return ApiResponse.success(res, {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount
      }, "Coupon code applied successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new coupon code
   * POST /api/coupons (Admin only routes wrap this)
   */
  static async createCoupon(req, res, next) {
    try {
      const { code, discountType, discountValue, expiryDate, minPurchaseAmount, active } = req.body;

      if (!code || !discountType || discountValue === undefined || !expiryDate) {
        return ApiResponse.error(res, "Code, discountType, discountValue, and expiryDate are required.", 400);
      }

      const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
      if (couponExists) {
        return ApiResponse.push(res, "A coupon with this code already exists.", 400);
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        expiryDate: new Date(expiryDate),
        minPurchaseAmount: minPurchaseAmount || 0,
        active: active !== undefined ? active : true
      });

      return ApiResponse.success(res, coupon, "Coupon created successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all coupons
   * GET /api/coupons (Admin only)
   */
  static async getAllCoupons(req, res, next) {
    try {
      const coupons = await Coupon.find({}).sort({ createdAt: -1 });
      return ApiResponse.success(res, coupons, "Coupons fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a coupon
   * DELETE /api/coupons/:id (Admin only)
   */
  static async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id);
      
      if (!coupon) {
        return ApiResponse.error(res, "Coupon not found.", 404);
      }

      await coupon.deleteOne();
      return ApiResponse.success(res, null, "Coupon deleted successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default CouponController;
