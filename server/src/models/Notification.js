import mongoose from 'mongoose';
import { NotificationTypes } from '../constants/notification-types.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypes),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
      url: { type: String, default: '' },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
