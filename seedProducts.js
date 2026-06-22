import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const initialProducts = [
  {
    _id: "65f8c6b12d3e4a5b6c7d8e01",
    slug: "oud-royale",
    name: "Oud Royale",
    price: 22800,
    ratings: 4.9,
    reviewsCount: 124,
    images: [{ url: "/images/royal_oud.png", public_id: "royal_oud" }],
    description: "An intense, opulent agarwood formulation enriched with rare ambergris and smoking incense. Hand-distilled using vintage Cambodian Oud, Oud Royale is a powerful scent made for royalty.",
    tagline: "The timeless heritage of regal agarwood.",
    longevity: "Eternal (12hr+)",
    sillage: "Intense & Enveloping",
    fragranceNotes: {
      top: ["Saffron", "Nutmeg", "Lavender"],
      heart: ["Cambodian Oud", "Leather", "Incense"],
      base: ["Patchouli", "Ambergris", "Sandalwood"]
    },
    featured: true,
    bestseller: false,
    stock: 50
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e08",
    slug: "desert-gold",
    name: "Desert Gold",
    price: 30400,
    ratings: 5.0,
    reviewsCount: 89,
    images: [{ url: "/images/royal_oud.png", public_id: "desert_gold" }],
    description: "Our crown jewel. An ultra-rare, wild-harvested Indian Oud formulation. Heavily animalic and smoky in its top notes, it settles into an incredibly smooth, earthy, sweet woody scent that lasts for days.",
    tagline: "The ultimate expression of pure vintage agarwood.",
    longevity: "Eternal (24hr+)",
    sillage: "Enormous & Mystifying",
    fragranceNotes: {
      top: ["Wild Assam Oud", "Cypriol", "Clove"],
      heart: ["Dark Leather", "Castoreum Accord", "Birch Tar"],
      base: ["Ambergris", "Vetiver", "Oakmoss"]
    },
    featured: false,
    bestseller: true,
    stock: 50
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://tahachoudhary54_db_user:sadia3323@cluster0.yihdh5y.mongodb.net/sadiafragnance?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Connected to MongoDB.");

    let cat = await Category.findOne({ name: "Attar Premium" });
    if (!cat) {
      cat = await Category.create({ name: "Attar Premium", description: "Premium oils" });
    }

    for (let p of initialProducts) {
      p.category = cat._id;
      await Product.findByIdAndUpdate(p._id, p, { upsert: true, new: true });
    }

    console.log("Seeded database with initial products.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
