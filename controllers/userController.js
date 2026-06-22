import User  from '../models/User.js';
import ApiResponse  from '../utils/apiResponse.js';

/**
 * Controller to handle profile updates and address management
 */
class UserController {
  /**
   * Update authenticated user's profile info
   * PUT /api/users/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      
      const user = await User.findById(req.user._id);

      if (name) user.name = name;
      if (email) {
        // Prevent duplicate emails
        const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (emailExists) {
          return ApiResponse.error(res, "This email address is already in use.", 400);
        }
        user.email = email;
      }

      await user.save();

      return ApiResponse.success(res, {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }, "Profile updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a shipping address to the address book
   * POST /api/users/addresses
   */
  static async addAddress(req, res, next) {
    try {
      const { street, city, state, zipCode, country, phoneNumber, isDefault } = req.body;

      if (!street || !city || !state || !zipCode || !country) {
        return ApiResponse.error(res, "Please provide all required address fields.", 400);
      }

      const user = await User.findById(req.user._id);

      // If user sets this as default address, reset other default states
      if (isDefault || user.addresses.length === 0) {
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
      }

      const newAddress = {
        street,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        isDefault: isDefault || user.addresses.length === 0
      };

      user.addresses.push(newAddress);
      await user.save();

      return ApiResponse.success(res, user.addresses, "Address added successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete address from the address book
   * DELETE /api/users/addresses/:id
   */
  static async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(req.user._id);

      const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === id);
      if (addressIndex === -1) {
        return ApiResponse.error(res, "Address not found in your address book.", 404);
      }

      const wasDefault = user.addresses[addressIndex].isDefault;
      user.addresses.splice(addressIndex, 1);

      // If deleted address was default, set next available address as default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      return ApiResponse.success(res, user.addresses, "Address deleted successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set address as default for quick checkout
   * PUT /api/users/addresses/:id/default
   */
  static async setAddressDefault(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(req.user._id);

      const addressExists = user.addresses.some((addr) => addr._id.toString() === id);
      if (!addressExists) {
        return ApiResponse.error(res, "Address not found.", 404);
      }

      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.toString() === id;
      });

      await user.save();

      return ApiResponse.success(res, user.addresses, "Default address updated successfully.");
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
