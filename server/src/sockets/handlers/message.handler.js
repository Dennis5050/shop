import { SOCKET_EVENTS } from '../../constants/events.js';
import { messageService } from '../../services/message.service.js';
import { conversationService } from '../../services/conversation.service.js';
import { connectionManager } from '../connection.manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers Real-Time Message Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerMessageHandlers(io, socket) {
  const userId = socket.userId;

  // Handle Send Message
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
    try {
      const {
        conversationId,
        content,
        type = 'text',
        mediaUrl = '',
        mediaMeta = null,
        replyTo = null,
      } = payload || {};

      if (!conversationId) {
        if (typeof callback === 'function') callback({ success: false, error: 'conversationId is required' });
        return;
      }

      // 1. Persist to MongoDB first via MessageService
      const savedMessage = await messageService.sendMessage({
        conversationId,
        senderId: userId,
        content,
        type,
        mediaUrl,
        mediaMeta,
        replyTo,
      });

      // 2. Broadcast MESSAGE_NEW to conversation room (excluding sender socket)
      connectionManager.emitToConversation(
        conversationId,
        SOCKET_EVENTS.MESSAGE_NEW,
        {
          message: savedMessage,
          conversationId,
        },
        socket.id
      );

      // 3. Emit notification/event to other participants across all their active device sockets
      const conversation = await conversationService.getConversationById(conversationId, userId);
      for (const p of conversation.participants) {
        const pId = String(p._id || p);
        if (pId !== userId) {
          connectionManager.emitToUser(pId, SOCKET_EVENTS.MESSAGE_NEW, {
            message: savedMessage,
            conversationId,
          });
        }
      }

      // 4. Acknowledge sender callback
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: savedMessage,
        });
      }
    } catch (err) {
      logger.error('Error handling socket message send:', err);
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: err.message,
        });
      }
    }
  });

  // Handle Delete Message
  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, async (payload, callback) => {
    try {
      const { messageId, conversationId } = payload || {};
      const deleted = await messageService.deleteMessage(messageId, userId);

      connectionManager.emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_DELETED, {
        messageId,
        conversationId,
      });

      if (typeof callback === 'function') callback({ success: true, data: deleted });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Handle Edit Message
  socket.on(SOCKET_EVENTS.MESSAGE_EDITED, async (payload, callback) => {
    try {
      const { messageId, conversationId, content } = payload || {};
      const edited = await messageService.editMessage(messageId, userId, content);

      connectionManager.emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_EDITED, {
        message: edited,
        conversationId,
      });

      if (typeof callback === 'function') callback({ success: true, data: edited });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });
}

export default registerMessageHandlers;
