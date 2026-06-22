import express  from 'express';
const router = express.Router();
import CouponController  from '../controllers/couponController.js';
import { protect, admin }  from '../middleware/authMiddleware.js';

// Validate coupon (Public route)
router.post("/validate", CouponController.validateCoupon);

// Get all coupons (Admin only)
router.get("/", protect, admin, CouponController.getAllCoupons);

// Create dynamic coupons (Admin only)
router.post("/", protect, admin, CouponController.createCoupon);

// Delete coupon (Admin only)
router.delete("/:id", protect, admin, CouponController.deleteCoupon);

export default router;
