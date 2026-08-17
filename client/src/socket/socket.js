import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.token = null;
  }

  connect(token) {
    const authToken = token || this.token || localStorage.getItem('nexus_token');
    if (!authToken) return null;
    this.token = authToken;

    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect using relative origin with fallback transports
    this.socket = io('/', {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Socket.IO Connected successfully:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 Socket.IO Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket Connection Error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.token = null;
    }
  }

  getSocket() {
    if (!this.socket && localStorage.getItem('nexus_token')) {
      return this.connect();
    }
    return this.socket;
  }

  emit(event, data, callback) {
    const socket = this.getSocket();
    if (!socket) {
      if (typeof callback === 'function') callback({ success: false, error: 'Socket not connected' });
      return;
    }
    socket.emit(event, data, callback);
  }

  on(event, listener) {
    const socket = this.getSocket();
    if (!socket) return;
    socket.on(event, listener);
  }

  off(event, listener) {
    if (!this.socket) return;
    this.socket.off(event, listener);
  }
}

export const socketManager = new SocketManager();
export default socketManager;
