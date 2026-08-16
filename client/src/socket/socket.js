import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const authToken = token || localStorage.getItem('nexus_token');
    if (!authToken) return null;

    this.socket = io('/', {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Socket.IO Connected:', this.socket.id);
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
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event, data, callback) {
    if (!this.socket) return;
    this.socket.emit(event, data, callback);
  }

  on(event, listener) {
    if (!this.socket) return;
    this.socket.on(event, listener);
  }

  off(event, listener) {
    if (!this.socket) return;
    this.socket.off(event, listener);
  }
}

export const socketManager = new SocketManager();
export default socketManager;
