import express  from 'express';
const router = express.Router();
import OrderController  from '../controllers/orderController.js';
import { protect }  from '../middleware/authMiddleware.js';

// All order transaction routes require secure authentication
router.use(protect);

router.post("/checkout", OrderController.checkout);
router.post("/verify", OrderController.verifyOrder);
router.get("/history", OrderController.getUserOrders);
router.get("/:id", OrderController.getOrderById);

export default router;
