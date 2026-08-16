import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { MessageStatus } from '../constants/message-status.js';

export class MessageRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates and stores a new message
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const msg = new Message(data);
      const saved = await msg.save();
      const populated = await Message.findById(saved._id)
        .populate('sender', 'username displayName avatar')
        .populate('replyTo', 'content sender type mediaUrl')
        .exec();
      return populated.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const msg = {
      _id: id,
      id,
      conversation: String(data.conversation),
      sender: data.sender,
      recipient: data.recipient ? String(data.recipient) : null,
      content: data.content || '',
      type: data.type || 'text',
      mediaUrl: data.mediaUrl || '',
      mediaMeta: data.mediaMeta || null,
      status: data.status || MessageStatus.SENT,
      deliveredTo: [],
      readBy: [],
      replyTo: data.replyTo || null,
      reactions: [],
      isDeleted: false,
      deletedFor: [],
      isEdited: false,
      editedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, msg);
    return { ...msg };
  }

  /**
   * Finds a message by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      const msg = await Message.findById(id)
        .populate('sender', 'username displayName avatar')
        .populate('replyTo', 'content sender type mediaUrl')
        .exec();
      return msg ? msg.toObject() : null;
    }

    const msg = this.memoryStore.get(String(id));
    return msg ? { ...msg } : null;
  }

  /**
   * Lists chronological messages for a conversation with pagination
   * @param {string} conversationId 
   * @param {number} [limit=50]
   * @param {Date} [beforeDate]
   * @returns {Promise<Array<Object>>}
   */
  async listByConversation(conversationId, limit = 50, beforeDate = null) {
    const cId = String(conversationId);

    if (mongoose.connection.readyState === 1) {
      const filter = { conversation: cId, isDeleted: false };
      if (beforeDate) {
        filter.createdAt = { $lt: new Date(beforeDate) };
      }

      const msgs = await Message.find(filter)
        .populate('sender', 'username displayName avatar')
        .populate('replyTo', 'content sender type mediaUrl')
        .sort({ createdAt: 1 })
        .limit(limit)
        .exec();
      return msgs.map((m) => m.toObject());
    }

    let list = [];
    for (const msg of this.memoryStore.values()) {
      if (msg.conversation === cId && !msg.isDeleted) {
        if (!beforeDate || new Date(msg.createdAt) < new Date(beforeDate)) {
          list.push({ ...msg });
        }
      }
    }

    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return list.slice(-limit);
  }

  /**
   * Marks a message delivered to a specific recipient
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markDelivered(messageId, userId) {
    const uId = String(userId);
    const existing = await this.findById(messageId);
    if (!existing) return null;

    const alreadyDelivered = (existing.deliveredTo || []).some((r) => String(r.user) === uId);
    if (!alreadyDelivered) {
      const receipt = { user: uId, at: new Date() };

      if (mongoose.connection.readyState === 1) {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          {
            $push: { deliveredTo: receipt },
            $set: { status: existing.status === MessageStatus.READ ? MessageStatus.READ : MessageStatus.DELIVERED },
          },
          { new: true }
        ).exec();
        return updated ? updated.toObject() : null;
      }

      existing.deliveredTo = [...(existing.deliveredTo || []), receipt];
      if (existing.status !== MessageStatus.READ) {
        existing.status = MessageStatus.DELIVERED;
      }
      this.memoryStore.set(String(messageId), existing);
    }

    return existing;
  }

  /**
   * Marks a message read by a specific recipient
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markRead(messageId, userId) {
    const uId = String(userId);
    const existing = await this.findById(messageId);
    if (!existing) return null;

    const alreadyRead = (existing.readBy || []).some((r) => String(r.user) === uId);
    if (!alreadyRead) {
      const receipt = { user: uId, at: new Date() };

      if (mongoose.connection.readyState === 1) {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          {
            $push: { readBy: receipt },
            $set: { status: MessageStatus.READ },
          },
          { new: true }
        ).exec();
        return updated ? updated.toObject() : null;
      }

      existing.readBy = [...(existing.readBy || []), receipt];
      existing.status = MessageStatus.READ;
      this.memoryStore.set(String(messageId), existing);
    }

    return existing;
  }

  /**
   * Adds or updates an emoji reaction to a message
   * @param {string} messageId 
   * @param {string} userId 
   * @param {string} emoji 
   * @returns {Promise<Object|null>}
   */
  async addReaction(messageId, userId, emoji) {
    const uId = String(userId);
    const existing = await this.findById(messageId);
    if (!existing) return null;

    const filtered = (existing.reactions || []).filter((r) => String(r.user) !== uId);
    const newReaction = { user: uId, emoji, createdAt: new Date() };
    const updatedReactions = [...filtered, newReaction];

    if (mongoose.connection.readyState === 1) {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { $set: { reactions: updatedReactions } },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    existing.reactions = updatedReactions;
    this.memoryStore.set(String(messageId), existing);
    return { ...existing };
  }

  /**
   * Removes an emoji reaction from a message
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async removeReaction(messageId, userId) {
    const uId = String(userId);
    const existing = await this.findById(messageId);
    if (!existing) return null;

    const updatedReactions = (existing.reactions || []).filter((r) => String(r.user) !== uId);

    if (mongoose.connection.readyState === 1) {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { $set: { reactions: updatedReactions } },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    existing.reactions = updatedReactions;
    this.memoryStore.set(String(messageId), existing);
    return { ...existing };
  }

  /**
   * Soft deletes a message for everyone
   * @param {string} messageId 
   * @returns {Promise<Object|null>}
   */
  async deleteForEveryone(messageId) {
    const existing = await this.findById(messageId);
    if (!existing) return null;

    if (mongoose.connection.readyState === 1) {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { $set: { isDeleted: true, content: 'This message was deleted' } },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    existing.isDeleted = true;
    existing.content = 'This message was deleted';
    this.memoryStore.set(String(messageId), existing);
    return { ...existing };
  }

  /**
   * Edits message content
   * @param {string} messageId 
   * @param {string} newContent 
   * @returns {Promise<Object|null>}
   */
  async editMessage(messageId, newContent) {
    const existing = await this.findById(messageId);
    if (!existing) return null;

    if (mongoose.connection.readyState === 1) {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { $set: { content: newContent, isEdited: true, editedAt: new Date() } },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    existing.content = newContent;
    existing.isEdited = true;
    existing.editedAt = new Date();
    this.memoryStore.set(String(messageId), existing);
    return { ...existing };
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
