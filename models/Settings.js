import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  heroHeading: {
    type: String,
    default: "Wear the Essence of Luxury"
  },
  heroSubheadline: {
    type: String,
    default: "Handcrafted Arabian fragrances designed for timeless elegance and unforgettable presence."
  },
  bannerHeading: {
    type: String,
    default: "The Royal Ramadan Collection"
  },
  bannerDescription: {
    type: String,
    default: "An exclusive seasonal extraction distilled under the lunar zenith. Enriched with Cambodian Oud, Taif Rose, and rare Ambergris."
  },
  heroImage: {
    type: String,
    default: ""
  },
  bannerImage: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

export default mongoose.model("Settings", settingsSchema);
