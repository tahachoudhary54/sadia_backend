import { v2 as cloudinary } from 'cloudinary';
import path from 'path';// Check if Cloudinary keys are configured in environment
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "cloudinary_dev";

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

class CloudinaryService {
  /**
   * Upload an image buffer or file path directly to Cloudinary
   * @param {string} filePath - Absolute path to local temporary file
   * @param {string} folder - Destination folder on Cloudinary dashboard
   */
  static async uploadImage(filePath, folder = "sadia-fragrance-products") {
    if (!hasCloudinaryConfig) {
      console.warn("[Cloudinary Mock] Missing keys. Mocking successful upload for path:", filePath);
      return {
        url: `/uploads/${path.basename(filePath)}`,
        publicId: `mock-public-id-${Date.now()}`
      };
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        use_filename: true,
        unique_filename: true,
        overwrite: true
      });
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error("[Cloudinary Error] Media asset upload failed:", error.message);
      throw new Error(`Cloudinary integration failed: ${error.message}`);
    }
  }

  /**
   * Delete an image from Cloudinary using its unique Public ID
   * @param {string} publicId - Cloudinary unique asset identifier
   */
  static async deleteImage(publicId) {
    if (!hasCloudinaryConfig || !publicId || publicId.startsWith("mock-")) {
      console.warn("[Cloudinary Mock] Skipping asset delete for ID:", publicId);
      return { result: "ok" };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error("[Cloudinary Error] Media asset deletion failed:", error.message);
      throw new Error(`Cloudinary delete integration failed: ${error.message}`);
    }
  }
}

export default CloudinaryService;
