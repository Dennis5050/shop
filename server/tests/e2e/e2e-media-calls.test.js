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
import { callService } from '../../src/services/call.service.js';
import { SOCKET_EVENTS } from '../../src/constants/events.js';

describe('Nexus End-to-End Rich Media & WebRTC Calling Simulation', () => {
  let server;
  let io;
  let port;
  let userA, userB;
  let tokenA, tokenB;
  let conversation;

  before(async () => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
    callService.clear();

    userA = await userRepository.create({
      username: 'media_alice',
      displayName: 'Alice Media',
      email: 'alice.media@test.dev',
      passwordHash: 'hash',
    });

    userB = await userRepository.create({
      username: 'media_bob',
      displayName: 'Bob Media',
      email: 'bob.media@test.dev',
      passwordHash: 'hash',
    });

    tokenA = generateToken({ userId: userA._id, email: userA.email, username: userA.username });
    tokenB = generateToken({ userId: userB._id, email: userB.email, username: userB.username });

    conversation = await conversationRepository.create({
      type: 'private',
      participants: [userA._id, userB._id],
    });

    const app = express();
    server = http.createServer(app);
    io = initializeSocketServer(server);

    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    return new Promise((resolve) => {
      io.close(() => {
        server.close(resolve);
      });
    });
  });

  it('should successfully send and synchronize Voice Notes, Photos, Videos, and initiate WebRTC calls between multi-party sockets', (t, done) => {
    const socketA = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });

    const socketB = ClientSocket(`http://127.0.0.1:${port}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    let voiceNoteReceived = false;
    let photoReceived = false;
    let currentCallId = null;

    let socketAConnected = false;
    let socketBConnected = false;

    const startLifecycle = () => {
      if (!socketAConnected || !socketBConnected) return;

      // Join conversation room
      socketA.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: String(conversation._id) });
      socketB.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: String(conversation._id) });

      // 1. User A sends Voice Note
      socketA.emit(
        SOCKET_EVENTS.MESSAGE_SEND,
        {
          conversationId: String(conversation._id),
          content: '',
          type: 'voice_note',
          mediaUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAA',
          mediaMeta: { duration: 18.2, mimeType: 'audio/webm' },
        },
        (ack) => {
          assert.strictEqual(ack.success, true);
          assert.strictEqual(ack.data.type, 'voice_note');
        }
      );
    };

    socketA.on('connect', () => {
      socketAConnected = true;
      startLifecycle();
    });

    socketB.on('connect', () => {
      socketBConnected = true;
      startLifecycle();
    });

    socketB.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      const { message } = payload;

      if (message.type === 'voice_note') {
        assert.strictEqual(message.mediaMeta.duration, 18.2);
        voiceNoteReceived = true;

        // 2. User B sends Photo attachment
        socketB.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            conversationId: String(conversation._id),
            content: 'Check this landscape photo',
            type: 'image',
            mediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675',
            mediaMeta: { fileName: 'landscape.jpg', fileSize: 102400 },
          },
          (ack) => {
            assert.strictEqual(ack.success, true);
            assert.strictEqual(ack.data.type, 'image');
          }
        );
      }
    });

    socketA.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => {
      const { message } = payload;

      if (message.type === 'image') {
        assert.strictEqual(message.content, 'Check this landscape photo');
        photoReceived = true;

        // 3. User A sends Video message
        socketA.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            conversationId: String(conversation._id),
            content: 'Recorded video clip',
            type: 'video',
            mediaUrl: 'https://example.com/stream.mp4',
            mediaMeta: { duration: 45, fileName: 'stream.mp4' },
          },
          (ack) => {
            assert.strictEqual(ack.success, true);
            assert.strictEqual(ack.data.type, 'video');

            // 4. Initiate Video Call from Alice to Bob
            socketA.emit(
              SOCKET_EVENTS.CALL_INITIATE,
              {
                receiverId: String(userB._id),
                conversationId: String(conversation._id),
                callType: 'video',
              },
              (callAck) => {
                if (callAck?.success) {
                  currentCallId = callAck.callId;
                }
              }
            );
          }
        );
      }
    });

    // Handle Incoming Call on Bob
    socketB.on(SOCKET_EVENTS.CALL_INCOMING, (callPayload) => {
      assert.strictEqual(callPayload.callType, 'video');
      assert.strictEqual(callPayload.caller._id, String(userA._id));
      currentCallId = callPayload.callId;

      // Accept call
      socketB.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: callPayload.callId }, (acceptAck) => {
        assert.strictEqual(acceptAck.success, true);
      });
    });

    // Handle Accepted on Alice
    socketA.on(SOCKET_EVENTS.CALL_ACCEPTED, (acceptedData) => {
      assert.ok(acceptedData.callId);
      currentCallId = acceptedData.callId;

      // Alice sends SDP offer
      socketA.emit(SOCKET_EVENTS.CALL_SIGNAL, {
        callId: acceptedData.callId,
        targetUserId: String(userB._id),
        signal: { type: 'offer', sdp: 'v=0\r\no=alice' },
      });
    });

    // Handle Signal on Bob
    socketB.on(SOCKET_EVENTS.CALL_SIGNAL, (signalData) => {
      assert.strictEqual(signalData.fromUserId, String(userA._id));
      assert.strictEqual(signalData.signal.type, 'offer');

      // End call
      socketB.emit(SOCKET_EVENTS.CALL_END, { callId: signalData.callId || currentCallId });
    });

    // Alice receives Call Ended
    socketA.on(SOCKET_EVENTS.CALL_ENDED, (endedData) => {
      assert.strictEqual(voiceNoteReceived, true);
      assert.strictEqual(photoReceived, true);

      socketA.disconnect();
      socketB.disconnect();
      done();
    });
  });
});
