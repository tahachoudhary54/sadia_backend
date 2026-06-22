import mongoose from 'mongoose';
import Product  from '../models/Product.js';
import fs from 'fs';
import Category  from '../models/Category.js';
import Order  from '../models/Order.js';
import User  from '../models/User.js';
import CloudinaryService  from '../services/cloudinaryService.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle all Administrative dashboard and catalog workflows
 */
class AdminController {
  /**
   * Generates key sales analytics, orders, revenue, top attars, and customer registries
   * GET /api/admin/dashboard
   */
  static async getDashboardAnalytics(req, res, next) {
    try {
      // 1. Core counters
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalOrders = await Order.countDocuments({});
      const totalProducts = await Product.countDocuments({});

      // Active Users (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = await User.countDocuments({ role: "user", updatedAt: { $gte: thirtyDaysAgo } });

      // Conversion Rate (rough estimate based on orders per user)
      const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : "0.0";

      // 2. Revenue aggregation (paid orders only)
      const salesAggregation = await Order.aggregate([
        { $match: { "paymentInfo.status": "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$pricing.total" } } }
      ]);
      const totalRevenue = salesAggregation.length > 0 ? salesAggregation[0].totalRevenue : 0;

      // 3. Monthly revenue for requested timeframe (default 6 months)
      const timeframe = parseInt(req.query.timeframe) || 6;
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - (timeframe - 1), 1);
      const monthlyAgg = await Order.aggregate([
        { $match: { "paymentInfo.status": "paid", createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            revenue: { $sum: "$pricing.total" }
          }
        }
      ]);
      const monthlyRevenue = Array(timeframe).fill(0);
      monthlyAgg.forEach(({ _id, revenue }) => {
        const monthDiff =
          (now.getFullYear() - _id.year) * 12 + (now.getMonth() + 1 - _id.month);
        if (monthDiff >= 0 && monthDiff < timeframe) {
          monthlyRevenue[(timeframe - 1) - monthDiff] = revenue;
        }
      });

      // 4. Inventory alerts — products with stock < 10
      const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
        .select("name stock")
        .sort("stock")
        .limit(5);
      const inventoryAlerts = lowStockProducts.length > 0
        ? lowStockProducts.map(p => ({
            name: p.name,
            stock: p.stock,
            status: p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Critical Alert" : "Low Stock"
          }))
        : [{ name: "All items well stocked", stock: "✓", status: "Healthy" }];

      // 5. Top-selling products aggregation
      const topSellingAttars = await Order.aggregate([
        { $match: { "paymentInfo.status": "paid" } },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            name: { $first: "$products.name" },
            size: { $first: "$products.size" },
            totalUnitsSold: { $sum: "$products.quantity" },
            totalEarnings: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
          }
        },
        { $sort: { totalUnitsSold: -1 } },
        { $limit: 5 }
      ]);

      // 6. Recent customer orders
      const recentOrders = await Order.find({})
        .populate("user", "name email")
        .sort("-createdAt")
        .limit(6);

      return ApiResponse.success(res, {
        summary: { totalUsers, totalOrders, totalRevenue, totalProducts, activeUsers, conversionRate },
        monthlyRevenue,
        inventoryAlerts,
        topSellingAttars,
        recentOrders
      }, "Administrative analytics loaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a brand new fragrance product to the catalog
   * POST /api/admin/products
   */
  static async createProduct(req, res, next) {
    try {
      const { 
        name, 
        description, 
        price, 
        category, 
        stock, 
        featured, 
        bestseller, 
        sizes, 
        fragranceNotes, 
        ingredients 
      } = req.body;
      const files = req.files || []; // Multyparent Multer uploads

      // Autogenerate SEO-friendly slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const productExists = await Product.findOne({ slug });
      if (productExists) {
        return ApiResponse.error(res, "A product with a similar name already exists.", 400);
      }

      // Verify category ID exists or create it dynamically
      let catExists;
      if (mongoose.Types.ObjectId.isValid(category)) {
        catExists = await Category.findById(category);
      } else {
        const catName = category || "Attar Premium";
        const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        catExists = await Category.findOne({ $or: [{ name: catName }, { slug: catSlug }] });
        if (!catExists) {
          catExists = await Category.create({
            name: catName,
            slug: catSlug,
            description: "Autogenerated category"
          });
        }
      }
      
      const categoryId = catExists._id;

      // Upload product media assets to Cloudinary
      const imageAssets = [];
      for (const file of files) {
        const uploadResult = await CloudinaryService.uploadImage(file.path, "sadia-products");
        imageAssets.push(uploadResult);

        // Remove temp file after upload
        if (file.path && fs.existsSync(file.path) && !file.path.includes("uploads/")) {
          fs.unlinkSync(file.path);
        }
      }

      const product = await Product.create({
        name,
        slug,
        description,
        price: Number(price),
        category: categoryId,
        stock: Number(stock),
        featured: featured === "true" || featured === true,
        bestseller: bestseller === "true" || bestseller === true,
        sizes: typeof sizes === "string" ? JSON.parse(sizes) : sizes,
        fragranceNotes: typeof fragranceNotes === "string" ? JSON.parse(fragranceNotes) : fragranceNotes,
        ingredients: typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients,
        images: imageAssets
      });

      return ApiResponse.success(res, product, "Attar product created successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit catalog attributes of an existing product
   * PUT /api/admin/products/:id
   */
  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const files = req.files || [];

      let product = await Product.findById(id);
      if (!product) {
        // If it doesn't exist, it might be a frontend mock product being edited.
        // We initialize a new document with this specific ID so it gets saved correctly.
        product = new Product({ _id: id });
      }

      // Handle custom fields parses if sent as JSON strings via standard FormData
      if (updates.sizes && typeof updates.sizes === "string") {
        updates.sizes = JSON.parse(updates.sizes);
      }
      if (updates.fragranceNotes && typeof updates.fragranceNotes === "string") {
        updates.fragranceNotes = JSON.parse(updates.fragranceNotes);
      }
      if (updates.ingredients && typeof updates.ingredients === "string") {
        updates.ingredients = JSON.parse(updates.ingredients);
      }

      // Autogenerate name slug if name has changed
      if (updates.name && updates.name !== product.name) {
        updates.slug = updates.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      // Process and append new image files
      if (files.length > 0) {
        const newImageAssets = [];
        for (const file of files) {
          const uploadResult = await CloudinaryService.uploadImage(file.path, "sadia-products");
          newImageAssets.push(uploadResult);
          
          if (file.path && fs.existsSync(file.path) && !file.path.includes("uploads/")) {
            fs.unlinkSync(file.path);
          }
        }
        product.images.push(...newImageAssets);
      }

      // Process category if it is being updated
      if (updates.category) {
        let catExists;
        if (mongoose.Types.ObjectId.isValid(updates.category)) {
          catExists = await Category.findById(updates.category);
        } else {
          const catSlug = updates.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          catExists = await Category.findOne({ $or: [{ name: updates.category }, { slug: catSlug }] });
          if (!catExists) {
            catExists = await Category.create({
              name: updates.category,
              slug: catSlug,
              description: "Autogenerated category"
            });
          }
        }
        if (catExists) {
          updates.category = catExists._id;
        }
      }

      // Update remaining payload fields dynamically
      Object.keys(updates).forEach((key) => {
        if (key !== "images") {
          product[key] = updates[key];
        }
      });

      await product.save();

      // Fire low-stock notification if stock drops below 10 after manual update
      if (product.stock < 10) {
        // We import broadcast dynamically here or at the top of the file
        const { broadcast } = await import('../utils/sseClients.js');
        const lowStockNotif = await import('../models/Notification.js').then(m => m.default).then(Notification => 
          Notification.create({
            type: "low_stock",
            title: "Low Stock Alert",
            desc: `${product.name} is running low (${product.stock} unit${product.stock === 1 ? '' : 's'} remaining).`,
            meta: { productId: product._id, stock: product.stock }
          })
        );
        broadcast("low_stock", lowStockNotif);
      }

      return ApiResponse.success(res, product, "Product catalog updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes product from database and destroys active Cloudinary image mappings
   * DELETE /api/admin/products/:id
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        // If the product isn't found, it might be a mock product that only existed in the frontend state.
        // Returning success allows the frontend to gracefully remove it from the UI.
        return ApiResponse.success(res, null, "Product removed from catalog successfully.");
      }

      // Destroy all product image assets in Cloudinary
      for (const image of product.images) {
        if (image.publicId) {
          await CloudinaryService.deleteImage(image.publicId);
        }
      }

      await Product.findByIdAndDelete(id);

      return ApiResponse.success(res, null, "Product deleted from catalog successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves entire list of user registrations
   * GET /api/admin/users
   */
  static async getUsers(req, res, next) {
    try {
      const usersRaw = await User.aggregate([
        { $match: { role: "user" } },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "user",
            as: "orders"
          }
        },
        {
          $addFields: {
            totalPurchased: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$orders",
                      as: "order",
                      cond: { $ne: ["$$order.orderStatus", "cancelled"] }
                    }
                  },
                  as: "validOrder",
                  in: "$$validOrder.pricing.total"
                }
              }
            }
          }
        },
        { $project: { password: 0, orders: 0 } },
        { $sort: { createdAt: -1 } }
      ]);

      const users = usersRaw.map(u => {
        let loyalty = "Bronze Patron";
        if (u.totalPurchased >= 50000) loyalty = "Royal Gold Inner Circle";
        else if (u.totalPurchased >= 20000) loyalty = "Silver Patron";
        
        return {
          ...u,
          loyalty
        };
      });

      return ApiResponse.success(res, users, "Users fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all customer orders
   * GET /api/admin/orders
   */
  static async getOrders(req, res, next) {
    try {
      const orders = await Order.find({})
        .populate("user", "name email")
        .sort("-createdAt");
      return ApiResponse.success(res, orders, "Orders fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Changes status of customer order and appends carrier tracking details
   * PUT /api/admin/orders/:id/status
   */
  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { orderStatus, trackingNumber, carrier } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return ApiResponse.error(res, "Order not found.", 404);
      }

      if (orderStatus) {
        order.orderStatus = orderStatus;
        if (orderStatus === "delivered") {
          order.deliveredAt = Date.now();
          order.paymentInfo.status = "paid"; // Auto reconcile paid on receipt
        }
      }
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;

      await order.save();

      // Emit order_updated to trigger real-time refresh
      const { broadcast } = await import('../utils/sseClients.js');
      broadcast("order_updated", { orderId: order._id, status: order.orderStatus });

      return ApiResponse.success(res, order, `Order status updated to '${order.orderStatus}' successfully.`);
    } catch (error) {
      next(error);
    }
  }
  /**
   * Retrieves single user details including addresses and orders
   * GET /api/admin/users/:id
   */
  static async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-password");
      if (!user) {
        return ApiResponse.error(res, "User not found.", 404);
      }
      const orders = await Order.find({ user: id }).sort("-createdAt");
      return ApiResponse.success(res, { user, orders }, "User details fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user details
   * PUT /api/admin/users/:id
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      
      const user = await User.findById(id);
      if (!user) {
        return ApiResponse.error(res, "User not found.", 404);
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      
      if (req.file) {
        // multer-storage-cloudinary already uploads the file and sets req.file.path to the Cloudinary URL
        user.avatar = req.file.path;
      }

      await user.save();
      return ApiResponse.success(res, user, "User updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change admin password
   * PUT /api/admin/users/:id/password
   */
  static async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return ApiResponse.error(res, "Please provide current and new passwords.", 400);
      }

      const user = await User.findById(id).select("+password");
      if (!user) {
        return ApiResponse.error(res, "User not found.", 404);
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return ApiResponse.error(res, "Incorrect current password.", 401);
      }

      user.password = newPassword;
      await user.save();

      return ApiResponse.success(res, null, "Password updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return ApiResponse.error(res, "User not found.", 404);
      }
      return ApiResponse.success(res, null, "User deleted successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
