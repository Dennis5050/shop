import { create } from 'zustand';
import { api } from '../services/api.js';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load notifications:', err);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          (n._id || n.id) === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  },
}));

export default useNotificationStore;
