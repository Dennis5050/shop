import { SOCKET_EVENTS } from '../../constants/events.js';
import { callService } from '../../services/call.service.js';
import { connectionManager } from '../connection.manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers WebRTC Voice & Video Call Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerCallHandlers(io, socket) {
  const userId = socket.userId;

  // 1. Initiate Call
  socket.on(SOCKET_EVENTS.CALL_INITIATE, async (payload, callback) => {
    try {
      const { receiverId, conversationId, callType = 'voice' } = payload || {};

      if (!receiverId) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'receiverId is required to start a call' });
        }
        return;
      }

      const result = await callService.initiateCall({
        callerId: userId,
        receiverId,
        conversationId,
        callType,
      });

      if (result.isBusy) {
        if (typeof callback === 'function') {
          callback({ success: false, isBusy: true, message: result.message });
        }
        socket.emit(SOCKET_EVENTS.CALL_BUSY, {
          receiverId,
          message: result.message,
        });
        return;
      }

      // Notify all active devices of the recipient
      connectionManager.emitToUser(receiverId, SOCKET_EVENTS.CALL_INCOMING, {
        callId: result.callId,
        caller: result.call.caller,
        conversationId,
        callType,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          callId: result.callId,
          call: result.call,
        });
      }
    } catch (err) {
      logger.error('Error initiating call:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // 2. Accept Call
  socket.on(SOCKET_EVENTS.CALL_ACCEPT, (payload, callback) => {
    try {
      const { callId } = payload || {};
      if (!callId) return;

      const call = callService.acceptCall(callId, userId);
      const peerId = call.callerId === userId ? call.receiverId : call.callerId;

      // Notify caller that call was accepted
      connectionManager.emitToUser(peerId, SOCKET_EVENTS.CALL_ACCEPTED, {
        callId,
        acceptedBy: userId,
        call,
      });

      if (typeof callback === 'function') {
        callback({ success: true, call });
      }
    } catch (err) {
      logger.error('Error accepting call:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // 3. Reject Call
  socket.on(SOCKET_EVENTS.CALL_REJECT, (payload, callback) => {
    try {
      const { callId, reason = 'declined' } = payload || {};
      if (!callId) return;

      const call = callService.rejectCall(callId, userId, reason);
      if (call) {
        const peerId = call.callerId === userId ? call.receiverId : call.callerId;
        connectionManager.emitToUser(peerId, SOCKET_EVENTS.CALL_REJECTED, {
          callId,
          rejectedBy: userId,
          reason,
        });
      }

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (err) {
      logger.error('Error rejecting call:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // 4. End Call
  socket.on(SOCKET_EVENTS.CALL_END, (payload, callback) => {
    try {
      const { callId } = payload || {};
      const call = callService.endCall(callId, userId);

      if (call) {
        const peerId = call.callerId === userId ? call.receiverId : call.callerId;
        connectionManager.emitToUser(peerId, SOCKET_EVENTS.CALL_ENDED, {
          callId: call.callId,
          endedBy: userId,
          durationSeconds: call.durationSeconds,
        });
      }

      if (typeof callback === 'function') {
        callback({ success: true, durationSeconds: call?.durationSeconds || 0 });
      }
    } catch (err) {
      logger.error('Error ending call:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // 5. WebRTC Peer Signaling Relay (SDP Offer/Answer, ICE Candidates)
  socket.on(SOCKET_EVENTS.CALL_SIGNAL, (payload) => {
    try {
      const { callId, targetUserId, signal } = payload || {};
      if (!targetUserId || !signal) return;

      connectionManager.emitToUser(targetUserId, SOCKET_EVENTS.CALL_SIGNAL, {
        callId,
        fromUserId: userId,
        signal,
      });
    } catch (err) {
      logger.error('Error relaying WebRTC signal:', err);
    }
  });

  // 6. Handle socket disconnect cleanup
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const activeCall = callService.getUserActiveCall(userId);
    if (activeCall) {
      const call = callService.endCall(activeCall.callId, userId);
      if (call) {
        const peerId = call.callerId === userId ? call.receiverId : call.callerId;
        connectionManager.emitToUser(peerId, SOCKET_EVENTS.CALL_ENDED, {
          callId: call.callId,
          endedBy: userId,
          durationSeconds: call.durationSeconds,
          reason: 'peer_disconnected',
        });
      }
    }
  });
}

export default registerCallHandlers;
