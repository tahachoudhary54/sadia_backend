import Settings from '../models/Settings.js';
import ApiResponse from '../utils/apiResponse.js';

class SettingsController {
  // GET /api/settings
  static async getSettings(req, res, next) {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({}); // Creates default document
      }
      return ApiResponse.success(res, settings, "Settings retrieved successfully.");
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/settings
  static async updateSettings(req, res, next) {
    try {
      const { heroHeading, heroSubheadline, bannerHeading, bannerDescription } = req.body;
      
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings();
      }

      if (heroHeading !== undefined) settings.heroHeading = heroHeading;
      if (heroSubheadline !== undefined) settings.heroSubheadline = heroSubheadline;
      if (bannerHeading !== undefined) settings.bannerHeading = bannerHeading;
      if (bannerDescription !== undefined) settings.bannerDescription = bannerDescription;

      await settings.save();
      
      return ApiResponse.success(res, settings, "Settings updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/settings/upload-hero  (multipart/form-data, field: heroImage)
  static async uploadHeroImage(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, "No image file provided.", 400);
      }

      // Cloudinary storage sets req.file.path to the remote HTTPS URL.
      // Local disk storage sets req.file.path to a filesystem path (e.g. C:\...\uploads\file.jpg).
      // We must detect which case we're in and build a proper HTTP URL for disk storage.
      const isRemoteUrl = req.file.path && req.file.path.startsWith("http");
      const imageUrl = isRemoteUrl
        ? req.file.path
        : `http://localhost:5000/uploads/${req.file.filename}`;

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      settings.heroImage = imageUrl;
      await settings.save();

      return ApiResponse.success(res, { heroImage: imageUrl }, "Hero image uploaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/settings/hero-image
  static async deleteHeroImage(req, res, next) {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      
      settings.heroImage = "";
      await settings.save();

      return ApiResponse.success(res, null, "Hero image removed successfully.");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/settings/upload-banner  (multipart/form-data, field: bannerImage)
  static async uploadBannerImage(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, "No image file provided.", 400);
      }

      const isRemoteUrl = req.file.path && req.file.path.startsWith("http");
      const imageUrl = isRemoteUrl
        ? req.file.path
        : `http://localhost:5000/uploads/${req.file.filename}`;

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      settings.bannerImage = imageUrl;
      await settings.save();

      return ApiResponse.success(res, { bannerImage: imageUrl }, "Banner image uploaded successfully.");
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/settings/banner-image
  static async deleteBannerImage(req, res, next) {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      
      settings.bannerImage = "";
      await settings.save();

      return ApiResponse.success(res, null, "Banner image removed successfully.");
    } catch (error) {
      next(error);
    }
  }

}

export default SettingsController;
