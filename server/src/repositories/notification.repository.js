import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

export class NotificationRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a notification
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const notif = new Notification(data);
      const saved = await notif.save();
      const populated = await Notification.findById(saved._id)
        .populate('sender', 'username displayName avatar')
        .exec();
      return populated.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const notif = {
      _id: id,
      id,
      recipient: String(data.recipient),
      sender: data.sender || null,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, notif);
    return { ...notif };
  }

  /**
   * Lists notifications for a user
   * @param {string} userId 
   * @param {number} [limit=30]
   * @returns {Promise<Array<Object>>}
   */
  async listByUser(userId, limit = 30) {
    const uId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const notifs = await Notification.find({ recipient: uId })
        .populate('sender', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
      return notifs.map((n) => n.toObject());
    }

    const list = [];
    for (const n of this.memoryStore.values()) {
      if (n.recipient === uId) {
        list.push({ ...n });
      }
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(0, limit);
  }

  /**
   * Marks a notification as read
   * @param {string} notificationId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markAsRead(notificationId, userId) {
    const uId = String(userId);
    const existing = this.memoryStore.get(String(notificationId));

    if (mongoose.connection.readyState === 1) {
      const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: uId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    if (existing && existing.recipient === uId) {
      existing.isRead = true;
      existing.readAt = new Date();
      this.memoryStore.set(String(notificationId), existing);
      return { ...existing };
    }
    return null;
  }

  /**
   * Marks all notifications as read for a user
   * @param {string} userId 
   * @returns {Promise<number>}
   */
  async markAllAsRead(userId) {
    const uId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const res = await Notification.updateMany(
        { recipient: uId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      ).exec();
      return res.modifiedCount;
    }

    let count = 0;
    for (const n of this.memoryStore.values()) {
      if (n.recipient === uId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        count++;
      }
    }
    return count;
  }

  /**
   * Gets unread notification count
   * @param {string} userId 
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    const uId = String(userId);

    if (mongoose.connection.readyState === 1) {
      return Notification.countDocuments({ recipient: uId, isRead: false }).exec();
    }

    let count = 0;
    for (const n of this.memoryStore.values()) {
      if (n.recipient === uId && !n.isRead) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
