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
import { groupRepository } from '../../src/repositories/group.repository.js';
import { groupService } from '../../src/services/group.service.js';
import { SOCKET_EVENTS } from '../../src/constants/events.js';

describe('Nexus End-to-End Multi-Client Live Simulation', () => {
  let server;
  let port;
  let alice, bob, charlie;
  let aliceToken, bobToken, charlieToken;
  let privateConv;
  let groupConv;

  before(async () => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
    groupRepository.clear();

    alice = await userRepository.create({ username: 'alice_e2e', displayName: 'Alice E2E', email: 'alice@e2e.dev', passwordHash: 'h' });
    bob = await userRepository.create({ username: 'bob_e2e', displayName: 'Bob E2E', email: 'bob@e2e.dev', passwordHash: 'h' });
    charlie = await userRepository.create({ username: 'charlie_e2e', displayName: 'Charlie E2E', email: 'charlie@e2e.dev', passwordHash: 'h' });

    aliceToken = generateToken({ userId: alice._id, email: alice.email, username: alice.username });
    bobToken = generateToken({ userId: bob._id, email: bob.email, username: bob.username });
    charlieToken = generateToken({ userId: charlie._id, email: charlie.email, username: charlie.username });

    privateConv = await conversationRepository.create({
      type: 'private',
      participants: [alice._id, bob._id],
    });

    const createdGroup = await groupService.createGroup({
      name: 'Nexus Alpha Launch Crew',
      ownerId: charlie._id,
      memberIds: [alice._id, bob._id],
    });
    groupConv = await conversationRepository.findById(createdGroup.conversation);

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

  it('should execute full 3-party live messaging lifecycle with read receipts and group broadcast', (t, done) => {
    const aliceSocket = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: aliceToken },
      transports: ['websocket'],
    });

    const bobSocket = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: bobToken },
      transports: ['websocket'],
    });

    const charlieSocket = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: charlieToken },
      transports: ['websocket'],
    });

    let sentMessageId = null;

    aliceSocket.on('connect', () => {
      aliceSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: privateConv._id });
    });

    bobSocket.on('connect', () => {
      bobSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: privateConv._id }, () => {
        // Alice sends message to Bob
        aliceSocket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            conversationId: privateConv._id,
            content: 'Hello Bob from Alice!',
          },
          (ack) => {
            assert.strictEqual(ack.success, true);
            sentMessageId = ack.data._id;
          }
        );
      });
    });

    // Bob receives message and sends delivery + read receipts
    bobSocket.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      if (payload.conversationId === privateConv._id) {
        assert.strictEqual(payload.message.content, 'Hello Bob from Alice!');

        // Send delivery receipt
        bobSocket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
          messageId: payload.message._id,
          conversationId: privateConv._id,
        });

        // Send read receipt
        bobSocket.emit(SOCKET_EVENTS.MESSAGE_READ, {
          messageId: payload.message._id,
          conversationId: privateConv._id,
        });
      }
    });

    // Alice verifies delivery receipt
    let deliveryConfirmed = false;
    let readConfirmed = false;

    aliceSocket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
      if (data.messageId === sentMessageId) {
        deliveryConfirmed = true;
      }
    });

    aliceSocket.on(SOCKET_EVENTS.MESSAGE_READ, (data) => {
      if (data.messageId === sentMessageId) {
        readConfirmed = true;

        // Trigger group chat test
        aliceSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: groupConv._id });
        bobSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: groupConv._id });
        charlieSocket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: groupConv._id }, () => {
          charlieSocket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
            conversationId: groupConv._id,
            content: 'Welcome crew to the group room!',
          });
        });
      }
    });

    // Alice and Bob receive Charlie's group broadcast
    let aliceGotGroupMsg = false;
    let bobGotGroupMsg = false;

    aliceSocket.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      if (payload.conversationId === groupConv._id) {
        aliceGotGroupMsg = true;
        checkCompletion();
      }
    });

    bobSocket.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      if (payload.conversationId === groupConv._id) {
        bobGotGroupMsg = true;
        checkCompletion();
      }
    });

    const checkCompletion = () => {
      if (deliveryConfirmed && readConfirmed && aliceGotGroupMsg && bobGotGroupMsg) {
        aliceSocket.disconnect();
        bobSocket.disconnect();
        charlieSocket.disconnect();
        done();
      }
    };
  });
});
