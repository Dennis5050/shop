import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';

export class ConversationRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a new conversation
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const conv = new Conversation(data);
      const saved = await conv.save();
      return saved.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const conv = {
      _id: id,
      id,
      type: data.type || 'private',
      participants: (data.participants || []).map(String),
      group: data.group ? String(data.group) : null,
      lastMessage: data.lastMessage || null,
      unreadCounts: data.unreadCounts instanceof Map ? data.unreadCounts : new Map(Object.entries(data.unreadCounts || {})),
      pinnedBy: (data.pinnedBy || []).map(String),
      archivedBy: (data.archivedBy || []).map(String),
      mutedBy: (data.mutedBy || []).map(String),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, conv);
    return { ...conv };
  }

  /**
   * Finds a conversation by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      const conv = await Conversation.findById(id)
        .populate('participants', 'username displayName avatar status isOnline lastSeen')
        .populate('group')
        .exec();
      return conv ? conv.toObject() : null;
    }

    const conv = this.memoryStore.get(String(id));
    return conv ? { ...conv } : null;
  }

  /**
   * Finds an existing 1-on-1 private conversation between two users
   * @param {string} userAId 
   * @param {string} userBId 
   * @returns {Promise<Object|null>}
   */
  async findPrivateConversation(userAId, userBId) {
    const a = String(userAId);
    const b = String(userBId);

    if (mongoose.connection.readyState === 1) {
      const conv = await Conversation.findOne({
        type: 'private',
        participants: { $all: [a, b], $size: 2 },
      })
        .populate('participants', 'username displayName avatar status isOnline lastSeen')
        .exec();
      return conv ? conv.toObject() : null;
    }

    for (const conv of this.memoryStore.values()) {
      if (conv.type === 'private' && conv.participants.length === 2) {
        if (conv.participants.includes(a) && conv.participants.includes(b)) {
          return { ...conv };
        }
      }
    }
    return null;
  }

  /**
   * Lists all conversations for a specific user ordered by last update
   * @param {string} userId 
   * @returns {Promise<Array<Object>>}
   */
  async listForUser(userId) {
    const uid = String(userId);

    if (mongoose.connection.readyState === 1) {
      const convs = await Conversation.find({ participants: uid })
        .populate('participants', 'username displayName avatar status isOnline lastSeen')
        .populate('group')
        .sort({ updatedAt: -1 })
        .exec();
      return convs.map((c) => c.toObject());
    }

    const list = [];
    for (const conv of this.memoryStore.values()) {
      if (conv.participants.includes(uid)) {
        list.push({ ...conv });
      }
    }

    list.sort((x, y) => new Date(y.updatedAt) - new Date(x.updatedAt));
    return list;
  }

  /**
   * Updates last message preview and bumps updatedAt
   * @param {string} conversationId 
   * @param {Object} lastMessage 
   * @returns {Promise<Object|null>}
   */
  async updateLastMessage(conversationId, lastMessage) {
    if (!conversationId) return null;

    if (mongoose.connection.readyState === 1) {
      const conv = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          $set: {
            lastMessage,
            updatedAt: new Date(),
          },
        },
        { new: true }
      ).exec();
      return conv ? conv.toObject() : null;
    }

    const existing = await this.findById(conversationId);
    if (!existing) return null;

    existing.lastMessage = lastMessage;
    existing.updatedAt = new Date();
    this.memoryStore.set(String(conversationId), existing);
    return { ...existing };
  }

  /**
   * Increments unread message counter for a recipient
   * @param {string} conversationId 
   * @param {string} recipientId 
   * @returns {Promise<void>}
   */
  async incrementUnread(conversationId, recipientId) {
    const rId = String(recipientId);
    const existing = await this.findById(conversationId);
    if (!existing) return;

    if (!existing.unreadCounts) {
      existing.unreadCounts = new Map();
    }

    const current = existing.unreadCounts instanceof Map ? (existing.unreadCounts.get(rId) || 0) : (existing.unreadCounts[rId] || 0);
    const updatedVal = current + 1;

    if (existing.unreadCounts instanceof Map) {
      existing.unreadCounts.set(rId, updatedVal);
    } else {
      existing.unreadCounts[rId] = updatedVal;
    }

    if (mongoose.connection.readyState === 1) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCounts.${rId}`]: updatedVal },
      }).exec();
    } else {
      this.memoryStore.set(String(conversationId), existing);
    }
  }

  /**
   * Resets unread counter for a user
   * @param {string} conversationId 
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async resetUnread(conversationId, userId) {
    const uId = String(userId);
    const existing = await this.findById(conversationId);
    if (!existing) return;

    if (existing.unreadCounts instanceof Map) {
      existing.unreadCounts.set(uId, 0);
    } else if (existing.unreadCounts) {
      existing.unreadCounts[uId] = 0;
    }

    if (mongoose.connection.readyState === 1) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCounts.${uId}`]: 0 },
      }).exec();
    } else {
      this.memoryStore.set(String(conversationId), existing);
    }
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const conversationRepository = new ConversationRepository();
export default conversationRepository;
