export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'socket:error',

  // Presence Events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_GET: 'presence:get',

  // Conversation Room Lifecycle
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',

  // Messaging Events
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_REACTION: 'message:reaction',

  // Typing Indicators
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Social & Notifications
  POST_CREATED: 'post:created',
  POST_LIKED: 'post:liked',
  COMMENT_NEW: 'comment:new',
  NOTIFICATION_NEW: 'notification:new',
};

export default SOCKET_EVENTS;
