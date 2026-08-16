import { create } from 'zustand';

export const usePresenceStore = create((set, get) => ({
  onlineUsers: new Set(),

  setOnlineUsers: (userIds = []) => {
    set({ onlineUsers: new Set(userIds.map(String)) });
  },

  setUserOnline: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(String(userId));
      return { onlineUsers: next };
    });
  },

  setUserOffline: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(String(userId));
      return { onlineUsers: next };
    });
  },

  isOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUsers.has(String(userId));
  },
}));

export default usePresenceStore;
