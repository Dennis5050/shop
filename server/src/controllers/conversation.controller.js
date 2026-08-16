import { conversationService } from '../services/conversation.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const conversationController = {
  /**
   * POST /api/v1/conversations/private
   */
  async startPrivateConversation(req, res, next) {
    try {
      const { recipientId } = req.body;
      const conversation = await conversationService.getOrCreatePrivateConversation(req.userId, recipientId);
      return sendCreated(res, { conversation });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/conversations
   */
  async getUserConversations(req, res, next) {
    try {
      const conversations = await conversationService.getUserConversations(req.userId);
      return sendSuccess(res, { conversations });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/conversations/:id
   */
  async getConversationDetails(req, res, next) {
    try {
      const conversation = await conversationService.getConversationById(req.params.id, req.userId);
      return sendSuccess(res, { conversation });
    } catch (error) {
      next(error);
    }
  },
};

export default conversationController;
