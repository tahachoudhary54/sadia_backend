import jwt  from 'jsonwebtoken';
import User  from '../models/User.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Protect routes by verifying JWT signature in authorization header
 */
const protect = async (req, res, next) => {
  let token;

  // Read bearer token from authorization headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Fallback: accept token via query param for SSE streams (EventSource cannot set headers)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return ApiResponse.error(res, "Access denied. Authentication token is missing.", 401);
  }

  try {
    // Decode and verify token content
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "sadia_fragrance_secret_jwt_sign_key_attar_luxury_2025"
    );

    // Fetch user profile from database, excluding hashed credentials
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return ApiResponse.error(res, "Account not found or deleted.", 404);
    }

    // Attach authenticated user payload to request context
    req.user = user;
    next();
  } catch (error) {
    console.error("[Auth Error] Token verification failed:", error.message);
    return ApiResponse.error(res, "Invalid or expired token. Access denied.", 401);
  }
};

/**
 * Restricts access exclusively to accounts possessing Admin role credentials
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return ApiResponse.error(res, "Access denied. Administrative privileges are required.", 403);
  }
};

export { protect, admin };
