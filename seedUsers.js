import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function seedUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://tahachoudhary54_db_user:sadia3323@cluster0.yihdh5y.mongodb.net/sadiafragnance?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Connected to MongoDB.");

    let user = await User.findOne({ email: "patron@gmail.com" });
    if (!user) {
      await User.create({
        name: "Patron",
        email: "patron@gmail.com",
        password: "password", // This will be hashed by pre-save middleware
        role: "user"
      });
      console.log("User patron@gmail.com created with password 'password'.");
    } else {
      user.password = "password"; // Re-hashing happens on save
      await user.save();
      console.log("User patron@gmail.com password reset to 'password'.");
    }

    let admin = await User.findOne({ email: "admin@gmail.com" });
    if (!admin) {
      await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: "password",
        role: "admin"
      });
      console.log("User admin@gmail.com created with password 'password'.");
    } else {
      admin.password = "password";
      await admin.save();
      console.log("User admin@gmail.com password reset to 'password'.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedUser();
