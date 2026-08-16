import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { conversationRepository } from '../../src/repositories/conversation.repository.js';
import { messageRepository } from '../../src/repositories/message.repository.js';
import { contactRepository } from '../../src/repositories/contact.repository.js';
import { groupRepository } from '../../src/repositories/group.repository.js';
import { postRepository } from '../../src/repositories/post.repository.js';
import { commentRepository } from '../../src/repositories/comment.repository.js';
import { notificationRepository } from '../../src/repositories/notification.repository.js';

describe('Nexus REST API Full Integration Suite', () => {
  let server;
  let baseUrl;
  let userToken;
  let userId;
  let secondUserToken;
  let secondUserId;

  before(async () => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
    contactRepository.clear();
    groupRepository.clear();
    postRepository.clear();
    commentRepository.clear();
    notificationRepository.clear();

    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('GET /health should return 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.service, 'nexus-socket-platform');
    assert.ok(res.headers.get('x-request-id'));
  });

  it('POST /api/v1/auth/register should create user account and return JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dennis_dev',
        displayName: 'Dennis Kiplagat',
        email: 'dennis@nexus.dev',
        password: 'SecurePassword123!',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token);
    assert.strictEqual(json.data.user.username, 'dennis_dev');

    userToken = json.data.token;
    userId = json.data.user._id;
  });

  it('POST /api/v1/auth/register should register second user', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sarah_designer',
        displayName: 'Sarah Jenkins',
        email: 'sarah@nexus.dev',
        password: 'SecurePassword123!',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    secondUserToken = json.data.token;
    secondUserId = json.data.user._id;
  });

  it('POST /api/v1/auth/login should authenticate user with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'dennis@nexus.dev',
        password: 'SecurePassword123!',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token);
  });

  it('GET /api/v1/auth/me should return current authenticated user', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.user.username, 'dennis_dev');
  });

  it('PATCH /api/v1/users/profile should update user bio and status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        bio: 'Lead Full-Stack Real-Time Engineer',
        status: 'online',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.user.bio, 'Lead Full-Stack Real-Time Engineer');
  });

  it('GET /api/v1/users/search should find registered users', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/search?q=sarah`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.users.length, 1);
    assert.strictEqual(json.data.users[0].username, 'sarah_designer');
  });

  it('POST /api/v1/contacts should add user as contact', async () => {
    const res = await fetch(`${baseUrl}/api/v1/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        target: 'sarah_designer',
        nickname: 'Sarah Design Lead',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.data.contact.nickname, 'Sarah Design Lead');

    // List contacts
    const listRes = await fetch(`${baseUrl}/api/v1/contacts`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const listJson = await listRes.json();
    assert.strictEqual(listJson.data.contacts.length, 1);
  });

  let conversationId;

  it('POST /api/v1/conversations/private should create 1-to-1 conversation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/conversations/private`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        recipientId: secondUserId,
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.ok(json.data.conversation._id);
    conversationId = json.data.conversation._id;
  });

  let messageId;

  it('POST /api/v1/messages should send a message inside the conversation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        conversationId,
        content: 'Hey Sarah, welcome to Nexus platform!',
        type: 'text',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.data.message.content, 'Hey Sarah, welcome to Nexus platform!');
    messageId = json.data.message._id;
  });

  it('GET /api/v1/messages/conversation/:id should retrieve message history', async () => {
    const res = await fetch(`${baseUrl}/api/v1/messages/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${secondUserToken}` },
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.messages.length, 1);
    assert.strictEqual(json.data.messages[0].content, 'Hey Sarah, welcome to Nexus platform!');
  });

  it('POST /api/v1/messages/:id/reactions should add emoji reaction', async () => {
    const res = await fetch(`${baseUrl}/api/v1/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondUserToken}`,
      },
      body: JSON.stringify({ emoji: '❤️' }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.message.reactions.length, 1);
  });

  it('POST /api/v1/groups should create group channel', async () => {
    const res = await fetch(`${baseUrl}/api/v1/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: 'Nexus Product Team',
        description: 'Design and engineering collaboration',
        memberIds: [secondUserId],
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.data.group.name, 'Nexus Product Team');
  });

  let postId;

  it('POST /api/v1/posts should publish a social feed post', async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        content: 'Excited to release the new real-time social platform! 🚀 #buildinpublic #realtime',
        tags: ['buildinpublic', 'realtime'],
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.data.post.tags.length, 2);
    postId = json.data.post._id;
  });

  it('POST /api/v1/posts/:id/like should toggle like on the post', async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secondUserToken}` },
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.post.likesCount, 1);
  });

  it('POST /api/v1/comments should post a comment on social post', async () => {
    const res = await fetch(`${baseUrl}/api/v1/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondUserToken}`,
      },
      body: JSON.stringify({
        postId,
        content: 'Super proud of what we built!',
      }),
    });
    const json = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.data.comment.content, 'Super proud of what we built!');
  });
});
