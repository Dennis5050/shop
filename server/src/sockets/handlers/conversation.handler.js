import { SOCKET_EVENTS } from '../../constants/events.js';
import { connectionManager } from '../connection.manager.js';
import { conversationService } from '../../services/conversation.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers Conversation Room Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerConversationHandlers(io, socket) {
  const userId = socket.userId;

  // Join a conversation room
  socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, async (payload, callback) => {
    try {
      const { conversationId } = payload || {};
      if (!conversationId) {
        if (typeof callback === 'function') callback({ success: false, error: 'conversationId is required' });
        return;
      }

      // Verify membership
      await conversationService.getConversationById(conversationId, userId);

      connectionManager.joinConversation(socket, conversationId);

      if (typeof callback === 'function') {
        callback({ success: true, conversationId });
      }
    } catch (err) {
      logger.warn(`Failed to join conversation room: ${err.message}`);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Leave a conversation room
  socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, (payload, callback) => {
    const { conversationId } = payload || {};
    if (conversationId) {
      connectionManager.leaveConversation(socket, conversationId);
      if (typeof callback === 'function') {
        callback({ success: true, conversationId });
      }
    }
  });
}

export default registerConversationHandlers;
