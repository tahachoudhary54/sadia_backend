/**
 * One-shot script to reset the admin password and any broken user passwords.
 * Run: node utils/resetAdminPassword.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[DB] Connected to MongoDB.");

    const newPassword = process.env.ADMIN_PASSWORD || "admin@123";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const result = await User.findOneAndUpdate(
      { role: "admin" },
      { $set: { password: hashed } },
      { new: true }
    );

    if (result) {
      console.log(`[✓] Admin password reset successfully.`);
      console.log(`    Email:    ${result.email}`);
      console.log(`    Password: ${newPassword}`);
    } else {
      console.log("[!] No admin user found in database.");
    }

    await mongoose.disconnect();
    console.log("[DB] Disconnected. Done.");
    process.exit(0);
  } catch (err) {
    console.error("[Error]", err.message);
    process.exit(1);
  }
}

resetAdminPassword();
