import express  from 'express';
const router = express.Router();
import ReviewController  from '../controllers/reviewController.js';
import { protect }  from '../middleware/authMiddleware.js';
import upload  from '../middleware/uploadMiddleware.js';

// Retrieve product reviews (Public route)
router.get("/product/:productId", ReviewController.getProductReviews);

// Add a new review (Requires login & supports image uploads via Multer up to 3 files)
router.post("/", protect, upload.array("images", 3), ReviewController.addReview);

export default router;
