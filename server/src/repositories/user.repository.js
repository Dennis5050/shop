import mongoose from 'mongoose';
import { User } from '../models/User.js';

export class UserRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a new user record
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const user = new User(data);
      const saved = await user.save();
      return saved.toObject();
    }

    // Memory fallback
    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const user = {
      _id: id,
      id,
      username: data.username.toLowerCase(),
      displayName: data.displayName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      avatar: data.avatar || '',
      bio: data.bio || 'Hey there! I am using Nexus.',
      status: data.status || 'offline',
      isOnline: data.isOnline || false,
      lastSeen: new Date(),
      isVerified: false,
      blockedUsers: [],
      settings: {
        notifications: true,
        soundEnabled: true,
        privacyLastSeen: 'everyone',
        privacyReadReceipts: true,
        ...(data.settings || {}),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, user);
    return { ...user };
  }

  /**
   * Finds a user by ID
   * @param {string} id 
   * @param {boolean} [includePassword=false]
   * @returns {Promise<Object|null>}
   */
  async findById(id, includePassword = false) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      let query = User.findById(id);
      if (includePassword) query = query.select('+passwordHash');
      const user = await query.exec();
      return user ? user.toObject() : null;
    }

    const user = this.memoryStore.get(String(id));
    if (!user) return null;
    const clone = { ...user };
    if (!includePassword) delete clone.passwordHash;
    return clone;
  }

  /**
   * Finds a user by email address
   * @param {string} email 
   * @param {boolean} [includePassword=false]
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email, includePassword = false) {
    if (!email) return null;
    const lowerEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let query = User.findOne({ email: lowerEmail });
      if (includePassword) query = query.select('+passwordHash');
      const user = await query.exec();
      return user ? user.toObject() : null;
    }

    for (const u of this.memoryStore.values()) {
      if (u.email === lowerEmail) {
        const clone = { ...u };
        if (!includePassword) delete clone.passwordHash;
        return clone;
      }
    }
    return null;
  }

  /**
   * Finds a user by username
   * @param {string} username 
   * @param {boolean} [includePassword=false]
   * @returns {Promise<Object|null>}
   */
  async findByUsername(username, includePassword = false) {
    if (!username) return null;
    const lowerUsername = username.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let query = User.findOne({ username: lowerUsername });
      if (includePassword) query = query.select('+passwordHash');
      const user = await query.exec();
      return user ? user.toObject() : null;
    }

    for (const u of this.memoryStore.values()) {
      if (u.username === lowerUsername) {
        const clone = { ...u };
        if (!includePassword) delete clone.passwordHash;
        return clone;
      }
    }
    return null;
  }

  /**
   * Updates user details
   * @param {string} id 
   * @param {Object} updateData 
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      const updated = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      return updated ? updated.toObject() : null;
    }

    const existing = await this.findById(id, true);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };

    this.memoryStore.set(String(id), merged);
    const clone = { ...merged };
    delete clone.passwordHash;
    return clone;
  }

  /**
   * Updates user online presence status and last seen timestamp
   * @param {string} id 
   * @param {boolean} isOnline 
   * @param {string} [status]
   * @param {Date} [lastSeen]
   * @returns {Promise<Object|null>}
   */
  async updatePresence(id, isOnline, status = null, lastSeen = new Date()) {
    const updatePayload = {
      isOnline,
      lastSeen,
    };
    if (status) updatePayload.status = status;
    return this.update(id, updatePayload);
  }

  /**
   * Searches users by query
   * @param {string} query 
   * @param {string} [excludeUserId]
   * @param {number} [limit=20]
   * @returns {Promise<Array<Object>>}
   */
  async search(query, excludeUserId = null, limit = 20) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    if (mongoose.connection.readyState === 1) {
      const filter = {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      };
      if (excludeUserId) filter._id = { $ne: excludeUserId };

      const users = await User.find(filter).limit(limit).select('-passwordHash').exec();
      return users.map((u) => u.toObject());
    }

    const results = [];
    for (const u of this.memoryStore.values()) {
      if (excludeUserId && String(u._id) === String(excludeUserId)) continue;
      if (
        u.username.includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.includes(q)
      ) {
        const clone = { ...u };
        delete clone.passwordHash;
        results.push(clone);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  /**
   * Clears in-memory store (for testing)
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const userRepository = new UserRepository();
export default userRepository;
