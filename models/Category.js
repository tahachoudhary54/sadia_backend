import mongoose  from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a category name"],
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
    required: [true, "Please provide a description for the category"]
  },
  image: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

export default mongoose.model("Category", categorySchema);
