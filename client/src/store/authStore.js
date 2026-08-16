import { create } from 'zustand';
import { api } from '../services/api.js';
import { socketManager } from '../socket/socket.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nexus_token') || null,
  isAuthenticated: Boolean(localStorage.getItem('nexus_token')),
  isLoading: false,
  error: null,

  initAuth: async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      socketManager.connect(token);
    } catch (err) {
      localStorage.removeItem('nexus_token');
      socketManager.disconnect();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (login, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { login, password });
      const { user, token } = res.data;

      api.setToken(token);
      socketManager.connect(token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      const { user, token } = res.data;

      api.setToken(token);
      socketManager.connect(token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      api.setToken(null);
      socketManager.disconnect();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true });
    try {
      const res = await api.patch('/users/profile', profileData);
      set({ user: res.data.user, isLoading: false });
      return res.data.user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));

export default useAuthStore;
