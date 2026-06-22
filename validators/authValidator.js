/**
 * Clean custom input validator routines for authentication requests
 */
class AuthValidator {
  /**
   * Validate User Registration payloads
   */
  static validateRegister(req, res, next) {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || name.trim() === "") {
      errors.push("Name field is required.");
    }
    
    if (!email || email.trim() === "") {
      errors.push("Email field is required.");
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push("Please provide a valid email format.");
      }
    }

    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation Failed",
        errors
      });
    }

    next();
  }

  /**
   * Validate User Login payloads
   */
  static validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim() === "") {
      errors.push("Email field is required.");
    }

    if (!password) {
      errors.push("Password field is required.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation Failed",
        errors
      });
    }

    next();
  }

  /**
   * Validate OTP Verification payloads
   */
  static validateVerifyOTP(req, res, next) {
    const { name, email, password, otp } = req.body;
    const errors = [];

    if (!name || name.trim() === "") {
      errors.push("Name field is required.");
    }

    if (!email || email.trim() === "") {
      errors.push("Email field is required.");
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push("Please provide a valid email format.");
      }
    }

    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    }

    if (!otp || otp.trim() === "") {
      errors.push("OTP code is required.");
    } else if (otp.trim().length !== 6 || isNaN(otp.trim())) {
      errors.push("OTP must be a 6-digit numeric code.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation Failed",
        errors
      });
    }

    next();
  }

  /**
   * Validate OTP Resend payloads
   */
  static validateResendOTP(req, res, next) {
    const { email } = req.body;
    const errors = [];

    if (!email || email.trim() === "") {
      errors.push("Email field is required.");
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push("Please provide a valid email format.");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation Failed",
        errors
      });
    }

    next();
  }
}

export default AuthValidator;
