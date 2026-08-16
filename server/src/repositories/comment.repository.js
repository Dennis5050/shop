import mongoose from 'mongoose';
import { Comment } from '../models/Comment.js';

export class CommentRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a comment on a post
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const comment = new Comment(data);
      const saved = await comment.save();
      const populated = await Comment.findById(saved._id)
        .populate('author', 'username displayName avatar')
        .exec();
      return populated.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const comment = {
      _id: id,
      id,
      post: String(data.post),
      author: data.author,
      content: data.content,
      parentComment: data.parentComment ? String(data.parentComment) : null,
      likes: [],
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, comment);
    return { ...comment };
  }

  /**
   * Lists comments for a post
   * @param {string} postId 
   * @returns {Promise<Array<Object>>}
   */
  async listByPost(postId) {
    const pId = String(postId);

    if (mongoose.connection.readyState === 1) {
      const comments = await Comment.find({ post: pId })
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: 1 })
        .exec();
      return comments.map((c) => c.toObject());
    }

    const list = [];
    for (const c of this.memoryStore.values()) {
      if (c.post === pId) {
        list.push({ ...c });
      }
    }
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return list;
  }

  /**
   * Deletes a comment
   * @param {string} commentId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async deleteComment(commentId, userId) {
    const uId = String(userId);
    const comment = this.memoryStore.get(String(commentId));
    if (!comment) return false;

    if (String(comment.author._id || comment.author) !== uId) {
      throw new Error('Unauthorized to delete this comment');
    }

    if (mongoose.connection.readyState === 1) {
      const res = await Comment.deleteOne({ _id: commentId }).exec();
      return res.deletedCount > 0;
    }

    return this.memoryStore.delete(String(commentId));
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const commentRepository = new CommentRepository();
export default commentRepository;
