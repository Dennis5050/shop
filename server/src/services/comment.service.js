import { commentRepository } from '../repositories/comment.repository.js';
import { postRepository } from '../repositories/post.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class CommentService {
  constructor(
    commentRepo = commentRepository,
    postRepo = postRepository,
    userRepo = userRepository
  ) {
    this.commentRepo = commentRepo;
    this.postRepo = postRepo;
    this.userRepo = userRepo;
  }

  /**
   * Adds a comment to a post
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async addComment(params) {
    const { postId, authorId, content, parentCommentId = null } = params;

    if (!content || !content.trim()) {
      const err = new Error('Comment content is required');
      err.status = 400;
      throw err;
    }

    const post = await this.postRepo.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }

    const author = await this.userRepo.findById(authorId);
    if (!author) {
      const err = new Error('Author user not found');
      err.status = 404;
      throw err;
    }

    const comment = await this.commentRepo.create({
      post: postId,
      author: {
        _id: author._id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
      },
      content: content.trim(),
      parentComment: parentCommentId,
    });

    // Increment post comments counter
    await this.postRepo.updateCommentCount(postId, 1);

    return comment;
  }

  /**
   * Retrieves all comments for a post
   * @param {string} postId 
   * @returns {Promise<Array<Object>>}
   */
  async getComments(postId) {
    return this.commentRepo.listByPost(postId);
  }

  /**
   * Deletes a comment and decrements post comments count
   * @param {string} commentId 
   * @param {string} userId 
   * @param {string} postId 
   * @returns {Promise<boolean>}
   */
  async deleteComment(commentId, userId, postId) {
    const deleted = await this.commentRepo.deleteComment(commentId, userId);
    if (deleted && postId) {
      await this.postRepo.updateCommentCount(postId, -1);
    }
    return deleted;
  }
}

export const commentService = new CommentService();
export default commentService;
