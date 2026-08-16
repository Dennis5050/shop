import { commentService } from '../services/comment.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const commentController = {
  /**
   * POST /api/v1/comments
   */
  async addComment(req, res, next) {
    try {
      const { postId, content, parentCommentId } = req.body;
      const comment = await commentService.addComment({
        postId,
        authorId: req.userId,
        content,
        parentCommentId,
      });
      return sendCreated(res, { comment }, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/comments/post/:postId
   */
  async getComments(req, res, next) {
    try {
      const comments = await commentService.getComments(req.params.postId);
      return sendSuccess(res, { comments });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/comments/:id
   */
  async deleteComment(req, res, next) {
    try {
      const { postId } = req.query;
      await commentService.deleteComment(req.params.id, req.userId, postId);
      return sendSuccess(res, null, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default commentController;
