import mongoose  from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // Scaled INR value at capture
    size: { type: String, required: true }
  }],
  shippingInfo: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  couponApplied: {
    code: { type: String },
    discountAmount: { type: Number, default: 0 }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true }
  },
  paymentInfo: {
    id: { type: String }, // Stripe PaymentIntent ID
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    method: { type: String, default: "Stripe" }
  },
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  trackingNumber: { type: String, default: "" },
  carrier: { type: String, default: "" },
  deliveredAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model("Order", orderSchema);
