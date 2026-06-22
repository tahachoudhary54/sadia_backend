import Order  from '../models/Order.js';
import Product  from '../models/Product.js';
import Coupon  from '../models/Coupon.js';
import User  from '../models/User.js';
import StripeService  from '../services/stripeService.js';
import ApiResponse  from '../utils/apiResponse.js';
import Notification from '../models/Notification.js';
import { broadcast } from '../utils/sseClients.js';

/**
 * Controller to handle checkouts, secure payments, order logs
 */
class OrderController {
  /**
   * Generates a Stripe PaymentIntent after validating catalog prices, stock, and coupon discounts
   * POST /api/orders/checkout
   */
  static async checkout(req, res, next) {
    try {
      const { items, shippingInfo, couponCode } = req.body; // items: [{ product: id, quantity: num, size: str }]

      if (!items || items.length === 0 || !shippingInfo) {
        return ApiResponse.error(res, "Checkout items and shipping details are required.", 400);
      }

      let subtotal = 0;
      const validatedItems = [];

      // Validate pricing and stock limits for each checkout item
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return ApiResponse.error(res, `Product not found in system: ${item.product}`, 404);
        }

        // Validate stock level
        if (product.stock < item.quantity) {
          return ApiResponse.error(
            res, 
            `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`, 
            400
          );
        }

        // Calculate size specific price
        const sizeOpt = product.sizes.find((s) => s.size === item.size);
        const sizeMultiplier = sizeOpt ? sizeOpt.priceMultiplier : 1;
        const finalUnitPrice = product.price * sizeMultiplier;
        const itemTotal = finalUnitPrice * item.quantity;

        subtotal += itemTotal;

        validatedItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: finalUnitPrice,
          size: item.size
        });
      }

      // Calculate coupon discount if provided
      let discount = 0;
      let couponDoc = null;
      if (couponCode) {
        couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (couponDoc && couponDoc.isValid(subtotal)) {
          if (couponDoc.discountType === "percentage") {
            discount = subtotal * (couponDoc.discountValue / 100);
          } else {
            discount = couponDoc.discountValue;
          }
          // Ensure discount does not exceed subtotal
          discount = Math.min(discount, subtotal);
        }
      }

      // Complimentary shipping over ₹10k INR, otherwise flat ₹2k INR fee
      const shippingFee = subtotal >= 10000 ? 0 : 2000;
      const total = subtotal + shippingFee - discount;

      // Create Stripe PaymentIntent (Stripe expects amount in subunits, e.g. Paise for INR)
      const amountInPaise = Math.round(total * 100);
      const paymentIntent = await StripeService.createPaymentIntent(amountInPaise, "inr", {
        userId: req.user._id.toString(),
        couponApplied: couponDoc ? couponDoc.code : "none"
      });

      return ApiResponse.success(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        pricing: {
          subtotal,
          shippingFee,
          discount,
          total
        },
        shippingInfo,
        items: validatedItems
      }, "Stripe checkout session initialized successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save verified checkout details to database and deduct catalogue stock levels
   * POST /api/orders/verify
   */
  static async verifyOrder(req, res, next) {
    try {
      const { paymentIntentId, items, shippingInfo, pricing, couponApplied } = req.body;

      if (!paymentIntentId || !items || !shippingInfo || !pricing) {
        return ApiResponse.error(res, "Missing purchase elements for validation.", 400);
      }

      // Verify PaymentIntent state via Stripe API
      const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return ApiResponse.error(res, `Payment verification failed. Status: ${paymentIntent.status}`, 400);
      }

      // Double-check if this PaymentIntent has already been mapped to an existing order in database
      const orderExists = await Order.findOne({ "paymentInfo.id": paymentIntentId });
      if (orderExists) {
        return ApiResponse.success(res, orderExists, "Order already successfully logged.");
      }

      // Deduct inventory stock levels and check for low stock
      for (const item of items) {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        // Fire low-stock notification if stock drops below 5
        if (updatedProduct && updatedProduct.stock < 5) {
          const lowStockNotif = await Notification.create({
            type: "low_stock",
            title: "Low Stock Alert",
            desc: `${updatedProduct.name} is running low (${updatedProduct.stock} unit${updatedProduct.stock === 1 ? '' : 's'} remaining).`,
            meta: { productId: updatedProduct._id, stock: updatedProduct.stock }
          });
          broadcast("low_stock", lowStockNotif);
        }
      }

      // Create Mongoose Order record
      const order = await Order.create({
        user: req.user._id,
        products: items,
        shippingInfo,
        couponApplied,
        pricing,
        paymentInfo: {
          id: paymentIntentId,
          status: "paid",
          method: "Stripe"
        },
        orderStatus: "processing" // Default status on secure receipt capture
      });

      // Save & broadcast new-order notification
      const orderNotif = await Notification.create({
        type: "new_order",
        title: "New Order Received",
        desc: `Order #${order._id.toString().slice(-6).toUpperCase()} placed by ${shippingInfo.name}.`,
        meta: { orderId: order._id, total: pricing.total }
      });
      broadcast("new_order", orderNotif);

      // Clear customer's persistent database cart on successful checkout
      await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

      return ApiResponse.success(res, order, "Order registered and processed successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves order history of authenticated customer
   * GET /api/orders/history
   */
  static async getUserOrders(req, res, next) {
    try {
      const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
      return ApiResponse.success(res, orders, "Order history loaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves single order detail
   * GET /api/orders/:id
   */
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id).populate("products.product", "images slug name");
      if (!order) {
        return ApiResponse.error(res, "Order not found.", 404);
      }

      // Ensure that only the ordering customer or admins can view details
      const isOwner = order.user.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return ApiResponse.error(res, "Unauthorized access to order logs.", 403);
      }

      return ApiResponse.success(res, order, "Order details loaded successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default OrderController;
