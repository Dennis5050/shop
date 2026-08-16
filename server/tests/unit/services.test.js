import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { authService } from '../../src/services/auth.service.js';
import { userService } from '../../src/services/user.service.js';
import { contactService } from '../../src/services/contact.service.js';
import { conversationService } from '../../src/services/conversation.service.js';
import { messageService } from '../../src/services/message.service.js';
import { groupService } from '../../src/services/group.service.js';
import { postService } from '../../src/services/post.service.js';
import { commentService } from '../../src/services/comment.service.js';
import { notificationService } from '../../src/services/notification.service.js';
import { presenceService } from '../../src/services/presence.service.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { conversationRepository } from '../../src/repositories/conversation.repository.js';
import { messageRepository } from '../../src/repositories/message.repository.js';
import { contactRepository } from '../../src/repositories/contact.repository.js';
import { groupRepository } from '../../src/repositories/group.repository.js';
import { postRepository } from '../../src/repositories/post.repository.js';
import { commentRepository } from '../../src/repositories/comment.repository.js';
import { notificationRepository } from '../../src/repositories/notification.repository.js';

describe('Business Services Test Suite', () => {
  beforeEach(() => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
    contactRepository.clear();
    groupRepository.clear();
    postRepository.clear();
    commentRepository.clear();
    notificationRepository.clear();
    presenceService.clear();
  });

  describe('AuthService & UserService', () => {
    it('should register a new user, reject duplicates, and login successfully', async () => {
      const reg = await authService.register({
        username: 'charlie',
        displayName: 'Charlie Puth',
        email: 'charlie@nexus.dev',
        password: 'Password123!',
      });

      assert.ok(reg.user._id);
      assert.ok(reg.token);
      assert.strictEqual(reg.user.username, 'charlie');

      // Duplicate registration should reject
      await assert.rejects(async () => {
        await authService.register({
          username: 'charlie',
          displayName: 'Duplicate',
          email: 'other@nexus.dev',
          password: 'Password123!',
        });
      }, /already taken/);

      // Login with username
      const loginRes = await authService.login({
        login: 'charlie',
        password: 'Password123!',
      });
      assert.strictEqual(loginRes.user.email, 'charlie@nexus.dev');
      assert.ok(loginRes.token);

      // Edit profile
      const updated = await userService.updateProfile(reg.user._id, {
        bio: 'Coding full-stack with Socket.IO',
      });
      assert.strictEqual(updated.bio, 'Coding full-stack with Socket.IO');
    });
  });

  describe('ConversationService & MessageService', () => {
    it('should start conversation, send message, and track unread counters', async () => {
      const u1 = await authService.register({ username: 'user1', displayName: 'U1', email: 'u1@n.dev', password: 'Password123' });
      const u2 = await authService.register({ username: 'user2', displayName: 'U2', email: 'u2@n.dev', password: 'Password123' });

      const conv = await conversationService.getOrCreatePrivateConversation(u1.user._id, u2.user._id);
      assert.ok(conv._id);
      assert.strictEqual(conv.type, 'private');

      const msg = await messageService.sendMessage({
        conversationId: conv._id,
        senderId: u1.user._id,
        content: 'Hey user2!',
      });
      assert.strictEqual(msg.content, 'Hey user2!');

      // User2 checks conversations and sees 1 unread message
      const u2Convs = await conversationService.getUserConversations(u2.user._id);
      assert.strictEqual(u2Convs.length, 1);
      assert.strictEqual(u2Convs[0].unreadCount, 1);

      // User2 reads messages and unread counter resets
      const messages = await messageService.getMessages(conv._id, u2.user._id);
      assert.strictEqual(messages.length, 1);

      const u2ConvsAfter = await conversationService.getUserConversations(u2.user._id);
      assert.strictEqual(u2ConvsAfter[0].unreadCount, 0);
    });
  });

  describe('GroupService', () => {
    it('should create group, add members, and verify admin operations', async () => {
      const admin = await authService.register({ username: 'gadmin', displayName: 'Admin', email: 'ga@n.dev', password: 'Password123' });
      const member = await authService.register({ username: 'gmember', displayName: 'Member', email: 'gm@n.dev', password: 'Password123' });

      const group = await groupService.createGroup({
        name: 'Nexus Core Engineers',
        ownerId: admin.user._id,
        memberIds: [member.user._id],
      });

      assert.strictEqual(group.name, 'Nexus Core Engineers');
      assert.strictEqual(group.members.length, 2);

      const fetched = await groupService.getGroup(group._id, member.user._id);
      assert.ok(fetched);
    });
  });

  describe('Social Feed (PostService & CommentService)', () => {
    it('should create post, toggle like, and add comments', async () => {
      const user = await authService.register({ username: 'poster', displayName: 'Poster', email: 'p@n.dev', password: 'Password123' });

      const post = await postService.createPost({
        authorId: user.user._id,
        content: 'Hello Nexus community!',
      });
      assert.strictEqual(post.content, 'Hello Nexus community!');

      await postService.likePost(post._id, user.user._id);
      const feed = await postService.getFeed(user.user._id);
      assert.strictEqual(feed.length, 1);
      assert.strictEqual(feed[0].isLiked, true);

      const comment = await commentService.addComment({
        postId: post._id,
        authorId: user.user._id,
        content: 'First comment!',
      });
      assert.strictEqual(comment.content, 'First comment!');

      const comments = await commentService.getComments(post._id);
      assert.strictEqual(comments.length, 1);
    });
  });

  describe('PresenceService', () => {
    it('should manage multi-device connections and mark offline only on last socket disconnect', async () => {
      const uId = 'usr_presence_test';

      // First device connects -> broadcasts online
      const conn1 = await presenceService.userConnected(uId, 'socket_tab_1');
      assert.strictEqual(conn1.isFirstConnection, true);
      assert.strictEqual(conn1.activeDevices, 1);
      assert.strictEqual(presenceService.isUserOnline(uId), true);

      // Second device connects from mobile -> activeDevices = 2
      const conn2 = await presenceService.userConnected(uId, 'socket_mobile_2');
      assert.strictEqual(conn2.isFirstConnection, false);
      assert.strictEqual(conn2.activeDevices, 2);
      assert.strictEqual(presenceService.isUserOnline(uId), true);

      // Tab 1 closes -> user still online because mobile is active!
      const dis1 = await presenceService.userDisconnected('socket_tab_1');
      assert.strictEqual(dis1.isLastConnection, false);
      assert.strictEqual(presenceService.isUserOnline(uId), true);

      // Mobile disconnects -> user now completely offline!
      const dis2 = await presenceService.userDisconnected('socket_mobile_2');
      assert.strictEqual(dis2.isLastConnection, true);
      assert.strictEqual(presenceService.isUserOnline(uId), false);
    });
  });
});
