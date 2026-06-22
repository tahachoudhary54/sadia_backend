import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Load Environment variables from .env
dotenv.config();

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import User from "./models/User.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Setup __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express application
const app = express();

// Establish Mongoose Database Connection
connectDB().then(() => {
  // Seed default admin user on successful database boot
  seedDefaultAdmin();
});

// Configure Security & Utility middlewares
app.use(helmet()); // Secure Express apps by setting various HTTP headers
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001"
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan("dev")); // HTTP request logger middleware
app.use(express.json()); // Body parser for application/json payloads
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded values

// Serve local media uploads statically with cross-origin resource policy
// Helmet sets CORP: same-origin by default which blocks localhost:3000 from loading
// images served by localhost:5000. This override allows cross-origin image loading.
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

// Bind API Route modules
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/settings", settingsRoutes);

// Default Health Probe check API
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Sadia Fragrance Attar eCommerce REST API is fully functional.",
    timestamp: new Date().toISOString()
  });
});

// Capture invalid route queries
app.use((req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Bind global custom error handler
app.use(errorHandler);

/**
 * Automatically seeds default Admin user if none exists in the database
 */
async function seedDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@sadiafragnance.com";
    const adminCount = await User.countDocuments({ role: "admin" });
    
    if (adminCount === 0) {
      console.log(`[Admin Seeding] No admin accounts detected. Provisioning default account: ${adminEmail}...`);
      await User.create({
        name: process.env.ADMIN_NAME || "Admin Sadia",
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || "AdminSadiaAttar2025!",
        role: "admin"
      });
      console.log("[Admin Seeding] Default admin account successfully seeded.");
    } else {
      console.log("[Admin Seeding] Administrative credentials verified in database.");
    }
  } catch (error) {
    console.error("[Admin Seeding Error] Seeding process failed:", error.message);
  }
}

// Bind server socket listener
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Server] Core Express listener successfully bound to Port: ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Handle unhandled Promise rejections safely
process.on("unhandledRejection", (err) => {
  console.error(`[Fatal Server Error] Unhandled Rejection: ${err.message}`);
  // Gracefully close server & exit process
  server.close(() => process.exit(1));
});
