import { verifyToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

/**
 * Socket.IO Handshake Authentication Middleware
 * Validates JWT token passed via auth payload or headers
 */
export function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const auth = socket.handshake.headers.authorization;
      if (auth.startsWith('Bearer ')) {
        token = auth.substring(7).trim();
      }
    }

    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      logger.warn(`Socket connection rejected: No authentication token provided (${socket.id})`);
      return next(new Error('Authentication token required for Socket.IO connection'));
    }

    const decoded = verifyToken(token);
    socket.user = decoded;
    socket.userId = String(decoded.userId);

    logger.debug(`Socket authenticated for user ${decoded.username} (${socket.userId}) on socket ${socket.id}`);
    next();
  } catch (error) {
    logger.warn(`Socket authentication failed: ${error.message} (${socket.id})`);
    next(new Error(`Socket authentication failed: ${error.message}`));
  }
}

export default socketAuthMiddleware;
