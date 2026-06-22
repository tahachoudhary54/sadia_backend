import mongoose from "mongoose";

/**
 * Schema for persisting admin notifications to MongoDB.
 * Allows the notification list to survive server/browser restarts.
 */
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["new_order", "low_stock", "new_user"],
      required: true,
    },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    read: { type: Boolean, default: false },
    // Extra metadata for linking back to the source document
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
