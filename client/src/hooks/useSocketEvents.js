import { useEffect } from 'react';
import { socketManager } from '../socket/socket.js';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { usePresenceStore } from '../store/presenceStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export function useSocketEvents() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const addIncomingMessage = useChatStore((s) => s.addIncomingMessage);
  const updateMessageDelivery = useChatStore((s) => s.updateMessageDelivery);
  const updateMessageReactions = useChatStore((s) => s.updateMessageReactions);
  const setUserTyping = useChatStore((s) => s.setUserTyping);

  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);

  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = socketManager.connect(token);
    if (!socket) return;

    // 1. Fetch initial online users list
    socket.emit(SOCKET_EVENTS.PRESENCE_GET, (res) => {
      if (res?.success && Array.isArray(res.onlineUserIds)) {
        setOnlineUsers(res.onlineUserIds);
      }
    });

    // 2. Presence Event Listeners
    const handleUserOnline = (data) => {
      if (data?.userId) setUserOnline(data.userId);
    };

    const handleUserOffline = (data) => {
      if (data?.userId) setUserOffline(data.userId);
    };

    // 3. Message Event Listeners
    const handleNewMessage = (payload) => {
      if (payload?.message && payload?.conversationId) {
        addIncomingMessage(payload.message, payload.conversationId);
      }
    };

    const handleMessageDelivered = (payload) => {
      if (payload?.messageId) {
        updateMessageDelivery(payload.messageId, 'delivered');
      }
    };

    const handleMessageRead = (payload) => {
      if (payload?.messageId) {
        updateMessageDelivery(payload.messageId, 'read');
      }
    };

    const handleMessageReaction = (payload) => {
      if (payload?.messageId && payload?.reactions) {
        updateMessageReactions(payload.messageId, payload.reactions);
      }
    };

    // 4. Typing Event Listeners
    const handleTypingStart = (payload) => {
      if (payload?.conversationId && payload?.username) {
        setUserTyping(payload.conversationId, payload.username, true);
      }
    };

    const handleTypingStop = (payload) => {
      if (payload?.conversationId && payload?.username) {
        setUserTyping(payload.conversationId, payload.username, false);
      }
    };

    // 5. Notification Event Listener
    const handleNewNotification = (payload) => {
      if (payload?.notification) {
        addNotification(payload.notification);
      }
    };

    // Bind listeners
    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, handleMessageReaction);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);

    return () => {
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION, handleMessageReaction);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
    };
  }, [isAuthenticated, token]);
}

export default useSocketEvents;
