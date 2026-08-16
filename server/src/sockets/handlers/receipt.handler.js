import { SOCKET_EVENTS } from '../../constants/events.js';
import { messageService } from '../../services/message.service.js';
import { connectionManager } from '../connection.manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers Delivery & Read Receipt Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerReceiptHandlers(io, socket) {
  const userId = socket.userId;

  // Handle Delivery Receipt
  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async (payload) => {
    try {
      const { messageId, conversationId } = payload || {};
      if (!messageId || !conversationId) return;

      const updated = await messageService.markDelivered(messageId, userId);
      if (updated) {
        connectionManager.emitToConversation(
          conversationId,
          SOCKET_EVENTS.MESSAGE_DELIVERED,
          {
            messageId,
            conversationId,
            userId,
            deliveredAt: new Date(),
          },
          socket.id
        );
      }
    } catch (err) {
      logger.error('Error handling delivery receipt:', err);
    }
  });

  // Handle Read Receipt
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async (payload) => {
    try {
      const { messageId, conversationId } = payload || {};
      if (!messageId || !conversationId) return;

      const updated = await messageService.markRead(messageId, userId);
      if (updated) {
        connectionManager.emitToConversation(
          conversationId,
          SOCKET_EVENTS.MESSAGE_READ,
          {
            messageId,
            conversationId,
            userId,
            readAt: new Date(),
          },
          socket.id
        );
      }
    } catch (err) {
      logger.error('Error handling read receipt:', err);
    }
  });
}

export default registerReceiptHandlers;
