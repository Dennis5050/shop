import { SOCKET_EVENTS } from '../../constants/events.js';
import { presenceService } from '../../services/presence.service.js';
import { connectionManager } from '../connection.manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers Presence Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerPresenceHandlers(io, socket) {
  const userId = socket.userId;

  // 1. Send currently online users upon request
  socket.on(SOCKET_EVENTS.PRESENCE_GET, (callback) => {
    const onlineUserIds = presenceService.getOnlineUserIds();
    if (typeof callback === 'function') {
      callback({ success: true, onlineUserIds });
    }
  });

  // 2. Handle initial user connection
  presenceService.userConnected(userId, socket.id).then(({ isFirstConnection }) => {
    if (isFirstConnection) {
      logger.info(`Broadcasting user ${userId} is now ONLINE`);
      connectionManager.broadcast(
        SOCKET_EVENTS.USER_ONLINE,
        { userId, isOnline: true },
        socket.id
      );
    }
  }).catch((err) => {
    logger.error('Error handling user connected presence:', err);
  });

  // 3. Handle disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
    try {
      logger.debug(`Socket disconnected: ${socket.id} (reason: ${reason})`);
      const { userId: disconnectedUserId, isLastConnection, lastSeen } = await presenceService.userDisconnected(socket.id);

      if (disconnectedUserId && isLastConnection) {
        logger.info(`Broadcasting user ${disconnectedUserId} is now OFFLINE`);
        connectionManager.broadcast(
          SOCKET_EVENTS.USER_OFFLINE,
          { userId: disconnectedUserId, isOnline: false, lastSeen }
        );
      }
    } catch (err) {
      logger.error('Error handling user disconnect presence:', err);
    }
  });
}

export default registerPresenceHandlers;
