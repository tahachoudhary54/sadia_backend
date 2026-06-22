import express  from 'express';
const router = express.Router();
import CartController  from '../controllers/cartController.js';
import { protect }  from '../middleware/authMiddleware.js';

// Require authentication for all persistent cart operations
router.use(protect);

router.get("/", CartController.getCart);
router.post("/add", CartController.addToCart);
router.put("/update", CartController.updateCartItem);
router.delete("/remove/:productId", CartController.removeFromCart);
router.post("/sync", CartController.syncCart);

export default router;
