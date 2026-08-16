import { contactRepository } from '../repositories/contact.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class ContactService {
  constructor(contactRepo = contactRepository, userRepo = userRepository) {
    this.contactRepo = contactRepo;
    this.userRepo = userRepo;
  }

  /**
   * Adds a user to contacts list
   * @param {string} userId Current user
   * @param {string} targetIdentifier Target username, email, or user ID
   * @param {string} [nickname='']
   * @returns {Promise<Object>}
   */
  async addContact(userId, targetIdentifier, nickname = '') {
    if (!targetIdentifier) {
      const err = new Error('Contact identifier (username, email, or ID) is required');
      err.status = 400;
      throw err;
    }

    let targetUser = await this.userRepo.findById(targetIdentifier);
    if (!targetUser) {
      targetUser = await this.userRepo.findByUsername(targetIdentifier);
    }
    if (!targetUser) {
      targetUser = await this.userRepo.findByEmail(targetIdentifier);
    }

    if (!targetUser) {
      const err = new Error(`User "${targetIdentifier}" not found`);
      err.status = 404;
      throw err;
    }

    if (String(targetUser._id) === String(userId)) {
      const err = new Error('Cannot add yourself as a contact');
      err.status = 400;
      throw err;
    }

    const contact = await this.contactRepo.addContact(
      userId,
      targetUser._id,
      nickname || targetUser.displayName || targetUser.username,
      'accepted'
    );

    return {
      ...contact,
      contactUser: {
        _id: targetUser._id,
        id: targetUser._id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatar: targetUser.avatar,
        status: targetUser.status,
        isOnline: targetUser.isOnline,
        lastSeen: targetUser.lastSeen,
        bio: targetUser.bio,
      },
    };
  }

  /**
   * Retrieves all contacts for the user
   * @param {string} userId 
   * @returns {Promise<Array<Object>>}
   */
  async getContacts(userId) {
    return this.contactRepo.listContacts(userId, 'accepted');
  }

  /**
   * Removes a contact
   * @param {string} userId 
   * @param {string} contactUserId 
   * @returns {Promise<boolean>}
   */
  async removeContact(userId, contactUserId) {
    return this.contactRepo.removeContact(userId, contactUserId);
  }
}

export const contactService = new ContactService();
export default contactService;
