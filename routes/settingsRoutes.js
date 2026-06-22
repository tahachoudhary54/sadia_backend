import express from 'express';
const router = express.Router();
import SettingsController from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

// Public route to get settings
router.get("/", SettingsController.getSettings);

// Admin route to update text settings
router.put("/", protect, admin, SettingsController.updateSettings);

// Admin route to upload hero image
router.post("/upload-hero", protect, admin, upload.single("heroImage"), SettingsController.uploadHeroImage);

// Admin route to delete hero image
router.delete("/hero-image", protect, admin, SettingsController.deleteHeroImage);

// Admin route to upload banner image
router.post("/upload-banner", protect, admin, upload.single("bannerImage"), SettingsController.uploadBannerImage);

// Admin route to delete banner image
router.delete("/banner-image", protect, admin, SettingsController.deleteBannerImage);

export default router;
