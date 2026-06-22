import mongoose  from 'mongoose';
import dotenv  from 'dotenv';
import Category  from '../models/Category.js';
import Product  from '../models/Product.js';
import Coupon  from '../models/Coupon.js';

// Load Env variables
dotenv.config();

const categoriesData = [
  {
    _id: "65f8c6b12d3e4a5b6c7d8e91",
    name: "Cambodian Oud",
    slug: "cambodian-oud",
    description: "Deep, woody, rich, and highly aged animalic resin extracted from wild aquilaria trees in Cambodia."
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e92",
    name: "Taif Rose",
    slug: "taif-rose",
    description: "Light, fresh, powdery floral attar composed of Taif roses harvested before dawn in Saudi Arabia."
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e93",
    name: "Royal Musk",
    slug: "royal-musk",
    description: "Smooth, clean, powdery white musk and warm golden amber blend for long-lasting sillage."
  }
];

const productsData = [
  {
    _id: "65f8c6b12d3e4a5b6c7d8e01",
    name: "Oud Royale",
    description: "An intense, opulent agarwood formulation enriched with rare ambergris and smoking incense. Hand-distilled using vintage Cambodian Oud, Oud Royale is a powerful scent made for royalty.",
    price: 22800,
    category: "65f8c6b12d3e4a5b6c7d8e91",
    fragranceNotes: {
      top: ["Saffron", "Nutmeg", "Lavender"],
      heart: ["Cambodian Oud", "Leather", "Incense"],
      base: ["Patchouli", "Ambergris", "Sandalwood"]
    },
    ingredients: ["100% Pure Organic Agarwood extract", "Cold-pressed Sandalwood oil", "Ambergris resin flakes"],
    images: [{
      url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-oud-unsplash"
    }],
    stock: 24,
    featured: true,
    bestseller: false,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e02",
    name: "Rose Noire",
    description: "A breathtaking harmony of hand-picked Damask Rose and rare Iranian Saffron, resting on a bed of warm white musk. Velvety, sweet, and deeply sensual, it captures the romantic essence of Eastern gardens.",
    price: 27200,
    category: "65f8c6b12d3e4a5b6c7d8e92",
    fragranceNotes: {
      top: ["Damask Rose", "Taif Rose", "Saffron"],
      heart: ["Geranium", "Warm Spices", "Cashmere Wood"],
      base: ["White Musk", "Amber", "Sweet Vanilla"]
    },
    ingredients: ["Taif Rose absolute", "Mysore Sandalwood oil", "Saffron essence extracts"],
    images: [{
      url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-rose-unsplash"
    }],
    stock: 35,
    featured: true,
    bestseller: false,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e03",
    name: "Saffron Silk",
    description: "A clean, powdery, incredibly smooth white musk fragrance that mimics the texture of pure silk. Infused with soft white florals, golden saffron strands, and creamy sandalwood, this is absolute sophistication.",
    price: 9600,
    category: "65f8c6b12d3e4a5b6c7d8e93",
    fragranceNotes: {
      top: ["White Musk", "Red Saffron", "Aldehydes"],
      heart: ["Damask Rose", "Iris", "Creamy Vanilla"],
      base: ["Sandalwood", "Ambergris", "Soft Powdery Accord"]
    },
    ingredients: ["Organic Sandalwood", "Iris absolute extract", "Premium Scent oil"],
    images: [{
      url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-musk-unsplash"
    }],
    stock: 40,
    featured: false,
    bestseller: false,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e04",
    name: "Ambre Soleil",
    description: "A majestic, warm-spicy amber attar. Sweet labdanum, smoky benzoin, and rich Madagascar vanilla bean extract are balanced with a touch of patchouli. Warm, resinous, and deeply satisfying.",
    price: 20800,
    category: "65f8c6b12d3e4a5b6c7d8e93",
    fragranceNotes: {
      top: ["Labdanum", "Bergamot", "Coriander"],
      heart: ["Benzoin", "Amber Resin", "Madagascar Vanilla"],
      base: ["Patchouli", "Sandalwood", "Cedarwood"]
    },
    ingredients: ["Fossilized Amber extract", "Labdanum absolute", "Madagascar Vanilla oil"],
    images: [{
      url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-ambre-unsplash"
    }],
    stock: 30,
    featured: true,
    bestseller: false,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e05",
    name: "Saffron Bleu",
    description: "A dark, highly structured leather and saffron masterpiece. Saffron Bleu starts with an energetic burst of red saffron and black pepper before drying down into smooth black leather and rich agarwood oil.",
    price: 33600,
    category: "65f8c6b12d3e4a5b6c7d8e93",
    fragranceNotes: {
      top: ["Red Saffron", "Black Pepper", "Grapefruit"],
      heart: ["Black Leather", "Rose", "Violet"],
      base: ["Agarwood Oil", "Vetiver", "Raspberry Accent"]
    },
    ingredients: ["Pure Agarwood oil", "Red Saffron absolute", "Black Pepper lipids"],
    images: [{
      url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-saffronbleu-unsplash"
    }],
    stock: 20,
    featured: true,
    bestseller: false,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e06",
    name: "Oud Mystique",
    description: "A rich, velvety, and creamy sandalwood attar. Sourced from native Mysore wood, this blend incorporates subtle hints of cardamom and a warm milk accord to create a comforting yet premium woody aura.",
    price: 23600,
    category: "65f8c6b12d3e4a5b6c7d8e93",
    fragranceNotes: {
      top: ["Cardamom", "Cypress"],
      heart: ["Mysore Sandalwood", "Creamy Milk Accord"],
      base: ["Amber", "White Musk", "Leather"]
    },
    ingredients: ["Mysore Sandalwood oil", "Cardamom extract", "Amber resin absolute"],
    images: [{
      url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-oudmystique-unsplash"
    }],
    stock: 45,
    featured: false,
    bestseller: true,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e07",
    name: "Velvet Noir",
    description: "An exotic floral attar honoring the midnight-blooming jasmine flower. Balanced by creamy ylang-ylang, soft vanilla, and white amber, Velvet Noir is sweet, indolic, and highly mesmerizing.",
    price: 25600,
    category: "65f8c6b12d3e4a5b6c7d8e92",
    fragranceNotes: {
      top: ["Midnight Jasmine", "Bergamot", "Neroli"],
      heart: ["Ylang-Ylang", "Orange Blossom", "White Honey"],
      base: ["White Amber", "Vanilla Musk", "Sandalwood"]
    },
    ingredients: ["Midnight Jasmine extract", "Ylang-ylang concrete", "White Honey lipids"],
    images: [{
      url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-velvet-unsplash"
    }],
    stock: 30,
    featured: false,
    bestseller: true,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  },
  {
    _id: "65f8c6b12d3e4a5b6c7d8e08",
    name: "Desert Gold",
    description: "Our crown jewel. An ultra-rare, wild-harvested Indian Oud formulation. Heavily animalic and smoky in its top notes, it settles into an incredibly smooth, earthy, sweet woody scent that lasts for days.",
    price: 30400,
    category: "65f8c6b12d3e4a5b6c7d8e91",
    fragranceNotes: {
      top: ["Wild Assam Oud", "Cypriol", "Clove"],
      heart: ["Dark Leather", "Castoreum Accord", "Birch Tar"],
      base: ["Ambergris", "Vetiver", "Oakmoss"]
    },
    ingredients: ["Assam Agarwood extract", "Earthy oakmoss", "Ambergris resins"],
    images: [{
      url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
      publicId: "mock-desert-unsplash"
    }],
    stock: 15,
    featured: false,
    bestseller: true,
    sizes: [
      { size: "3ml", priceMultiplier: 0.6 },
      { size: "6ml", priceMultiplier: 1.0 },
      { size: "12ml", priceMultiplier: 1.8 }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log("[Seeder] Connecting to MongoDB...");
    const connStr = process.env.MONGODB_URI || "mongodb://localhost:27017/sadiafragnance";
    await mongoose.connect(connStr);
    console.log("[Seeder] Connected successfully. Cleaning existing collections...");

    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    
    console.log("[Seeder] Cleaning completed. Provisioning 3 categories...");

    // 1. Seed Categories
    await Category.insertMany(categoriesData);
    console.log("[Seeder] Seeded 3 categories successfully.");

    // 2. Seeding products directly using custom static ObjectIds
    const resolvedProducts = productsData.map((p) => ({
      ...p,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    }));

    await Product.insertMany(resolvedProducts);
    console.log("[Seeder] Seeded all 8 premium products successfully.");

    // 3. Seed default coupons
    await Coupon.create({
      code: "ROYAL25",
      discountType: "percentage",
      discountValue: 25,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minPurchaseAmount: 10000,
      active: true
    });
    console.log("[Seeder] Seeded 'ROYAL25' coupon successfully.");

    console.log("[Seeder] Seeding process completed successfully! Exiting seeder...");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder Error] Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
