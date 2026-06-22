import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load Environment variables
dotenv.config();

/**
 * Configure and initialize Nodemailer Transporter
 */
const transporter = nodemailer.createTransport({
  service: "gmail", // Using Gmail as default SMTP service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;
