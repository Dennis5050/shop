import { create } from 'zustand';
import { api } from '../services/api.js';
import { socketManager } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  typingUsers: {}, // { [conversationId]: [username] }
  searchQuery: '',

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await api.get('/conversations');
      set({
        conversations: res.data.conversations || [],
        isLoadingConversations: false,
      });
    } catch (err) {
      console.error('Failed to load conversations:', err);
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: async (conversation) => {
    if (!conversation) {
      set({ activeConversation: null, messages: [] });
      return;
    }

    set({ activeConversation: conversation, isLoadingMessages: true });

    // Join room on socket
    socketManager.emit(SOCKET_EVENTS.CONVERSATION_JOIN, {
      conversationId: conversation._id || conversation.id,
    });

    try {
      const convId = conversation._id || conversation.id;
      const res = await api.get(`/messages/conversation/${convId}`);

      set({
        messages: res.data.messages || [],
        isLoadingMessages: false,
      });

      // Clear unread count locally on the active conversation
      const currentList = get().conversations;
      const updatedList = currentList.map((c) =>
        (c._id || c.id) === convId ? { ...c, unreadCount: 0 } : c
      );
      set({ conversations: updatedList });
    } catch (err) {
      console.error('Failed to load messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content, type = 'text', mediaUrl = '', replyTo = null) => {
    const active = get().activeConversation;
    if (!active) return;

    const convId = active._id || active.id;

    // Optimistic message object
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      id: tempId,
      conversation: convId,
      content,
      type,
      mediaUrl,
      replyTo,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
    }));

    try {
      // Send via REST API or Socket
      const res = await api.post('/messages', {
        conversationId: convId,
        content,
        type,
        mediaUrl,
        replyTo: replyTo ? (replyTo._id || replyTo.id) : null,
      });

      const savedMsg = res.data.message;

      // Replace optimistic message with confirmed server message
      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? savedMsg : m)),
      }));

      // Update conversation list item last message
      get().updateConversationLastMessage(convId, savedMsg);

      return savedMsg;
    } catch (err) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? { ...m, status: 'failed' } : m
        ),
      }));
      throw err;
    }
  },

  addIncomingMessage: (message, conversationId) => {
    const active = get().activeConversation;
    const activeId = active ? (active._id || active.id) : null;

    if (activeId === conversationId) {
      set((state) => {
        // Prevent duplicate appending
        const exists = state.messages.some((m) => (m._id || m.id) === (message._id || message.id));
        if (exists) return state;
        return { messages: [...state.messages, message] };
      });
    }

    get().updateConversationLastMessage(conversationId, message, activeId !== conversationId);
  },

  updateConversationLastMessage: (conversationId, message, incrementUnread = false) => {
    set((state) => {
      const list = [...state.conversations];
      const index = list.findIndex((c) => (c._id || c.id) === conversationId);

      if (index !== -1) {
        const item = { ...list[index] };
        item.lastMessage = {
          content: message.type === 'text' ? message.content : `[${message.type}]`,
          type: message.type,
          sender: message.sender,
          createdAt: message.createdAt,
        };
        if (incrementUnread) {
          item.unreadCount = (item.unreadCount || 0) + 1;
        }
        // Move updated conversation to top
        list.splice(index, 1);
        list.unshift(item);
      }
      return { conversations: list };
    });
  },

  updateMessageDelivery: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        (m._id || m.id) === messageId ? { ...m, status } : m
      ),
    }));
  },

  updateMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        (m._id || m.id) === messageId ? { ...m, reactions } : m
      ),
    }));
  },

  setUserTyping: (conversationId, username, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export default useChatStore;
