import { postRepository } from '../repositories/post.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class PostService {
  constructor(postRepo = postRepository, userRepo = userRepository) {
    this.postRepo = postRepo;
    this.userRepo = userRepo;
  }

  /**
   * Publishes a new post to the community feed
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async createPost(params) {
    const { authorId, content, mediaUrl = '', mediaType = 'none', tags = [] } = params;

    if (!content || !content.trim()) {
      const err = new Error('Post content is required');
      err.status = 400;
      throw err;
    }

    const aId = String(authorId);
    const author = await this.userRepo.findById(aId);
    if (!author) {
      const err = new Error('Author not found');
      err.status = 404;
      throw err;
    }

    const post = await this.postRepo.create({
      author: {
        _id: author._id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
        status: author.status,
        isOnline: author.isOnline,
      },
      content: content.trim(),
      mediaUrl,
      mediaType,
      tags: (tags || []).map((t) => t.replace(/^#/, '').toLowerCase()),
    });

    return post;
  }

  /**
   * Retrieves feed posts with liked state for current user
   * @param {string} currentUserId 
   * @param {Object} [options]
   * @returns {Promise<Array<Object>>}
   */
  async getFeed(currentUserId, options = {}) {
    const posts = await this.postRepo.listFeed(options);
    const uId = String(currentUserId);

    return posts.map((p) => ({
      ...p,
      isLiked: (p.likes || []).some((l) => String(l.user) === uId),
    }));
  }

  /**
   * Toggles like on a post
   * @param {string} postId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async likePost(postId, userId) {
    const post = await this.postRepo.toggleLike(postId, userId);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    return post;
  }

  /**
   * Deletes a post
   * @param {string} postId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async deletePost(postId, userId) {
    return this.postRepo.deletePost(postId, userId);
  }
}

export const postService = new PostService();
export default postService;
