import { userRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';

export class PresenceService {
  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
    // Map<userId, Set<socketId>>
    this.userSockets = new Map();
    // Map<socketId, userId>
    this.socketToUser = new Map();
  }

  /**
   * Registers a connected socket for a user
   * @param {string} userId 
   * @param {string} socketId 
   * @returns {Promise<{ isFirstConnection: boolean, activeDevices: number }>}
   */
  async userConnected(userId, socketId) {
    const uId = String(userId);
    let sockets = this.userSockets.get(uId);
    const isFirstConnection = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(uId, sockets);
    }

    sockets.add(socketId);
    this.socketToUser.set(socketId, uId);

    logger.debug(`User ${uId} connected socket ${socketId} (Total active devices: ${sockets.size})`);

    if (isFirstConnection) {
      await this.userRepo.updatePresence(uId, true, 'online');
    }

    return {
      isFirstConnection,
      activeDevices: sockets.size,
    };
  }

  /**
   * Handles socket disconnect and evaluates if user is completely offline
   * @param {string} socketId 
   * @returns {Promise<{ userId: string|null, isLastConnection: boolean, lastSeen: Date }>}
   */
  async userDisconnected(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return { userId: null, isLastConnection: false, lastSeen: new Date() };
    }

    this.socketToUser.delete(socketId);
    const sockets = this.userSockets.get(userId);

    let isLastConnection = false;
    const now = new Date();

    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        isLastConnection = true;
        await this.userRepo.updatePresence(userId, false, 'offline', now);
        logger.debug(`User ${userId} went completely offline (0 remaining devices)`);
      } else {
        logger.debug(`User ${userId} closed socket ${socketId} (${sockets.size} remaining devices)`);
      }
    }

    return {
      userId,
      isLastConnection,
      lastSeen: now,
    };
  }

  /**
   * Checks if user is currently online on at least one device
   * @param {string} userId 
   * @returns {boolean}
   */
  isUserOnline(userId) {
    const sockets = this.userSockets.get(String(userId));
    return Boolean(sockets && sockets.size > 0);
  }

  /**
   * Returns array of all currently online user IDs
   * @returns {Array<string>}
   */
  getOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Returns all active socket IDs for a user
   * @param {string} userId 
   * @returns {Array<string>}
   */
  getUserSockets(userId) {
    const sockets = this.userSockets.get(String(userId));
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Clears all in-memory connections
   */
  clear() {
    this.userSockets.clear();
    this.socketToUser.clear();
  }
}

export const presenceService = new PresenceService();
export default presenceService;
