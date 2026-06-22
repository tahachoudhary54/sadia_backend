import mongoose  from 'mongoose';

const sizeOptionSchema = new mongoose.Schema({
  size: { type: String, required: true }, // e.g. "6ml", "12ml", "50ml"
  priceMultiplier: { type: Number, default: 1 } // basePrice * multiplier
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide product name"],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, "Please provide description"]
  },
  price: {
    type: Number,
    required: [true, "Please provide base price"],
    min: [0, "Price cannot be negative"]
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Product must belong to a category"]
  },
  fragranceNotes: {
    top: [{ type: String }],
    heart: [{ type: String }],
    base: [{ type: String }]
  },
  ingredients: [{ type: String }],
  images: [{
    url: { type: String, required: true },
    publicId: { type: String } // Storing Cloudinary public ID for secure administration/removal
  }],
  stock: {
    type: Number,
    required: [true, "Please specify stock quantity"],
    default: 0,
    min: [0, "Stock cannot be negative"]
  },
  featured: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  sizes: [sizeOptionSchema]
}, {
  timestamps: true
});

export default mongoose.model("Product", productSchema);
