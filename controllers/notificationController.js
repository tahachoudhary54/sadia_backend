import Notification from "../models/Notification.js";
import { addClient, removeClient } from "../utils/sseClients.js";
import ApiResponse from "../utils/apiResponse.js";

/**
 * Controller for admin notification management and SSE streaming.
 */
class NotificationController {
  /**
   * SSE stream endpoint — keeps a persistent connection open and pushes
   * events to the admin browser in real time.
   * GET /api/admin/notifications/stream
   *
   * EventSource cannot send custom headers, so we accept the token via
   * the ?token= query-param and the protect middleware handles it.
   */
  static async stream(req, res) {
    // Write SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering if proxied
    res.flushHeaders();

    // Register this client
    addClient(res);

    // Send an initial "connected" event so the client knows the stream is live
    res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE stream established" })}\n\n`);

    // Keep-alive ping every 25 seconds to prevent proxy/firewall timeouts
    const keepAlive = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    // Clean up when the client disconnects
    req.on("close", () => {
      clearInterval(keepAlive);
      removeClient(res);
    });
  }

  /**
   * Fetch the 30 most recent notifications (newest first) for initial page load.
   * GET /api/admin/notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(30);
      return ApiResponse.success(res, notifications, "Notifications fetched successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a single notification as read.
   * PATCH /api/admin/notifications/:id/read
   */
  static async markRead(req, res, next) {
    try {
      const { id } = req.params;
      await Notification.findByIdAndUpdate(id, { read: true });
      return ApiResponse.success(res, null, "Notification marked as read.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark ALL notifications as read.
   * PATCH /api/admin/notifications/read-all
   */
  static async markAllRead(req, res, next) {
    try {
      await Notification.updateMany({ read: false }, { read: true });
      return ApiResponse.success(res, null, "All notifications marked as read.");
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
