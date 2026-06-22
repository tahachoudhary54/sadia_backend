import jwt from "jsonwebtoken";

/**
 * Generates a securely signed JSON Web Token (JWT)
 * @param {string} userId - User identifier
 * @param {string} role - User role (user/admin)
 * @returns {string} - Signed JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "sadia_fragrance_secret_jwt_sign_key_attar_luxury_2025",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d"
    }
  );
};

export default generateToken;
