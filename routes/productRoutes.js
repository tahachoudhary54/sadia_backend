import express  from 'express';
const router = express.Router();
import ProductController  from '../controllers/productController.js';

// Retrieve all categories
router.get("/categories", ProductController.getCategories);

// Retrieve products with search, sorting, filtering, and pagination
router.get("/", ProductController.getProducts);

// Retrieve detailed single product attributes by SEO slug
router.get("/:slug", ProductController.getProductBySlug);

export default router;
