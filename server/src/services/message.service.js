import { messageRepository } from '../repositories/message.repository.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { MessageStatus } from '../constants/message-status.js';

export class MessageService {
  constructor(
    msgRepo = messageRepository,
    convRepo = conversationRepository,
    userRepo = userRepository
  ) {
    this.msgRepo = msgRepo;
    this.convRepo = convRepo;
    this.userRepo = userRepo;
  }

  /**
   * Sends a message within a conversation
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async sendMessage(params) {
    const {
      conversationId,
      senderId,
      content,
      type = 'text',
      mediaUrl = '',
      mediaMeta = null,
      replyTo = null,
    } = params;

    if (!conversationId) {
      const err = new Error('conversationId is required');
      err.status = 400;
      throw err;
    }

    if (!content && !mediaUrl) {
      const err = new Error('Message must have text content or media');
      err.status = 400;
      throw err;
    }

    const conversation = await this.convRepo.findById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }

    const sId = String(senderId);
    const isMember = (conversation.participants || []).some((p) => String(p._id || p) === sId);
    if (!isMember) {
      const err = new Error('Unauthorized: You are not a participant in this conversation');
      err.status = 403;
      throw err;
    }

    const sender = await this.userRepo.findById(sId);

    // Create message record
    const message = await this.msgRepo.create({
      conversation: conversationId,
      sender: sender ? { _id: sender._id, username: sender.username, displayName: sender.displayName, avatar: sender.avatar } : sId,
      content: content ? content.trim() : '',
      type,
      mediaUrl,
      mediaMeta,
      replyTo,
      status: MessageStatus.SENT,
    });

    // Update conversation lastMessage preview
    await this.convRepo.updateLastMessage(conversationId, {
      messageId: message._id,
      sender: sId,
      content: type === 'text' ? message.content : `[${type}]`,
      type,
      createdAt: message.createdAt,
    });

    // Increment unread count for other participants
    for (const participant of conversation.participants) {
      const pId = String(participant._id || participant);
      if (pId !== sId) {
        await this.convRepo.incrementUnread(conversationId, pId);
      }
    }

    return message;
  }

  /**
   * Retrieves messages for a conversation and resets unread count for caller
   * @param {string} conversationId 
   * @param {string} userId 
   * @param {number} [limit=50]
   * @param {Date} [beforeDate]
   * @returns {Promise<Array<Object>>}
   */
  async getMessages(conversationId, userId, limit = 50, beforeDate = null) {
    const conversation = await this.convRepo.findById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }

    const uId = String(userId);
    const isMember = (conversation.participants || []).some((p) => String(p._id || p) === uId);
    if (!isMember) {
      const err = new Error('Unauthorized: You are not a participant in this conversation');
      err.status = 403;
      throw err;
    }

    // Reset unread counter for caller
    await this.convRepo.resetUnread(conversationId, uId);

    return this.msgRepo.listByConversation(conversationId, limit, beforeDate);
  }

  /**
   * Marks a message as delivered
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markDelivered(messageId, userId) {
    return this.msgRepo.markDelivered(messageId, userId);
  }

  /**
   * Marks a message as read
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async markRead(messageId, userId) {
    return this.msgRepo.markRead(messageId, userId);
  }

  /**
   * Adds an emoji reaction to a message
   * @param {string} messageId 
   * @param {string} userId 
   * @param {string} emoji 
   * @returns {Promise<Object|null>}
   */
  async addReaction(messageId, userId, emoji) {
    if (!emoji) {
      const err = new Error('Emoji is required for reaction');
      err.status = 400;
      throw err;
    }
    return this.msgRepo.addReaction(messageId, userId, emoji);
  }

  /**
   * Removes an emoji reaction from a message
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async removeReaction(messageId, userId) {
    return this.msgRepo.removeReaction(messageId, userId);
  }

  /**
   * Soft deletes a message
   * @param {string} messageId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async deleteMessage(messageId, userId) {
    const message = await this.msgRepo.findById(messageId);
    if (!message) {
      const err = new Error('Message not found');
      err.status = 404;
      throw err;
    }

    const sId = String(message.sender._id || message.sender);
    if (sId !== String(userId)) {
      const err = new Error('Unauthorized: You can only delete your own messages');
      err.status = 403;
      throw err;
    }

    return this.msgRepo.deleteForEveryone(messageId);
  }

  /**
   * Edits a message
   * @param {string} messageId 
   * @param {string} userId 
   * @param {string} newContent 
   * @returns {Promise<Object|null>}
   */
  async editMessage(messageId, userId, newContent) {
    if (!newContent || !newContent.trim()) {
      const err = new Error('Message content cannot be empty');
      err.status = 400;
      throw err;
    }

    const message = await this.msgRepo.findById(messageId);
    if (!message) {
      const err = new Error('Message not found');
      err.status = 404;
      throw err;
    }

    const sId = String(message.sender._id || message.sender);
    if (sId !== String(userId)) {
      const err = new Error('Unauthorized: You can only edit your own messages');
      err.status = 403;
      throw err;
    }

    return this.msgRepo.editMessage(messageId, newContent.trim());
  }
}

export const messageService = new MessageService();
export default messageService;
