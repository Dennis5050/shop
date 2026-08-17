import { useEffect } from 'react';
import { socketManager } from '../socket/socket.js';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { usePresenceStore } from '../store/presenceStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { useCallStore } from '../store/callStore.js';
import { useSound } from './useSound.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export function useSocketEvents() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const addIncomingMessage = useChatStore((s) => s.addIncomingMessage);
  const updateMessageDelivery = useChatStore((s) => s.updateMessageDelivery);
  const updateMessageReactions = useChatStore((s) => s.updateMessageReactions);
  const setUserTyping = useChatStore((s) => s.setUserTyping);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);

  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleIncomingCall = useCallStore((s) => s.handleIncomingCall);
  const handleCallAccepted = useCallStore((s) => s.handleCallAccepted);
  const handleCallRejected = useCallStore((s) => s.handleCallRejected);
  const handleCallEnded = useCallStore((s) => s.handleCallEnded);
  const handleIncomingSignal = useCallStore((s) => s.handleIncomingSignal);
  const handleCallBusy = useCallStore((s) => s.handleCallBusy);

  const { playNotification } = useSound();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = socketManager.connect(token);
    if (!socket) return;

    // 1. Presence Listeners
    const handleConnect = () => {
      socket.emit(SOCKET_EVENTS.PRESENCE_GET, (res) => {
        if (res?.success && Array.isArray(res.onlineUserIds)) {
          setOnlineUsers(res.onlineUserIds);
        }
      });
      fetchConversations();
    };

    const handleUserOnline = (data) => {
      if (data?.userId) setUserOnline(data.userId);
    };

    const handleUserOffline = (data) => {
      if (data?.userId) setUserOffline(data.userId);
    };

    // 2. Message Event Listeners
    const handleNewMessage = (payload) => {
      if (payload?.message) {
        addIncomingMessage(payload.message, payload.conversationId);
        playNotification();
      }
    };

    const handleConversationCreated = () => {
      fetchConversations();
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

    // 3. Typing Event Listeners
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

    // 4. Notification Event Listener
    const handleNewNotification = (payload) => {
      if (payload?.notification) {
        addNotification(payload.notification);
        playNotification();
      }
    };

    // 5. WebRTC Calling Listeners
    const onIncomingCall = (payload) => {
      handleIncomingCall(payload);
    };

    const onCallAccepted = (payload) => {
      handleCallAccepted(payload);
    };

    const onCallRejected = (payload) => {
      handleCallRejected(payload);
    };

    const onCallEnded = (payload) => {
      handleCallEnded(payload);
    };

    const onCallSignal = (payload) => {
      handleIncomingSignal(payload);
    };

    const onCallBusy = (payload) => {
      handleCallBusy(payload);
    };

    // Bind listeners
    socket.on('connect', handleConnect);
    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, handleMessageReaction);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);

    // Call events
    socket.on(SOCKET_EVENTS.CALL_INCOMING, onIncomingCall);
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, onCallAccepted);
    socket.on(SOCKET_EVENTS.CALL_REJECTED, onCallRejected);
    socket.on(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
    socket.on(SOCKET_EVENTS.CALL_SIGNAL, onCallSignal);
    socket.on(SOCKET_EVENTS.CALL_BUSY, onCallBusy);

    // Fetch initial presence immediately
    socket.emit(SOCKET_EVENTS.PRESENCE_GET, (res) => {
      if (res?.success && Array.isArray(res.onlineUserIds)) {
        setOnlineUsers(res.onlineUserIds);
      }
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessageDelivered);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION, handleMessageReaction);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);

      socket.off(SOCKET_EVENTS.CALL_INCOMING, onIncomingCall);
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED, onCallAccepted);
      socket.off(SOCKET_EVENTS.CALL_REJECTED, onCallRejected);
      socket.off(SOCKET_EVENTS.CALL_ENDED, onCallEnded);
      socket.off(SOCKET_EVENTS.CALL_SIGNAL, onCallSignal);
      socket.off(SOCKET_EVENTS.CALL_BUSY, onCallBusy);
    };
  }, [isAuthenticated, token]);
}

export default useSocketEvents;
