import { SOCKET_EVENTS } from '../../constants/events.js';
import { connectionManager } from '../connection.manager.js';

/**
 * Registers Ephemeral Typing Indicator Socket Event Handlers
 * @param {Object} io 
 * @param {Object} socket 
 */
export function registerTypingHandlers(io, socket) {
  const userId = socket.userId;
  const username = socket.user?.username || 'User';

  // Handle Typing Start
  socket.on(SOCKET_EVENTS.TYPING_START, (payload) => {
    const { conversationId } = payload || {};
    if (!conversationId) return;

    connectionManager.emitToConversation(
      conversationId,
      SOCKET_EVENTS.TYPING_START,
      {
        conversationId,
        userId,
        username,
      },
      socket.id
    );
  });

  // Handle Typing Stop
  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload) => {
    const { conversationId } = payload || {};
    if (!conversationId) return;

    connectionManager.emitToConversation(
      conversationId,
      SOCKET_EVENTS.TYPING_STOP,
      {
        conversationId,
        userId,
        username,
      },
      socket.id
    );
  });
}

export default registerTypingHandlers;
