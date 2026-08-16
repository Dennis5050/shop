import { notificationRepository } from '../repositories/notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class NotificationService {
  constructor(notifRepo = notificationRepository, userRepo = userRepository) {
    this.notifRepo = notifRepo;
    this.userRepo = userRepo;
  }

  /**
   * Creates a notification for a user
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async createNotification(params) {
    const { recipientId, senderId = null, type, title, message, data = {} } = params;

    // Do not notify self
    if (senderId && String(recipientId) === String(senderId)) {
      return null;
    }

    let sender = null;
    if (senderId) {
      sender = await this.userRepo.findById(senderId);
    }

    const notification = await this.notifRepo.create({
      recipient: recipientId,
      sender: sender ? { _id: sender._id, username: sender.username, displayName: sender.displayName, avatar: sender.avatar } : null,
      type,
      title,
      message,
      data,
    });

    return notification;
  }

  /**
   * Retrieves notifications for a user
   * @param {string} userId 
   * @param {number} [limit=30]
   * @returns {Promise<Object>}
   */
  async getUserNotifications(userId, limit = 30) {
    const notifications = await this.notifRepo.listByUser(userId, limit);
    const unreadCount = await this.notifRepo.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Marks a notification as read
   * @param {string} notificationId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markRead(notificationId, userId) {
    return this.notifRepo.markAsRead(notificationId, userId);
  }

  /**
   * Marks all notifications as read for a user
   * @param {string} userId 
   * @returns {Promise<number>}
   */
  async markAllRead(userId) {
    return this.notifRepo.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
