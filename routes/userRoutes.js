import express  from 'express';
const router = express.Router();
import UserController  from '../controllers/userController.js';
import { protect }  from '../middleware/authMiddleware.js';

// Enforce protection globally across all profile address parameters
router.use(protect);

// Update user details
router.put("/profile", UserController.updateProfile);

// Address book management
router.post("/addresses", UserController.addAddress);
router.delete("/addresses/:id", UserController.deleteAddress);
router.put("/addresses/:id/default", UserController.setAddressDefault);

export default router;
