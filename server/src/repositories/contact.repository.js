import mongoose from 'mongoose';
import { Contact } from '../models/Contact.js';

export class ContactRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Adds or creates a contact record
   * @param {string} userId 
   * @param {string} contactUserId 
   * @param {string} [nickname='']
   * @param {string} [status='accepted']
   * @returns {Promise<Object>}
   */
  async addContact(userId, contactUserId, nickname = '', status = 'accepted') {
    const uId = String(userId);
    const cId = String(contactUserId);

    if (mongoose.connection.readyState === 1) {
      const contact = await Contact.findOneAndUpdate(
        { user: uId, contactUser: cId },
        { $set: { nickname, status } },
        { upsert: true, new: true }
      ).populate('contactUser', 'username displayName avatar status isOnline lastSeen bio').exec();
      return contact.toObject();
    }

    const key = `${uId}:${cId}`;
    const contact = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: uId,
      contactUser: cId,
      nickname,
      status,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(key, contact);
    return { ...contact };
  }

  /**
   * Finds contact record between user and contactUser
   * @param {string} userId 
   * @param {string} contactUserId 
   * @returns {Promise<Object|null>}
   */
  async findContact(userId, contactUserId) {
    const uId = String(userId);
    const cId = String(contactUserId);

    if (mongoose.connection.readyState === 1) {
      const contact = await Contact.findOne({ user: uId, contactUser: cId })
        .populate('contactUser', 'username displayName avatar status isOnline lastSeen bio')
        .exec();
      return contact ? contact.toObject() : null;
    }

    const key = `${uId}:${cId}`;
    const contact = this.memoryStore.get(key);
    return contact ? { ...contact } : null;
  }

  /**
   * Lists all contacts for a specific user
   * @param {string} userId 
   * @param {string} [status='accepted']
   * @returns {Promise<Array<Object>>}
   */
  async listContacts(userId, status = 'accepted') {
    const uId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const contacts = await Contact.find({ user: uId, status })
        .populate('contactUser', 'username displayName avatar status isOnline lastSeen bio')
        .sort({ isFavorite: -1, nickname: 1, createdAt: -1 })
        .exec();
      return contacts.map((c) => c.toObject());
    }

    const list = [];
    for (const c of this.memoryStore.values()) {
      if (c.user === uId && (!status || c.status === status)) {
        list.push({ ...c });
      }
    }
    return list;
  }

  /**
   * Removes a contact
   * @param {string} userId 
   * @param {string} contactUserId 
   * @returns {Promise<boolean>}
   */
  async removeContact(userId, contactUserId) {
    const uId = String(userId);
    const cId = String(contactUserId);

    if (mongoose.connection.readyState === 1) {
      const res = await Contact.deleteOne({ user: uId, contactUser: cId }).exec();
      return res.deletedCount > 0;
    }

    const key = `${uId}:${cId}`;
    return this.memoryStore.delete(key);
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const contactRepository = new ContactRepository();
export default contactRepository;
