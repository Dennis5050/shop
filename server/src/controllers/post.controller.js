import { postService } from '../services/post.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const postController = {
  /**
   * POST /api/v1/posts
   */
  async createPost(req, res, next) {
    try {
      const post = await postService.createPost({
        ...req.body,
        authorId: req.userId,
      });
      return sendCreated(res, { post }, 'Post created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/posts/feed
   */
  async getFeed(req, res, next) {
    try {
      const { limit, authorId } = req.query;
      const posts = await postService.getFeed(req.userId, { limit, authorId });
      return sendSuccess(res, { posts });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/posts/:id/like
   */
  async likePost(req, res, next) {
    try {
      const post = await postService.likePost(req.params.id, req.userId);
      return sendSuccess(res, { post }, 'Like updated');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/posts/:id
   */
  async deletePost(req, res, next) {
    try {
      await postService.deletePost(req.params.id, req.userId);
      return sendSuccess(res, null, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default postController;
