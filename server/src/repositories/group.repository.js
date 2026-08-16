import mongoose from 'mongoose';
import { Group } from '../models/Group.js';

export class GroupRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Creates a new group
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const group = new Group(data);
      const saved = await group.save();
      const populated = await Group.findById(saved._id)
        .populate('owner', 'username displayName avatar status isOnline')
        .populate('admins', 'username displayName avatar')
        .populate('members.user', 'username displayName avatar status isOnline')
        .exec();
      return populated.toObject();
    }

    const id = data._id ? String(data._id) : new mongoose.Types.ObjectId().toString();
    const ownerId = String(data.owner);
    const members = (data.members || []).map((m) => ({
      user: m.user ? (m.user._id ? m.user : { _id: String(m.user) }) : { _id: String(m) },
      role: m.role || (String(m.user || m) === ownerId ? 'owner' : 'member'),
      joinedAt: new Date(),
    }));

    if (!members.some((m) => String(m.user._id || m.user) === ownerId)) {
      members.unshift({ user: { _id: ownerId }, role: 'owner', joinedAt: new Date() });
    }

    const group = {
      _id: id,
      id,
      name: data.name,
      description: data.description || '',
      avatar: data.avatar || '',
      owner: { _id: ownerId },
      admins: (data.admins || [ownerId]).map((a) => (a._id ? a : { _id: String(a) })),
      members,
      conversation: data.conversation ? String(data.conversation) : null,
      inviteCode: 'inv_' + Math.random().toString(36).substring(2, 10),
      settings: {
        onlyAdminsCanPost: false,
        onlyAdminsCanEditInfo: true,
        ...(data.settings || {}),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryStore.set(id, group);
    return { ...group };
  }

  /**
   * Finds group by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;

    if (mongoose.connection.readyState === 1) {
      const group = await Group.findById(id)
        .populate('owner', 'username displayName avatar status isOnline')
        .populate('admins', 'username displayName avatar')
        .populate('members.user', 'username displayName avatar status isOnline')
        .exec();
      return group ? group.toObject() : null;
    }

    const g = this.memoryStore.get(String(id));
    return g ? { ...g } : null;
  }

  /**
   * Adds a member to a group
   * @param {string} groupId 
   * @param {string} userId 
   * @param {string} [role='member']
   * @returns {Promise<Object|null>}
   */
  async addMember(groupId, userId, role = 'member') {
    const uId = String(userId);
    const group = await this.findById(groupId);
    if (!group) return null;

    const alreadyMember = group.members.some((m) => String(m.user._id || m.user) === uId);
    if (!alreadyMember) {
      const newMember = { user: { _id: uId }, role, joinedAt: new Date() };

      if (mongoose.connection.readyState === 1) {
        const updated = await Group.findByIdAndUpdate(
          groupId,
          { $push: { members: { user: uId, role } } },
          { new: true }
        )
          .populate('members.user', 'username displayName avatar status isOnline')
          .exec();
        return updated ? updated.toObject() : null;
      }

      group.members.push(newMember);
      this.memoryStore.set(String(groupId), group);
    }

    return group;
  }

  /**
   * Removes a member from a group
   * @param {string} groupId 
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async removeMember(groupId, userId) {
    const uId = String(userId);
    const group = await this.findById(groupId);
    if (!group) return null;

    if (mongoose.connection.readyState === 1) {
      const updated = await Group.findByIdAndUpdate(
        groupId,
        {
          $pull: {
            members: { user: uId },
            admins: uId,
          },
        },
        { new: true }
      ).exec();
      return updated ? updated.toObject() : null;
    }

    group.members = group.members.filter((m) => String(m.user._id || m.user) !== uId);
    group.admins = group.admins.filter((a) => String(a._id || a) !== uId);
    this.memoryStore.set(String(groupId), group);
    return { ...group };
  }

  /**
   * Clears in-memory store
   */
  clear() {
    this.memoryStore.clear();
  }
}

export const groupRepository = new GroupRepository();
export default groupRepository;
