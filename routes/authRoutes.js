import express from "express";
import AuthController from "../controllers/authController.js";

const router = express.Router();

// OTP Creation and verification routes
router.post("/send-otp", AuthController.sendOtp);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);

// Standard credentials authentication routes
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.getMe); // Optional me route

// Forgot / reset password routes
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export default router;
