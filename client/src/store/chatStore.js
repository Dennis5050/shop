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

    const convId = String(conversation._id || conversation.id);
    set({ activeConversation: conversation, isLoadingMessages: true });

    // Join room on socket
    socketManager.emit(SOCKET_EVENTS.CONVERSATION_JOIN, {
      conversationId: convId,
    });

    try {
      const res = await api.get(`/messages/conversation/${convId}`);

      set({
        messages: res.data.messages || [],
        isLoadingMessages: false,
      });

      // Clear unread count locally on the active conversation
      const currentList = get().conversations;
      const updatedList = currentList.map((c) =>
        String(c._id || c.id) === convId ? { ...c, unreadCount: 0 } : c
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

    const convId = String(active._id || active.id);

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

    const messagePayload = {
      conversationId: convId,
      content,
      type,
      mediaUrl,
      replyTo: replyTo ? String(replyTo._id || replyTo.id) : null,
    };

    // Try Socket.IO first for sub-millisecond sync
    return new Promise((resolve, reject) => {
      let resolved = false;

      const handleSuccess = (savedMsg) => {
        if (resolved) return;
        resolved = true;

        set((state) => ({
          messages: state.messages.map((m) =>
            String(m._id || m.id) === tempId ? savedMsg : m
          ),
        }));

        get().updateConversationLastMessage(convId, savedMsg, false);
        resolve(savedMsg);
      };

      const socket = socketManager.getSocket();
      if (socket && socket.connected) {
        socketManager.emit(SOCKET_EVENTS.MESSAGE_SEND, messagePayload, (ack) => {
          if (ack?.success && ack?.data) {
            handleSuccess(ack.data);
          } else {
            // Fallback to REST API on socket error
            api.post('/messages', messagePayload)
              .then((res) => handleSuccess(res.data.message))
              .catch((err) => {
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m._id === tempId ? { ...m, status: 'failed' } : m
                  ),
                }));
                reject(err);
              });
          }
        });

        // Set 4s fallback timeout if socket ack is dropped
        setTimeout(() => {
          if (!resolved) {
            api.post('/messages', messagePayload)
              .then((res) => handleSuccess(res.data.message))
              .catch((err) => reject(err));
          }
        }, 4000);
      } else {
        // Direct REST API send when socket is disconnected
        api.post('/messages', messagePayload)
          .then((res) => handleSuccess(res.data.message))
          .catch((err) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m._id === tempId ? { ...m, status: 'failed' } : m
              ),
            }));
            reject(err);
          });
      }
    });
  },

  addIncomingMessage: (message, conversationId) => {
    if (!message) return;
    const convId = String(conversationId || message.conversation);
    const active = get().activeConversation;
    const activeId = active ? String(active._id || active.id) : null;

    if (activeId === convId) {
      set((state) => {
        // Prevent duplicate appending
        const exists = state.messages.some(
          (m) => String(m._id || m.id) === String(message._id || message.id)
        );
        if (exists) return state;
        return { messages: [...state.messages, message] };
      });

      // Automatically send read receipt if conversation is actively open
      socketManager.emit(SOCKET_EVENTS.MESSAGE_READ, {
        messageId: String(message._id || message.id),
        conversationId: convId,
      });
    }

    get().updateConversationLastMessage(convId, message, activeId !== convId);
  },

  updateConversationLastMessage: (conversationId, message, incrementUnread = false) => {
    const convId = String(conversationId);
    set((state) => {
      const list = [...state.conversations];
      const index = list.findIndex((c) => String(c._id || c.id) === convId);

      if (index !== -1) {
        const item = { ...list[index] };
        item.lastMessage = {
          content: message.type === 'text' ? message.content : `[${message.type}]`,
          type: message.type,
          sender: message.sender,
          createdAt: message.createdAt || new Date().toISOString(),
        };
        if (incrementUnread) {
          item.unreadCount = (item.unreadCount || 0) + 1;
        }
        // Move updated conversation to top of list
        list.splice(index, 1);
        list.unshift(item);
        return { conversations: list };
      } else {
        // Conversation not yet loaded in list -> refresh conversations list
        get().fetchConversations();
        return state;
      }
    });
  },

  updateMessageDelivery: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        String(m._id || m.id) === String(messageId) ? { ...m, status } : m
      ),
    }));
  },

  updateMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        String(m._id || m.id) === String(messageId) ? { ...m, reactions } : m
      ),
    }));
  },

  setUserTyping: (conversationId, username, isTyping) => {
    const convId = String(conversationId);
    set((state) => {
      const current = state.typingUsers[convId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);

      return {
        typingUsers: {
          ...state.typingUsers,
          [convId]: updated,
        },
      };
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export default useChatStore;
