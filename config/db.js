import mongoose from "mongoose";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sadiafragnance", {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (attempt < MAX_RETRIES) {
      const delay = Math.min(RETRY_DELAY_MS * attempt, 30000); // cap at 30s
      console.log(`[Database] Retrying in ${delay / 1000}s...`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error("[Database] Max retries reached. Check your MONGODB_URI and network/Atlas IP whitelist.");
      process.exit(1);
    }
  }
};

// Monitor connection events for database reliability
mongoose.connection.on("disconnected", () => {
  console.warn("[Database Warn] MongoDB disconnected. Attempting reconnection...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error(`[Database Error] Connection error: ${err.message}`);
});

export default connectDB;
