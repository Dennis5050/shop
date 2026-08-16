import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { userRepository } from '../../src/repositories/user.repository.js';
import { conversationRepository } from '../../src/repositories/conversation.repository.js';
import { messageRepository } from '../../src/repositories/message.repository.js';
import { contactRepository } from '../../src/repositories/contact.repository.js';
import { groupRepository } from '../../src/repositories/group.repository.js';
import { postRepository } from '../../src/repositories/post.repository.js';
import { commentRepository } from '../../src/repositories/comment.repository.js';
import { notificationRepository } from '../../src/repositories/notification.repository.js';

describe('Data Repositories Test Suite', () => {
  beforeEach(() => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
    contactRepository.clear();
    groupRepository.clear();
    postRepository.clear();
    commentRepository.clear();
    notificationRepository.clear();
  });

  describe('UserRepository', () => {
    it('should create and retrieve a user by ID, username, and email', async () => {
      const user = await userRepository.create({
        username: 'alice',
        displayName: 'Alice Cooper',
        email: 'alice@nexus.dev',
        passwordHash: '$2a$12$somehash',
      });

      assert.ok(user._id);
      assert.strictEqual(user.username, 'alice');

      const byId = await userRepository.findById(user._id);
      assert.strictEqual(byId.email, 'alice@nexus.dev');
      assert.strictEqual(byId.passwordHash, undefined); // Excluded by default

      const byEmail = await userRepository.findByEmail('alice@nexus.dev');
      assert.strictEqual(byEmail.username, 'alice');

      const byUsername = await userRepository.findByUsername('ALICE');
      assert.strictEqual(byUsername.email, 'alice@nexus.dev');
    });

    it('should update presence status and search users', async () => {
      const user = await userRepository.create({
        username: 'bob',
        displayName: 'Bob Dylan',
        email: 'bob@nexus.dev',
        passwordHash: 'hash',
      });

      const updated = await userRepository.updatePresence(user._id, true, 'online');
      assert.strictEqual(updated.isOnline, true);
      assert.strictEqual(updated.status, 'online');

      const searchResults = await userRepository.search('dylan');
      assert.strictEqual(searchResults.length, 1);
      assert.strictEqual(searchResults[0].username, 'bob');
    });
  });

  describe('ConversationRepository & MessageRepository', () => {
    it('should create conversation, send message, and track delivery receipts', async () => {
      const u1 = await userRepository.create({ username: 'u1', displayName: 'User 1', email: 'u1@n.dev', passwordHash: 'h' });
      const u2 = await userRepository.create({ username: 'u2', displayName: 'User 2', email: 'u2@n.dev', passwordHash: 'h' });

      const conv = await conversationRepository.create({
        type: 'private',
        participants: [u1._id, u2._id],
      });

      assert.ok(conv._id);
      assert.strictEqual(conv.participants.length, 2);

      const msg = await messageRepository.create({
        conversation: conv._id,
        sender: u1._id,
        recipient: u2._id,
        content: 'Hello Bob!',
      });

      assert.strictEqual(msg.content, 'Hello Bob!');
      assert.strictEqual(msg.status, 'sent');

      await conversationRepository.updateLastMessage(conv._id, {
        messageId: msg._id,
        content: msg.content,
        sender: u1._id,
      });

      await conversationRepository.incrementUnread(conv._id, u2._id);

      const convList = await conversationRepository.listForUser(u2._id);
      assert.strictEqual(convList.length, 1);
      assert.strictEqual(convList[0].lastMessage.content, 'Hello Bob!');

      // Mark delivered and read
      const deliveredMsg = await messageRepository.markDelivered(msg._id, u2._id);
      assert.strictEqual(deliveredMsg.status, 'delivered');

      const readMsg = await messageRepository.markRead(msg._id, u2._id);
      assert.strictEqual(readMsg.status, 'read');

      // Add reaction
      const reacted = await messageRepository.addReaction(msg._id, u2._id, '🔥');
      assert.strictEqual(reacted.reactions.length, 1);
      assert.strictEqual(reacted.reactions[0].emoji, '🔥');
    });
  });

  describe('ContactRepository & GroupRepository', () => {
    it('should manage contacts and group memberships', async () => {
      const owner = await userRepository.create({ username: 'owner', displayName: 'Owner', email: 'o@n.dev', passwordHash: 'h' });
      const member = await userRepository.create({ username: 'member', displayName: 'Member', email: 'm@n.dev', passwordHash: 'h' });

      // Contact
      await contactRepository.addContact(owner._id, member._id, 'Bestie');
      const contacts = await contactRepository.listContacts(owner._id);
      assert.strictEqual(contacts.length, 1);
      assert.strictEqual(contacts[0].nickname, 'Bestie');

      // Group
      const group = await groupRepository.create({
        name: 'Nexus Alpha Devs',
        description: 'Core developer group',
        owner: owner._id,
      });

      assert.strictEqual(group.name, 'Nexus Alpha Devs');
      assert.strictEqual(group.members.length, 1);

      await groupRepository.addMember(group._id, member._id, 'member');
      const updatedGroup = await groupRepository.findById(group._id);
      assert.strictEqual(updatedGroup.members.length, 2);
    });
  });

  describe('PostRepository, CommentRepository & NotificationRepository', () => {
    it('should publish post, toggle like, add comment, and create notification', async () => {
      const author = await userRepository.create({ username: 'creator', displayName: 'Creator', email: 'c@n.dev', passwordHash: 'h' });
      const user = await userRepository.create({ username: 'fan', displayName: 'Fan', email: 'f@n.dev', passwordHash: 'h' });

      const post = await postRepository.create({
        author: author._id,
        content: 'Launching Nexus Real-Time Platform today! 🚀',
      });

      assert.strictEqual(post.likesCount, 0);

      // Like
      const likedPost = await postRepository.toggleLike(post._id, user._id);
      assert.strictEqual(likedPost.likesCount, 1);

      // Comment
      const comment = await commentRepository.create({
        post: post._id,
        author: user._id,
        content: 'Congratulations! Looks amazing.',
      });
      assert.strictEqual(comment.content, 'Congratulations! Looks amazing.');

      // Notification
      const notif = await notificationRepository.create({
        recipient: author._id,
        sender: user._id,
        type: 'comment',
        title: 'New Comment',
        message: 'fan commented on your post',
        data: { postId: post._id, commentId: comment._id },
      });

      assert.strictEqual(notif.isRead, false);
      const unread = await notificationRepository.getUnreadCount(author._id);
      assert.strictEqual(unread, 1);

      await notificationRepository.markAsRead(notif._id, author._id);
      const afterRead = await notificationRepository.getUnreadCount(author._id);
      assert.strictEqual(afterRead, 0);
    });
  });
});
