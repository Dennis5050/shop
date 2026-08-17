import { socketManager } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.targetUserId = null;
    this.callId = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
  }

  /**
   * Initializes local media stream (Voice or Video)
   * @param {'voice'|'video'} callType 
   * @returns {Promise<MediaStream>}
   */
  async getLocalMediaStream(callType = 'voice') {
    if (this.localStream) {
      return this.localStream;
    }

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.warn('getUserMedia error (falling back to audio only if possible):', error);
      if (callType === 'video') {
        // Fallback to audio only if camera is unavailable/denied
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return this.localStream;
      }
      throw error;
    }
  }

  /**
   * Initializes RTCPeerConnection and attaches local stream tracks
   */
  createPeerConnection(targetUserId, callId, onRemoteStream, onStateChange) {
    this.targetUserId = targetUserId;
    this.callId = callId;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateChangeCallback = onStateChange;

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // 1. Add local tracks to PeerConnection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // 2. Handle remote track arrival
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });

      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // 3. Handle local ICE candidates and relay via Socket.IO
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.targetUserId) {
        socketManager.emit(SOCKET_EVENTS.CALL_SIGNAL, {
          callId: this.callId,
          targetUserId: this.targetUserId,
          signal: {
            type: 'candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    // 4. Connection state updates
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    return this.peerConnection;
  }

  /**
   * Creates and dispatches WebRTC SDP Offer
   */
  async createOffer() {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);

    socketManager.emit(SOCKET_EVENTS.CALL_SIGNAL, {
      callId: this.callId,
      targetUserId: this.targetUserId,
      signal: {
        type: 'offer',
        sdp: offer.sdp,
      },
    });
  }

  /**
   * Handles incoming WebRTC SDP Offer and returns SDP Answer
   */
  async handleOffer(offerSdp) {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: offerSdp })
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    socketManager.emit(SOCKET_EVENTS.CALL_SIGNAL, {
      callId: this.callId,
      targetUserId: this.targetUserId,
      signal: {
        type: 'answer',
        sdp: answer.sdp,
      },
    });
  }

  /**
   * Handles incoming WebRTC SDP Answer
   */
  async handleAnswer(answerSdp) {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
    );
  }

  /**
   * Handles incoming ICE Candidate
   */
  async handleCandidate(candidate) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  }

  /**
   * Toggles microphone audio track
   */
  toggleMicrophone(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggles camera video track
   */
  toggleCamera(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Cleans up streams and closes peer connection
   */
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.targetUserId = null;
    this.callId = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
  }
}

export const webrtcManager = new WebRTCManager();
export default webrtcManager;
