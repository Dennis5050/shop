import { userRepository } from '../repositories/user.repository.js';

export class UserService {
  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Retrieves user profile
   * @param {string} targetUserId 
   * @param {string} [currentUserId]
   * @returns {Promise<Object>}
   */
  async getProfile(targetUserId, currentUserId = null) {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const isSelf = currentUserId && String(targetUserId) === String(currentUserId);
    const profile = {
      _id: user._id,
      id: user.id || user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    if (isSelf) {
      profile.email = user.email;
      profile.settings = user.settings;
      profile.blockedUsers = user.blockedUsers || [];
    }

    return profile;
  }

  /**
   * Updates current user's profile details
   * @param {string} userId 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updateData) {
    const allowed = {};
    if (updateData.displayName) allowed.displayName = updateData.displayName.trim();
    if (updateData.bio !== undefined) allowed.bio = updateData.bio.trim().substring(0, 160);
    if (updateData.avatar !== undefined) allowed.avatar = updateData.avatar;
    if (updateData.status && ['online', 'offline', 'away', 'busy'].includes(updateData.status)) {
      allowed.status = updateData.status;
    }

    const updated = await this.userRepo.update(userId, allowed);
    if (!updated) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return updated;
  }

  /**
   * Updates user settings
   * @param {string} userId 
   * @param {Object} settings 
   * @returns {Promise<Object>}
   */
  async updateSettings(userId, settings) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const merged = {
      ...user.settings,
      ...settings,
    };

    const updated = await this.userRepo.update(userId, { settings: merged });
    return updated;
  }

  /**
   * Searches for users across the platform
   * @param {string} query 
   * @param {string} currentUserId 
   * @returns {Promise<Array<Object>>}
   */
  async searchUsers(query, currentUserId) {
    if (!query || !query.trim()) return [];
    return this.userRepo.search(query, currentUserId, 25);
  }

  /**
   * Blocks another user
   * @param {string} userId 
   * @param {string} targetUserId 
   * @returns {Promise<boolean>}
   */
  async blockUser(userId, targetUserId) {
    if (String(userId) === String(targetUserId)) {
      const err = new Error('Cannot block yourself');
      err.status = 400;
      throw err;
    }

    const user = await this.userRepo.findById(userId, true);
    if (!user) return false;

    const blocked = user.blockedUsers || [];
    if (!blocked.some((id) => String(id) === String(targetUserId))) {
      blocked.push(targetUserId);
      await this.userRepo.update(userId, { blockedUsers: blocked });
    }
    return true;
  }

  /**
   * Unblocks a blocked user
   * @param {string} userId 
   * @param {string} targetUserId 
   * @returns {Promise<boolean>}
   */
  async unblockUser(userId, targetUserId) {
    const user = await this.userRepo.findById(userId, true);
    if (!user) return false;

    const blocked = (user.blockedUsers || []).filter((id) => String(id) !== String(targetUserId));
    await this.userRepo.update(userId, { blockedUsers: blocked });
    return true;
  }
}

export const userService = new UserService();
export default userService;
