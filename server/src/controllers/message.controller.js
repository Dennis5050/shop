import { messageService } from '../services/message.service.js';
import { conversationService } from '../services/conversation.service.js';
import { connectionManager } from '../sockets/connection.manager.js';
import { SOCKET_EVENTS } from '../constants/events.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const messageController = {
  /**
   * POST /api/v1/messages
   */
  async sendMessage(req, res, next) {
    try {
      const message = await messageService.sendMessage({
        ...req.body,
        senderId: req.userId,
      });

      const conversationId = String(message.conversation);

      // Broadcast real-time event to conversation room
      connectionManager.emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_NEW, {
        message,
        conversationId,
      });

      // Broadcast to participants' active devices
      try {
        const conversation = await conversationService.getConversationById(conversationId, req.userId);
        for (const p of conversation.participants) {
          const pId = String(p._id || p);
          if (pId !== String(req.userId)) {
            connectionManager.emitToUser(pId, SOCKET_EVENTS.MESSAGE_NEW, {
              message,
              conversationId,
            });
          }
        }
      } catch (err) {
        // Continue if enrichment lookup fails
      }

      return sendCreated(res, { message }, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/messages/conversation/:conversationId
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { limit, before } = req.query;
      const messages = await messageService.getMessages(
        conversationId,
        req.userId,
        limit ? parseInt(limit, 10) : 50,
        before ? new Date(before) : null
      );
      return sendSuccess(res, { messages });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/messages/:id/read
   */
  async markRead(req, res, next) {
    try {
      const updated = await messageService.markRead(req.params.id, req.userId);
      return sendSuccess(res, { message: updated }, 'Message marked as read');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/messages/:id/reactions
   */
  async addReaction(req, res, next) {
    try {
      const { emoji } = req.body;
      const updated = await messageService.addReaction(req.params.id, req.userId, emoji);
      return sendSuccess(res, { message: updated }, 'Reaction added');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/messages/:id
   */
  async deleteMessage(req, res, next) {
    try {
      const deleted = await messageService.deleteMessage(req.params.id, req.userId);
      return sendSuccess(res, { message: deleted }, 'Message deleted');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/messages/:id
   */
  async editMessage(req, res, next) {
    try {
      const { content } = req.body;
      const updated = await messageService.editMessage(req.params.id, req.userId, content);
      return sendSuccess(res, { message: updated }, 'Message edited');
    } catch (error) {
      next(error);
    }
  },
};

export default messageController;
