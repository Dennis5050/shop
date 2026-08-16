import mongoose from 'mongoose';
import { Post } from '../models/Post.js';

export class PostRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a new community post
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const post = new Post(data);
      const saved = await post.save();
      const populated = await Post.findById(saved._id)
        .populate('author', 'username displayName avatar status isOnline')
        .exec();
      return populated.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const post = {
      _id: id,
      id,
      author: data.author,
      content: data.content,
      mediaUrl: data.mediaUrl || '',
      mediaType: data.mediaType || 'none',
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      tags: data.tags || [],
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, post);
    return { ...post };
  }

  /**
   * Finds a post by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id)
        .populate('author', 'username displayName avatar status isOnline')
        .exec();
      return post ? post.toObject() : null;
    }

    const post = this.memoryStore.get(String(id));
    return post ? { ...post } : null;
  }

  /**
   * Lists chronological feed posts
   * @param {Object} [options]
   * @returns {Promise<Array<Object>>}
   */
  async listFeed(options = {}) {
    const limit = parseInt(options.limit || '20', 10);
    const authorId = options.authorId ? String(options.authorId) : null;

    if (mongoose.connection.readyState === 1) {
      const filter = authorId ? { author: authorId } : {};
      const posts = await Post.find(filter)
        .populate('author', 'username displayName avatar status isOnline')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
      return posts.map((p) => p.toObject());
    }

    let list = Array.from(this.memoryStore.values());
    if (authorId) {
      list = list.filter((p) => String(p.author._id || p.author) === authorId);
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(0, limit);
  }

  /**
   * Toggles like on a post
   * @param {string} postId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async toggleLike(postId, userId) {
    const uId = String(userId);
    const post = await this.findById(postId);
    if (!post) return null;

    const alreadyLiked = (post.likes || []).some((l) => String(l.user) === uId);

    if (alreadyLiked) {
      post.likes = (post.likes || []).filter((l) => String(l.user) !== uId);
      post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
    } else {
      post.likes = [...(post.likes || []), { user: uId, at: new Date() }];
      post.likesCount = (post.likesCount || 0) + 1;
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await Post.findByIdAndUpdate(
        postId,
        { $set: { likes: post.likes, likesCount: post.likesCount } },
        { new: true }
      ).populate('author', 'username displayName avatar').exec();
      return updated ? updated.toObject() : null;
    }

    this.memoryStore.set(String(postId), post);
    return { ...post, isLiked: !alreadyLiked };
  }

  /**
   * Increments or decrements comment counter
   * @param {string} postId 
   * @param {number} delta 
   * @returns {Promise<void>}
   */
  async updateCommentCount(postId, delta = 1) {
    const post = await this.findById(postId);
    if (!post) return;

    post.commentsCount = Math.max(0, (post.commentsCount || 0) + delta);

    if (mongoose.connection.readyState === 1) {
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: delta } }).exec();
    } else {
      this.memoryStore.set(String(postId), post);
    }
  }

  /**
   * Deletes a post
   * @param {string} postId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async deletePost(postId, userId) {
    const uId = String(userId);
    const post = await this.findById(postId);
    if (!post) return false;

    if (String(post.author._id || post.author) !== uId) {
      throw new Error('Unauthorized to delete this post');
    }

    if (mongoose.connection.readyState === 1) {
      const res = await Post.deleteOne({ _id: postId }).exec();
      return res.deletedCount > 0;
    }

    return this.memoryStore.delete(String(postId));
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const postRepository = new PostRepository();
export default postRepository;
