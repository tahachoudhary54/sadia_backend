import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import generateToken from "../utils/generateToken.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import Notification from "../models/Notification.js";
import { broadcast } from "../utils/sseClients.js";

/**
 * Controller to handle all Authentication routes.
 */
class AuthController {
  
  /**
   * Validates signup inputs, checks for existing user, generates 6-digit OTP,
   * hashes and stores it in MongoDB, and triggers Nodemailer email send.
   * POST /api/auth/send-otp
   */
  static async sendOtp(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // 1. Basic validation checks
      if (!name || name.trim() === "") {
        return ApiResponse.error(res, "Name field is required.", 400);
      }
      if (!email || email.trim() === "") {
        return ApiResponse.error(res, "Email field is required.", 400);
      }
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.error(res, "Please provide a valid email format.", 400);
      }
      if (!password || password.length < 6) {
        return ApiResponse.error(res, "Password must be at least 6 characters long.", 400);
      }

      // 2. Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ApiResponse.error(res, "A user with this email address already exists.", 400);
      }

      // 3. Spam protection cooldown check (60-second limit)
      const existingOtp = await Otp.findOne({ email });
      if (existingOtp) {
        const timeDifference = Date.now() - new Date(existingOtp.createdAt).getTime();
        const cooldownLimit = 60 * 1000; // 60 seconds cooldown limit
        
        if (timeDifference < cooldownLimit) {
          const remainingSeconds = Math.ceil((cooldownLimit - timeDifference) / 1000);
          return ApiResponse.error(
            res, 
            `Please wait ${remainingSeconds} seconds before requesting a new OTP.`, 
            429
          );
        }
      }

      // 4. Generate secure 6-digit random numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 5. Secure OTP storage: Hash the OTP code using bcrypt before saving
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      // 6. Define expiration date (5 minutes lifespan)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // 7. Store OTP in database (overwrite/update previous if exists, or create new)
      if (existingOtp) {
        existingOtp.otp = hashedOtp;
        existingOtp.expiresAt = expiresAt;
        existingOtp.createdAt = new Date();
        await existingOtp.save();
      } else {
        await Otp.create({
          email,
          otp: hashedOtp,
          expiresAt
        });
      }

      // 8. Fire Nodemailer verification email using luxury black/gold template
      await sendOtpEmail(email, name, otp);

      return ApiResponse.success(
        res, 
        null, 
        "A secure 6-digit authentication passcode has been dispatched to your email address.", 
        200
      );
    } catch (error) {
      console.error("[sendOtp Controller Error]:", error);
      next(error);
    }
  }

  /**
   * Verifies the OTP, registers the User in the DB, hashes passwords,
   * signs a secure JWT, logs the user in, and deletes the verified OTP document.
   * POST /api/auth/verify-otp
   */
  static async verifyOtp(req, res, next) {
    try {
      const { name, email, password, otp } = req.body;

      // 1. Basic validation
      if (!name || !email || !password || !otp) {
        return ApiResponse.error(res, "All fields (name, email, password, and OTP) are required.", 400);
      }

      // 2. Double-check if user was registered during verification delay
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ApiResponse.error(res, "A user with this email address already exists.", 400);
      }

      // 3. Locate OTP record in database
      const otpDoc = await Otp.findOne({ email });
      if (!otpDoc) {
        return ApiResponse.error(res, "Verification code has expired or is invalid. Please request a new one.", 400);
      }

      // 4. Verify password hashing matching
      const isMatch = await bcrypt.compare(otp, otpDoc.otp);
      if (!isMatch) {
        return ApiResponse.error(res, "The verification passcode you entered is incorrect.", 400);
      }

      // 5. Success: Delete the OTP document immediately to prevent replay attacks
      await Otp.deleteOne({ _id: otpDoc._id });

      // 6. Create the final User account (password is automatically hashed by User model's pre-save middleware)
      const user = await User.create({
        name,
        email,
        password,
        role: "user"
      });

      // Notify admin of new registration in real time
      const newUserNotif = await Notification.create({
        type: "new_user",
        title: "New Member Joined",
        desc: `${name} just joined the Scent Circle.`,
        meta: { userId: user._id, email }
      });
      broadcast("new_user", newUserNotif);

      // 7. Generate securely signed JWT token for immediate auto-login
      const token = generateToken(user._id, user.role);

      return ApiResponse.success(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }, "Your identity has been authenticated. Account successfully created.", 201);
    } catch (error) {
      console.error("[verifyOtp Controller Error]:", error);
      next(error);
    }
  }

  /**
   * Throttles resend requests, issues a fresh 6-digit OTP code, and triggers Nodemailer email.
   * POST /api/auth/resend-otp
   */
  static async resendOtp(req, res, next) {
    try {
      const { name, email } = req.body;

      if (!email) {
        return ApiResponse.error(res, "Email address is required to resend OTP.", 400);
      }

      // 1. Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ApiResponse.error(res, "A user with this email address already exists.", 400);
      }

      // 2. Spam protection cooldown check (60-second limit)
      const existingOtp = await Otp.findOne({ email });
      if (existingOtp) {
        const timeDifference = Date.now() - new Date(existingOtp.createdAt).getTime();
        const cooldownLimit = 60 * 1000; // 60 seconds cooldown limit
        
        if (timeDifference < cooldownLimit) {
          const remainingSeconds = Math.ceil((cooldownLimit - timeDifference) / 1000);
          return ApiResponse.error(
            res, 
            `Please wait ${remainingSeconds} seconds before resending another OTP.`, 
            429
          );
        }
      }

      // 3. Generate secure 6-digit random numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 4. Hash the OTP code using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      // 5. Expiration time (5 minutes lifespan)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // 6. Update database record
      if (existingOtp) {
        existingOtp.otp = hashedOtp;
        existingOtp.expiresAt = expiresAt;
        existingOtp.createdAt = new Date();
        await existingOtp.save();
      } else {
        await Otp.create({
          email,
          otp: hashedOtp,
          expiresAt
        });
      }

      // 7. Send the email using luxury attar brand template
      const displayName = name || "Valued Patron";
      await sendOtpEmail(email, displayName, otp);

      return ApiResponse.success(
        res, 
        null, 
        "A fresh verification passcode has been dispatched to your email.", 
        200
      );
    } catch (error) {
      console.error("[resendOtp Controller Error]:", error);
      next(error);
    }
  }

  /**
   * Standard login method preserved for user authentication
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.error(res, "Please provide email and password.", 400);
      }

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return ApiResponse.error(res, "Invalid credentials.", 401);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return ApiResponse.error(res, "Invalid credentials.", 401);
      }

      const token = generateToken(user._id, user.role);

      return ApiResponse.success(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }, "Logged in successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Standard logout method
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      return ApiResponse.success(res, null, "Logged out successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve current logged-in user profile
   * GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      return ApiResponse.success(res, {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }, "User profile loaded successfully.");
    } catch (error) {
      next(error);
    }
  }
  /**
   * Forgot Password — sends a password-reset OTP to the user's email
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email || email.trim() === "") {
        return ApiResponse.error(res, "Email address is required.", 400);
      }

      // 1. Confirm user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Return generic success to avoid email enumeration
        return ApiResponse.success(
          res,
          null,
          "If an account with that email exists, a reset code has been dispatched.",
          200
        );
      }

      // 2. Spam protection cooldown (60 seconds) — keyed with "reset:" prefix
      const resetEmail = `reset:${email}`;
      const existingOtp = await Otp.findOne({ email: resetEmail });
      if (existingOtp) {
        const timeDifference = Date.now() - new Date(existingOtp.createdAt).getTime();
        const cooldownLimit = 60 * 1000;
        if (timeDifference < cooldownLimit) {
          const remainingSeconds = Math.ceil((cooldownLimit - timeDifference) / 1000);
          return ApiResponse.error(
            res,
            `Please wait ${remainingSeconds} seconds before requesting a new code.`,
            429
          );
        }
      }

      // 3. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // 4. Store / update OTP document
      if (existingOtp) {
        existingOtp.otp = hashedOtp;
        existingOtp.expiresAt = expiresAt;
        existingOtp.createdAt = new Date();
        await existingOtp.save();
      } else {
        await Otp.create({ email: resetEmail, otp: hashedOtp, expiresAt });
      }

      // 5. Send reset OTP email
      await sendOtpEmail(email, user.name, otp);

      return ApiResponse.success(
        res,
        null,
        "A 6-digit password-reset code has been dispatched to your email.",
        200
      );
    } catch (error) {
      console.error("[forgotPassword Controller Error]:", error);
      next(error);
    }
  }

  /**
   * Reset Password — verifies reset OTP and updates user password
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return ApiResponse.error(res, "Email, OTP code, and new password are required.", 400);
      }
      if (newPassword.length < 6) {
        return ApiResponse.error(res, "Password must be at least 6 characters long.", 400);
      }

      // 1. Find OTP document
      const resetEmail = `reset:${email}`;
      const otpDoc = await Otp.findOne({ email: resetEmail });
      if (!otpDoc) {
        return ApiResponse.error(
          res,
          "Reset code has expired or is invalid. Please request a new one.",
          400
        );
      }

      // 2. Verify OTP
      const isMatch = await bcrypt.compare(otp, otpDoc.otp);
      if (!isMatch) {
        return ApiResponse.error(res, "The reset code you entered is incorrect.", 400);
      }

      // 3. Delete OTP to prevent replay
      await Otp.deleteOne({ _id: otpDoc._id });

      // 4. Update user password (pre-save hook will hash it)
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return ApiResponse.error(res, "Account not found.", 404);
      }
      user.password = newPassword;
      await user.save();

      return ApiResponse.success(res, null, "Your password has been reset successfully. You may now log in.", 200);
    } catch (error) {
      console.error("[resetPassword Controller Error]:", error);
      next(error);
    }
  }
}

export default AuthController;
