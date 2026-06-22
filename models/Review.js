import mongoose  from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  rating: {
    type: Number,
    required: [true, "Please rate this product between 1 and 5"],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, "Please provide a written review"],
    trim: true
  },
  images: [{
    url: String,
    publicId: String
  }]
}, {
  timestamps: true
});

// Ensure a single user can only submit one review per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average rating of a product on review save or delete
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewsCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].averageRating * 10) / 10,
      reviewsCount: stats[0].reviewsCount
    });
  } else {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratings: 0,
      reviewsCount: 0
    });
  }
};

// Post-save middleware
reviewSchema.post("save", function() {
  this.constructor.calculateAverageRating(this.product);
});

// Post-remove/delete middleware
reviewSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  }
});

export default mongoose.model("Review", reviewSchema);
