import { Notification } from '../models/Notification.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';
import { logger } from '../config/logger.js';

export class InAppNotificationService {
  /**
   * Persists an in-app notification and dispatches real-time socket event
   */
  static async createNotification({ userId, familyGroupId = null, title, message, type = 'SYSTEM', link = null }) {
    try {
      const notification = await Notification.create({
        userId,
        familyGroupId,
        title,
        message,
        type,
        link,
        read: false
      });

      // Real-time dispatch to the user's private socket room
      SocketEmitter.emitToUser(userId, 'notification:new', notification);
      logger.debug(`[NOTIFICATION] Created in-app notification ${notification._id} for user ${userId}`);
      return notification;
    } catch (err) {
      logger.error(`[NOTIFICATION] Error creating in-app notification: ${err.message}`, err);
      // Non-blocking for callers
      return null;
    }
  }

  /**
   * Fetch paginated notifications for user
   */
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const filter = { userId };
    if (unreadOnly) filter.read = false;

    const skip = (Math.max(1, page) - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, read: false })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all unread notifications as read for user
   */
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return { modifiedCount: result.modifiedCount };
  }
}
