import express  from 'express';
const router = express.Router();
import AdminController  from '../controllers/adminController.js';
import NotificationController from '../controllers/notificationController.js';
import ProductValidator  from '../validators/productValidator.js';
import { protect, admin }  from '../middleware/authMiddleware.js';
import upload  from '../middleware/uploadMiddleware.js';

// Require both Authentication and Administrative roles globally
router.use(protect);
router.use(admin);

// 1. Dashboard Analytics Summary
router.get("/dashboard", AdminController.getDashboardAnalytics);

// 2. Administrative Product Catalogue Management (CRUD)
// Create product with multer image upload up to 5 files
router.post(
  "/products", 
  upload.array("images", 5), 
  ProductValidator.validateProduct, 
  AdminController.createProduct
);

// Edit product attributes (accepts optional additional images)
router.put("/products/:id", upload.array("images", 5), AdminController.updateProduct);

// Delete product
router.delete("/products/:id", AdminController.deleteProduct);

// 3. User lists management
router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUserDetails);
router.put("/users/:id", upload.single("avatar"), AdminController.updateUser);
router.put("/users/:id/password", AdminController.changePassword);
router.delete("/users/:id", AdminController.deleteUser);

// 4. Order tracking & fulfillment sheet updates
router.get("/orders", AdminController.getOrders);
router.put("/orders/:id/status", AdminController.updateOrderStatus);

// 5. Real-time Admin Notifications
router.get("/notifications/stream", NotificationController.stream);   // SSE stream
router.get("/notifications", NotificationController.getNotifications); // Fetch recent
router.patch("/notifications/read-all", NotificationController.markAllRead);
router.patch("/notifications/:id/read", NotificationController.markRead);

export default router;

