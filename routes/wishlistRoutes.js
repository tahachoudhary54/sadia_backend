import express  from 'express';
const router = express.Router();
import WishlistController  from '../controllers/wishlistController.js';
import { protect }  from '../middleware/authMiddleware.js';

// Require authentication for wishlist saves
router.use(protect);

router.get("/", WishlistController.getWishlist);
router.post("/toggle/:productId", WishlistController.toggleWishlist);

export default router;
