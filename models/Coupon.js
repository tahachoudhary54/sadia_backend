import mongoose  from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Coupon code is required"],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, "Discount value must be positive"]
  },
  expiryDate: {
    type: Date,
    required: true
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Instance method to determine if a coupon is valid
couponSchema.methods.isValid = function(subtotal) {
  const isExpired = new Date() > this.expiryDate;
  const isBelowMin = subtotal < this.minPurchaseAmount;
  return this.active && !isExpired && !isBelowMin;
};

export default mongoose.model("Coupon", couponSchema);
