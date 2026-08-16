import { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware } from './authentication.middleware.js';
import { connectionManager } from './connection.manager.js';
import { registerPresenceHandlers } from './handlers/presence.handler.js';
import { registerConversationHandlers } from './handlers/conversation.handler.js';
import { registerMessageHandlers } from './handlers/message.handler.js';
import { registerReceiptHandlers } from './handlers/receipt.handler.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';
import { registerReactionHandlers } from './handlers/reaction.handler.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';

export function initializeSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.server.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // 1. Initialize Connection Manager
  connectionManager.init(io);

  // 2. Register Authentication Middleware
  io.use(socketAuthMiddleware);

  // 3. Register Connection Handlers
  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id} (User: ${socket.user?.username})`);

    // Register modular event listeners
    registerPresenceHandlers(io, socket);
    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerReceiptHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerReactionHandlers(io, socket);

    socket.on('error', (err) => {
      logger.error(`Socket error on ${socket.id}:`, err);
    });
  });

  logger.info('Socket.IO Server initialized with JWT authentication and modular event handlers');
  return io;
}

export default initializeSocketServer;
