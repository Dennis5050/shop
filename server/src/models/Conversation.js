import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      default: 'private',
      required: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    lastMessage: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: { type: String, default: '' },
      type: { type: String, default: 'text' },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for conversation querying
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ type: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
