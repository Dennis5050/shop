import mongoose from 'mongoose';

const memberSubSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [60, 'Group name cannot exceed 60 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Group description cannot exceed 250 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [memberSubSchema],
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    settings: {
      onlyAdminsCanPost: {
        type: Boolean,
        default: false,
      },
      onlyAdminsCanEditInfo: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ 'members.user': 1 });

export const Group = mongoose.model('Group', groupSchema);
export default Group;
