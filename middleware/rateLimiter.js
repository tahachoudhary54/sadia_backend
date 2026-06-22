import rateLimit  from 'express-rate-limit';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * General rate limiter configuration for standard API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes interval
  max: 150, // Allow 150 requests per IP address
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      "Too many requests from this IP. Please try again after 15 minutes.",
      429
    );
  }
});

/**
 * Strict rate limiter configuration for high-security endpoints (login, registration)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Allow maximum of 15 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      "Too many login or registration attempts. Please wait 15 minutes and retry.",
      429
    );
  }
});

export default { apiLimiter, authLimiter };
