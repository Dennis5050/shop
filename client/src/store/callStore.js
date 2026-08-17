import { create } from 'zustand';
import { socketManager } from '../socket/socket.js';
import { webrtcManager } from '../services/webrtc.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export const useCallStore = create((set, get) => ({
  callState: 'idle', // 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connected' | 'ended'
  callType: 'voice', // 'voice' | 'video'
  callId: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  connectionStatus: 'idle',
  callDuration: 0,
  timerInterval: null,
  errorMessage: null,

  startCall: async (receiverUser, callType = 'voice', conversationId = null) => {
    if (!receiverUser) return;
    const rId = String(receiverUser._id || receiverUser.id);

    set({
      callState: 'outgoing_ringing',
      callType,
      remoteUser: receiverUser,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      errorMessage: null,
    });

    try {
      // 1. Acquire local media stream
      const localStream = await webrtcManager.getLocalMediaStream(callType);
      set({ localStream });

      // 2. Emit call initiation over Socket.IO
      socketManager.emit(
        SOCKET_EVENTS.CALL_INITIATE,
        {
          receiverId: rId,
          conversationId,
          callType,
        },
        (ack) => {
          if (!ack?.success) {
            set({
              callState: 'idle',
              errorMessage: ack?.message || ack?.error || 'Failed to start call',
            });
            webrtcManager.cleanup();
          } else {
            set({ callId: ack.callId });
          }
        }
      );
    } catch (err) {
      console.error('Failed to start call:', err);
      set({
        callState: 'idle',
        errorMessage: 'Microphone / camera access denied',
      });
      webrtcManager.cleanup();
    }
  },

  handleIncomingCall: (payload) => {
    const { callId, caller, callType } = payload;
    set({
      callState: 'incoming_ringing',
      callId,
      callType: callType || 'voice',
      remoteUser: caller,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      errorMessage: null,
    });
  },

  acceptIncomingCall: async () => {
    const { callId, remoteUser, callType } = get();
    if (!callId || !remoteUser) return;

    try {
      const rId = String(remoteUser._id || remoteUser.id);

      // 1. Acquire local media
      const localStream = await webrtcManager.getLocalMediaStream(callType);
      set({ localStream, callState: 'connected' });

      // 2. Create peer connection
      webrtcManager.createPeerConnection(
        rId,
        callId,
        (remoteStream) => {
          set({ remoteStream });
        },
        (connectionState) => {
          set({ connectionStatus: connectionState });
        }
      );

      // 3. Emit accept
      socketManager.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId });

      // 4. Start duration timer
      get()._startDurationTimer();
    } catch (err) {
      console.error('Error accepting call:', err);
      get().rejectIncomingCall('error');
    }
  },

  handleCallAccepted: async (payload) => {
    const { remoteUser, callId } = get();
    if (!remoteUser) return;

    const rId = String(remoteUser._id || remoteUser.id);
    set({ callState: 'connected' });

    // 1. Create Peer Connection
    webrtcManager.createPeerConnection(
      rId,
      callId || payload.callId,
      (remoteStream) => {
        set({ remoteStream });
      },
      (connectionState) => {
        set({ connectionStatus: connectionState });
      }
    );

    // 2. Create and dispatch WebRTC Offer
    await webrtcManager.createOffer();

    // 3. Start timer
    get()._startDurationTimer();
  },

  rejectIncomingCall: (reason = 'declined') => {
    const { callId } = get();
    if (callId) {
      socketManager.emit(SOCKET_EVENTS.CALL_REJECT, { callId, reason });
    }
    get()._resetCallState();
  },

  handleCallRejected: (payload) => {
    set({
      callState: 'ended',
      errorMessage: payload?.reason === 'user_declined' ? 'Call declined' : 'Call ended',
    });
    setTimeout(() => {
      get()._resetCallState();
    }, 2000);
  },

  endCall: () => {
    const { callId } = get();
    if (callId) {
      socketManager.emit(SOCKET_EVENTS.CALL_END, { callId });
    }
    get()._resetCallState();
  },

  handleCallEnded: () => {
    set({ callState: 'ended', errorMessage: 'Call ended' });
    setTimeout(() => {
      get()._resetCallState();
    }, 1500);
  },

  handleCallBusy: (payload) => {
    set({
      callState: 'ended',
      errorMessage: payload?.message || 'User is busy on another call',
    });
    setTimeout(() => {
      get()._resetCallState();
    }, 2500);
  },

  handleIncomingSignal: async (payload) => {
    const { signal } = payload;
    if (!signal) return;

    if (signal.type === 'offer') {
      await webrtcManager.handleOffer(signal.sdp);
    } else if (signal.type === 'answer') {
      await webrtcManager.handleAnswer(signal.sdp);
    } else if (signal.type === 'candidate' && signal.candidate) {
      await webrtcManager.handleCandidate(signal.candidate);
    }
  },

  toggleMute: () => {
    const next = !get().isMuted;
    webrtcManager.toggleMicrophone(!next);
    set({ isMuted: next });
  },

  toggleVideo: () => {
    const next = !get().isVideoOff;
    webrtcManager.toggleCamera(!next);
    set({ isVideoOff: next });
  },

  _startDurationTimer: () => {
    if (get().timerInterval) clearInterval(get().timerInterval);

    const interval = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);

    set({ timerInterval: interval });
  },

  _resetCallState: () => {
    if (get().timerInterval) {
      clearInterval(get().timerInterval);
    }
    webrtcManager.cleanup();

    set({
      callState: 'idle',
      callId: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      timerInterval: null,
    });
  },
}));

export default useCallStore;
