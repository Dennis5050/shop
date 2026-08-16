import { create } from 'zustand';
import { api } from '../services/api.js';

export const useSocialStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  activePostComments: {}, // { [postId]: [comments] }

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/posts/feed');
      set({ posts: res.data.posts || [], isLoading: false });
    } catch (err) {
      console.error('Failed to load social feed:', err);
      set({ isLoading: false });
    }
  },

  createPost: async (content, mediaUrl = '', mediaType = 'none', tags = []) => {
    try {
      const res = await api.post('/posts', { content, mediaUrl, mediaType, tags });
      const newPost = res.data.post;
      set((state) => ({ posts: [newPost, ...state.posts] }));
      return newPost;
    } catch (err) {
      throw err;
    }
  },

  toggleLike: async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      const updatedPost = res.data.post;

      set((state) => ({
        posts: state.posts.map((p) =>
          (p._id || p.id) === postId
            ? { ...p, likesCount: updatedPost.likesCount, isLiked: updatedPost.isLiked }
            : p
        ),
      }));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  },

  fetchComments: async (postId) => {
    try {
      const res = await api.get(`/comments/post/${postId}`);
      set((state) => ({
        activePostComments: {
          ...state.activePostComments,
          [postId]: res.data.comments || [],
        },
      }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  },

  addComment: async (postId, content) => {
    try {
      const res = await api.post('/comments', { postId, content });
      const newComment = res.data.comment;

      set((state) => {
        const currentComments = state.activePostComments[postId] || [];
        return {
          activePostComments: {
            ...state.activePostComments,
            [postId]: [...currentComments, newComment],
          },
          posts: state.posts.map((p) =>
            (p._id || p.id) === postId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          ),
        };
      });
      return newComment;
    } catch (err) {
      throw err;
    }
  },
}));

export default useSocialStore;
