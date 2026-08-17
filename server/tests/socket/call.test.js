import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { io as ClientSocket } from 'socket.io-client';
import { initializeSocketServer } from '../../src/sockets/index.js';
import { generateToken } from '../../src/utils/token.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { callService } from '../../src/services/call.service.js';
import { SOCKET_EVENTS } from '../../src/constants/events.js';

describe('WebRTC Voice & Video Call Signaling Integration Suite', () => {
  let server;
  let port;
  let user1, user2, user3;
  let token1, token2, token3;

  before(async () => {
    userRepository.clear();
    callService.clear();

    user1 = await userRepository.create({ username: 'caller_alice', displayName: 'Alice Caller', email: 'alice.call@test.dev', passwordHash: 'h' });
    user2 = await userRepository.create({ username: 'receiver_bob', displayName: 'Bob Receiver', email: 'bob.call@test.dev', passwordHash: 'h' });
    user3 = await userRepository.create({ username: 'charlie_third', displayName: 'Charlie Third', email: 'charlie.call@test.dev', passwordHash: 'h' });

    token1 = generateToken({ userId: user1._id, email: user1.email, username: user1.username });
    token2 = generateToken({ userId: user2._id, email: user2.email, username: user2.username });
    token3 = generateToken({ userId: user3._id, email: user3.email, username: user3.username });

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

  beforeEach(() => {
    callService.clear();
  });

  it('should initiate a video call, notify receiver, and establish WebRTC signal exchange', (t, done) => {
    const caller = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    const receiver = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    let currentCallId = null;
    let callerConnected = false;
    let receiverConnected = false;

    const tryInitiate = () => {
      if (callerConnected && receiverConnected) {
        caller.emit(
          SOCKET_EVENTS.CALL_INITIATE,
          {
            receiverId: user2._id,
            callType: 'video',
          },
          (ack) => {
            assert.strictEqual(ack.success, true);
            assert.strictEqual(ack.call.callType, 'video');
            assert.strictEqual(ack.call.status, 'ringing');
            currentCallId = ack.callId;
          }
        );
      }
    };

    caller.on('connect', () => {
      callerConnected = true;
      tryInitiate();
    });

    receiver.on('connect', () => {
      receiverConnected = true;
      tryInitiate();
    });

    receiver.on(SOCKET_EVENTS.CALL_INCOMING, (payload) => {
      assert.strictEqual(payload.callType, 'video');
      assert.strictEqual(payload.caller._id, String(user1._id));

      // Accept call
      receiver.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: payload.callId }, (ack) => {
        assert.strictEqual(ack.success, true);
        assert.strictEqual(ack.call.status, 'connected');
      });
    });

    caller.on(SOCKET_EVENTS.CALL_ACCEPTED, (data) => {
      assert.strictEqual(data.callId, currentCallId);
      assert.strictEqual(data.acceptedBy, String(user2._id));

      // Caller sends SDP offer signal
      caller.emit(SOCKET_EVENTS.CALL_SIGNAL, {
        callId: currentCallId,
        targetUserId: user2._id,
        signal: { type: 'offer', sdp: 'dummy-sdp-offer-data' },
      });
    });

    receiver.on(SOCKET_EVENTS.CALL_SIGNAL, (data) => {
      assert.strictEqual(data.fromUserId, String(user1._id));
      assert.strictEqual(data.signal.type, 'offer');
      assert.strictEqual(data.signal.sdp, 'dummy-sdp-offer-data');

      // End call
      receiver.emit(SOCKET_EVENTS.CALL_END, { callId: currentCallId });
    });

    caller.on(SOCKET_EVENTS.CALL_ENDED, (data) => {
      assert.strictEqual(data.callId, currentCallId);
      caller.disconnect();
      receiver.disconnect();
      done();
    });
  });

  it('should return call:busy when recipient is already in another active call', async () => {
    // Manually register an active call for user2
    await callService.initiateCall({
      callerId: user3._id,
      receiverId: user2._id,
      callType: 'voice',
    });

    const caller = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    return new Promise((resolve) => {
      caller.on('connect', () => {
        caller.emit(
          SOCKET_EVENTS.CALL_INITIATE,
          {
            receiverId: user2._id,
            callType: 'voice',
          },
          (ack) => {
            assert.strictEqual(ack.success, false);
            assert.strictEqual(ack.isBusy, true);
            caller.disconnect();
            resolve();
          }
        );
      });
    });
  });

  it('should handle call rejection and notify caller', (t, done) => {
    const caller = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    const receiver = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    let callerConnected = false;
    let receiverConnected = false;

    const tryInitiate = () => {
      if (callerConnected && receiverConnected) {
        caller.emit(
          SOCKET_EVENTS.CALL_INITIATE,
          {
            receiverId: user2._id,
            callType: 'voice',
          }
        );
      }
    };

    caller.on('connect', () => {
      callerConnected = true;
      tryInitiate();
    });

    receiver.on('connect', () => {
      receiverConnected = true;
      tryInitiate();
    });

    receiver.on(SOCKET_EVENTS.CALL_INCOMING, (payload) => {
      receiver.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId: payload.callId,
        reason: 'user_declined',
      });
    });

    caller.on(SOCKET_EVENTS.CALL_REJECTED, (data) => {
      assert.strictEqual(data.rejectedBy, String(user2._id));
      assert.strictEqual(data.reason, 'user_declined');
      caller.disconnect();
      receiver.disconnect();
      done();
    });
  });
});
