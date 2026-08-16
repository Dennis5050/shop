import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { io as ClientSocket } from 'socket.io-client';
import { initializeSocketServer } from '../../src/sockets/index.js';
import { generateToken } from '../../src/utils/token.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { conversationRepository } from '../../src/repositories/conversation.repository.js';
import { messageRepository } from '../../src/repositories/message.repository.js';
import { SOCKET_EVENTS } from '../../src/constants/events.js';

describe('Socket.IO Real-Time Integration Test Suite', () => {
  let server;
  let port;
  let user1;
  let user2;
  let token1;
  let token2;
  let conversation;

  before(async () => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();

    user1 = await userRepository.create({ username: 'alice_sock', displayName: 'Alice', email: 'alice@sock.dev', passwordHash: 'h' });
    user2 = await userRepository.create({ username: 'bob_sock', displayName: 'Bob', email: 'bob@sock.dev', passwordHash: 'h' });

    token1 = generateToken({ userId: user1._id, email: user1.email, username: user1.username });
    token2 = generateToken({ userId: user2._id, email: user2.email, username: user2.username });

    conversation = await conversationRepository.create({
      type: 'private',
      participants: [user1._id, user2._id],
    });

    const app = express();
    server = http.createServer(app);
    initializeSocketServer(server);

    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('should reject connection when no authentication token is provided', (t, done) => {
    const client = ClientSocket(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    client.on('connect_error', (err) => {
      assert.ok(err.message.includes('Authentication token required'));
      client.disconnect();
      done();
    });
  });

  it('should successfully authenticate and receive presence online event', (t, done) => {
    const client1 = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    client1.on('connect', () => {
      assert.ok(client1.id);

      // Connect client2 and verify client1 receives user:online event for user2
      const client2 = ClientSocket(`http://127.0.0.1:${port}`, {
        auth: { token: token2 },
        transports: ['websocket'],
      });

      client1.on(SOCKET_EVENTS.USER_ONLINE, (data) => {
        assert.strictEqual(data.userId, String(user2._id));
        assert.strictEqual(data.isOnline, true);
        client1.disconnect();
        client2.disconnect();
        done();
      });
    });
  });

  it('should send and receive real-time messages in a conversation room', (t, done) => {
    const client1 = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    const client2 = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    let client1Joined = false;
    let client2Joined = false;

    const trySendMessage = () => {
      if (client1Joined && client2Joined) {
        client1.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            conversationId: conversation._id,
            content: 'Real-time test message via Socket.IO!',
          },
          (ack) => {
            assert.strictEqual(ack.success, true);
            assert.strictEqual(ack.data.content, 'Real-time test message via Socket.IO!');
          }
        );
      }
    };

    client1.on('connect', () => {
      client1.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: conversation._id }, () => {
        client1Joined = true;
        trySendMessage();
      });
    });

    client2.on('connect', () => {
      client2.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: conversation._id }, () => {
        client2Joined = true;
        trySendMessage();
      });
    });

    client2.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      assert.strictEqual(payload.message.content, 'Real-time test message via Socket.IO!');
      assert.strictEqual(payload.conversationId, conversation._id);
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });

  it('should broadcast ephemeral typing indicators', (t, done) => {
    const client1 = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    const client2 = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    client2.on('connect', () => {
      client2.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: conversation._id }, () => {
        client1.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: conversation._id }, () => {
          client1.emit(SOCKET_EVENTS.TYPING_START, { conversationId: conversation._id });
        });
      });
    });

    client2.on(SOCKET_EVENTS.TYPING_START, (data) => {
      assert.strictEqual(data.conversationId, conversation._id);
      assert.strictEqual(data.userId, String(user1._id));
      assert.strictEqual(data.username, 'alice_sock');
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });
});
