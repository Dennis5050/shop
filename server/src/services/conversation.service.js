import { conversationRepository } from '../repositories/conversation.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class ConversationService {
  constructor(convRepo = conversationRepository, userRepo = userRepository) {
    this.convRepo = convRepo;
    this.userRepo = userRepo;
  }

  /**
   * Finds or creates a 1-on-1 private conversation between two users
   * @param {string} userAId 
   * @param {string} userBId 
   * @returns {Promise<Object>}
   */
  async getOrCreatePrivateConversation(userAId, userBId) {
    const a = String(userAId);
    const b = String(userBId);

    if (a === b) {
      const err = new Error('Cannot start a conversation with yourself');
      err.status = 400;
      throw err;
    }

    const recipient = await this.userRepo.findById(b);
    if (!recipient) {
      const err = new Error('Recipient user not found');
      err.status = 404;
      throw err;
    }

    let conversation = await this.convRepo.findPrivateConversation(a, b);
    if (!conversation) {
      conversation = await this.convRepo.create({
        type: 'private',
        participants: [a, b],
      });
    }

    return this.enrichConversation(conversation, a);
  }

  /**
   * Retrieves all conversations for the user with populated participant profiles
   * @param {string} userId 
   * @returns {Promise<Array<Object>>}
   */
  async getUserConversations(userId) {
    const conversations = await this.convRepo.listForUser(userId);
    const enriched = await Promise.all(conversations.map((c) => this.enrichConversation(c, userId)));
    return enriched;
  }

  /**
   * Retrieves conversation by ID and verifies member access
   * @param {string} conversationId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getConversationById(conversationId, userId) {
    const conv = await this.convRepo.findById(conversationId);
    if (!conv) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }

    const isMember = (conv.participants || []).some((p) => String(p._id || p) === String(userId));
    if (!isMember) {
      const err = new Error('Unauthorized: You are not a member of this conversation');
      err.status = 403;
      throw err;
    }

    return this.enrichConversation(conv, userId);
  }

  /**
   * Enriches conversation with other participant's profile and unread counts
   * @param {Object} conv 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async enrichConversation(conv, userId) {
    const uId = String(userId);
    const enriched = { ...conv };

    if (conv.type === 'private') {
      const otherParticipant = (conv.participants || []).find((p) => String(p._id || p) !== uId);
      if (otherParticipant) {
        if (typeof otherParticipant === 'string' || !otherParticipant.displayName) {
          const fetched = await this.userRepo.findById(String(otherParticipant._id || otherParticipant));
          enriched.otherUser = fetched || null;
        } else {
          enriched.otherUser = otherParticipant;
        }
      }
    }

    // Unread count for current user
    let unreadCount = 0;
    if (conv.unreadCounts) {
      if (conv.unreadCounts instanceof Map) {
        unreadCount = conv.unreadCounts.get(uId) || 0;
      } else {
        unreadCount = conv.unreadCounts[uId] || 0;
      }
    }
    enriched.unreadCount = unreadCount;
    enriched.isPinned = (conv.pinnedBy || []).includes(uId);
    enriched.isArchived = (conv.archivedBy || []).includes(uId);
    enriched.isMuted = (conv.mutedBy || []).includes(uId);

    return enriched;
  }
}

export const conversationService = new ConversationService();
export default conversationService;
