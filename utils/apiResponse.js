/**
 * Standardized API Response helper utility.
 * Enforces unified schema format for all Express controllers.
 */
class ApiResponse {
  /**
   * Send a successful JSON response
   */
  static success(res, data = null, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send a structured error JSON response
   */
  static error(res, message = "An error occurred", statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }
}

export default ApiResponse;
