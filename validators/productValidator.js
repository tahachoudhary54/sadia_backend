/**
 * Clean custom input validator routines for Product catalog requests
 */
class ProductValidator {
  /**
   * Validate Product creation/update requests
   */
  static validateProduct(req, res, next) {
    const { name, description, price, category, stock, sizes } = req.body;
    const errors = [];

    if (!name || name.trim() === "") {
      errors.push("Product name is required.");
    }

    if (!description || description.trim() === "") {
      errors.push("Product description is required.");
    }

    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      errors.push("Please provide a valid non-negative product price.");
    }

    if (!category || category.trim() === "") {
      errors.push("Product must be assigned to a valid category ID.");
    }

    if (stock === undefined || stock === null || isNaN(stock) || Number(stock) < 0) {
      errors.push("Please specify a valid non-negative stock count.");
    }

    if (sizes && !Array.isArray(sizes)) {
      errors.push("Sizes must be structured as an array of options.");
    } else if (sizes && Array.isArray(sizes)) {
      sizes.forEach((s, idx) => {
        if (!s.size || s.size.trim() === "") {
          errors.push(`Size at index ${idx} must specify a labels name (e.g. '6ml').`);
        }
        if (s.priceMultiplier === undefined || isNaN(s.priceMultiplier) || Number(s.priceMultiplier) <= 0) {
          errors.push(`Size at index ${idx} must contain a positive priceMultiplier.`);
        }
      });
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

export default ProductValidator;
