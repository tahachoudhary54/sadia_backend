import multer  from 'multer';
import { CloudinaryStorage }  from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import path  from 'path';
import fs  from 'fs';

// Ensure local uploads directory exists
const uploadsDir = path.join(import.meta.dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary SDK instance
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "placeholder",
  api_key: process.env.CLOUDINARY_API_KEY || "placeholder",
  api_secret: process.env.CLOUDINARY_API_SECRET || "placeholder"
});

let storage;

// Check if Cloudinary keys are configured in development/production
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "cloudinary_dev";

if (hasCloudinaryConfig) {
  // Use cloud storage engine
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "sadia-fragrance-products",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }] // Auto optimization for luxury layout
    }
  });
  console.log("[Upload Engine] Configured with cloud storage (Cloudinary).");
} else {
  // Fallback to local disk storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.warn("[Upload Engine] Warning: Using LOCAL disk storage fallback. Cloudinary variables missing.");
}

// File filtering utility for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only standard image files (.jpg, .jpeg, .png, .webp) are allowed!"), false);
  }
};

// Limit uploads to 5MB maximum to optimize database payloads
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

export default upload;
