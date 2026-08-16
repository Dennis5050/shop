import { SOCKET_EVENTS } from '../../constants/events.js';
import { messageService } from '../../services/message.service.js';
import { connectionManager } from '../connection.manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers Message Reaction Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerReactionHandlers(io, socket) {
  const userId = socket.userId;

  socket.on(SOCKET_EVENTS.MESSAGE_REACTION, async (payload, callback) => {
    try {
      const { messageId, conversationId, emoji, action = 'add' } = payload || {};
      if (!messageId || !conversationId) return;

      let updatedMessage = null;
      if (action === 'remove') {
        updatedMessage = await messageService.removeReaction(messageId, userId);
      } else {
        updatedMessage = await messageService.addReaction(messageId, userId, emoji);
      }

      if (updatedMessage) {
        connectionManager.emitToConversation(
          conversationId,
          SOCKET_EVENTS.MESSAGE_REACTION,
          {
            messageId,
            conversationId,
            userId,
            emoji,
            action,
            reactions: updatedMessage.reactions,
          }
        );
      }

      if (typeof callback === 'function') {
        callback({ success: true, reactions: updatedMessage?.reactions || [] });
      }
    } catch (err) {
      logger.error('Error handling reaction socket event:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });
}

export default registerReactionHandlers;
