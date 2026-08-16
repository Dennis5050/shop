import { presenceService } from '../services/presence.service.js';
import { logger } from '../utils/logger.js';

export class ConnectionManager {
  constructor() {
    this.io = null;
  }

  /**
   * Initializes the connection manager with the Socket.IO server instance
   * @param {Object} io 
   */
  init(io) {
    this.io = io;
  }

  /**
   * Emits an event to all active sockets of a specific user
   * @param {string} userId 
   * @param {string} event 
   * @param {Object} data 
   */
  emitToUser(userId, event, data) {
    if (!this.io) return;
    const socketIds = presenceService.getUserSockets(userId);
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Emits an event to all participants in a conversation room
   * @param {string} conversationId 
   * @param {string} event 
   * @param {Object} data 
   * @param {string} [excludeSocketId]
   */
  emitToConversation(conversationId, event, data, excludeSocketId = null) {
    if (!this.io) return;
    const room = `conv_${conversationId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Broadcasts an event to all connected clients
   * @param {string} event 
   * @param {Object} data 
   * @param {string} [excludeSocketId]
   */
  broadcast(event, data, excludeSocketId = null) {
    if (!this.io) return;
    if (excludeSocketId) {
      this.io.except(excludeSocketId).emit(event, data);
    } else {
      this.io.emit(event, data);
    }
  }

  /**
   * Joins a socket to a conversation room
   * @param {Object} socket 
   * @param {string} conversationId 
   */
  joinConversation(socket, conversationId) {
    const room = `conv_${conversationId}`;
    socket.join(room);
    logger.debug(`Socket ${socket.id} joined room ${room}`);
  }

  /**
   * Leaves a conversation room
   * @param {Object} socket 
   * @param {string} conversationId 
   */
  leaveConversation(socket, conversationId) {
    const room = `conv_${conversationId}`;
    socket.leave(room);
    logger.debug(`Socket ${socket.id} left room ${room}`);
  }
}

export const connectionManager = new ConnectionManager();
export default connectionManager;
