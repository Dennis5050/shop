import { userRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';

export class CallService {
  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
    // Map<callId, CallObject>
    this.activeCalls = new Map();
    // Map<userId, callId>
    this.userToCall = new Map();
  }

  /**
   * Initiates a new Voice or Video Call
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async initiateCall(params) {
    const { callerId, receiverId, conversationId, callType = 'voice' } = params;

    const cId = String(callerId);
    const rId = String(receiverId);

    if (cId === rId) {
      const err = new Error('Cannot initiate a call with yourself');
      err.status = 400;
      throw err;
    }

    // Check if caller is already on a call
    if (this.userToCall.has(cId)) {
      const err = new Error('You are already in an active call');
      err.status = 409;
      err.code = 'CALLER_BUSY';
      throw err;
    }

    // Check if receiver is already on a call
    if (this.userToCall.has(rId)) {
      return {
        isBusy: true,
        receiverId: rId,
        message: 'Recipient is currently on another call',
      };
    }

    const caller = await this.userRepo.findById(cId);
    const receiver = await this.userRepo.findById(rId);

    if (!receiver) {
      const err = new Error('Recipient user not found');
      err.status = 404;
      throw err;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const call = {
      callId,
      conversationId: conversationId || null,
      callerId: cId,
      caller: caller ? {
        _id: caller._id,
        username: caller.username,
        displayName: caller.displayName,
        avatar: caller.avatar,
      } : { _id: cId },
      receiverId: rId,
      receiver: {
        _id: receiver._id,
        username: receiver.username,
        displayName: receiver.displayName,
        avatar: receiver.avatar,
      },
      callType, // 'voice' | 'video'
      status: 'ringing', // 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed'
      createdAt: new Date(),
      startTime: null,
      endTime: null,
      durationSeconds: 0,
    };

    this.activeCalls.set(callId, call);
    this.userToCall.set(cId, callId);
    this.userToCall.set(rId, callId);

    logger.info(`Call initiated: ${callId} (${callType}) from ${cId} to ${rId}`);

    return {
      isBusy: false,
      callId,
      call,
    };
  }

  /**
   * Accepts an incoming call
   * @param {string} callId 
   * @param {string} userId 
   * @returns {Object}
   */
  acceptCall(callId, userId) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      const err = new Error('Call session not found or already ended');
      err.status = 404;
      throw err;
    }

    const uId = String(userId);
    if (call.receiverId !== uId && call.callerId !== uId) {
      const err = new Error('Unauthorized to accept this call');
      err.status = 403;
      throw err;
    }

    call.status = 'connected';
    call.startTime = new Date();

    logger.info(`Call accepted and connected: ${callId}`);
    return call;
  }

  /**
   * Rejects an incoming call
   * @param {string} callId 
   * @param {string} userId 
   * @param {string} [reason='declined']
   * @returns {Object|null}
   */
  rejectCall(callId, userId, reason = 'declined') {
    const call = this.activeCalls.get(callId);
    if (!call) return null;

    call.status = 'rejected';
    call.endTime = new Date();
    call.rejectReason = reason;

    this._cleanupCall(callId);
    logger.info(`Call rejected: ${callId} by ${userId} (reason: ${reason})`);
    return call;
  }

  /**
   * Ends an ongoing call
   * @param {string} callId 
   * @param {string} userId 
   * @returns {Object|null}
   */
  endCall(callId, userId) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      // Check if user was registered in a call
      const registeredCallId = this.userToCall.get(String(userId));
      if (registeredCallId) {
        return this.endCall(registeredCallId, userId);
      }
      return null;
    }

    call.status = 'ended';
    call.endTime = new Date();
    if (call.startTime) {
      call.durationSeconds = Math.round((call.endTime - call.startTime) / 1000);
    }

    this._cleanupCall(callId);
    logger.info(`Call ended: ${callId} by ${userId} (duration: ${call.durationSeconds}s)`);
    return call;
  }

  /**
   * Retrieves active call by callId
   * @param {string} callId 
   * @returns {Object|null}
   */
  getCall(callId) {
    return this.activeCalls.get(callId) || null;
  }

  /**
   * Retrieves active call for a specific user
   * @param {string} userId 
   * @returns {Object|null}
   */
  getUserActiveCall(userId) {
    const callId = this.userToCall.get(String(userId));
    if (!callId) return null;
    return this.activeCalls.get(callId) || null;
  }

  _cleanupCall(callId) {
    const call = this.activeCalls.get(callId);
    if (call) {
      this.userToCall.delete(call.callerId);
      this.userToCall.delete(call.receiverId);
      this.activeCalls.delete(callId);
    }
  }

  clear() {
    this.activeCalls.clear();
    this.userToCall.clear();
  }
}

export const callService = new CallService();
export default callService;
