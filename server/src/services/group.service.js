import { groupRepository } from '../repositories/group.repository.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class GroupService {
  constructor(
    groupRepo = groupRepository,
    convRepo = conversationRepository,
    userRepo = userRepository
  ) {
    this.groupRepo = groupRepo;
    this.convRepo = convRepo;
    this.userRepo = userRepo;
  }

  /**
   * Creates a new group and its backing conversation
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async createGroup(params) {
    const { name, description = '', avatar = '', ownerId, memberIds = [] } = params;

    if (!name || !name.trim()) {
      const err = new Error('Group name is required');
      err.status = 400;
      throw err;
    }

    const oId = String(ownerId);
    const owner = await this.userRepo.findById(oId);
    if (!owner) {
      const err = new Error('Owner user not found');
      err.status = 404;
      throw err;
    }

    const uniqueMembers = Array.from(new Set([oId, ...(memberIds || []).map(String)]));

    // 1. Create backing conversation room
    const conversation = await this.convRepo.create({
      type: 'group',
      participants: uniqueMembers,
    });

    // 2. Create Group record
    const group = await this.groupRepo.create({
      name: name.trim(),
      description: description.trim(),
      avatar,
      owner: oId,
      admins: [oId],
      members: uniqueMembers.map((m) => ({ user: m, role: m === oId ? 'owner' : 'member' })),
      conversation: conversation._id,
    });

    return group;
  }

  /**
   * Retrieves group details and verifies caller membership
   * @param {string} groupId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getGroup(groupId, userId) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const isMember = (group.members || []).some((m) => String(m.user._id || m.user) === String(userId));
    if (!isMember) {
      const err = new Error('Unauthorized: You are not a member of this group');
      err.status = 403;
      throw err;
    }

    return group;
  }

  /**
   * Adds new members to the group
   * @param {string} groupId 
   * @param {string} adminId 
   * @param {Array<string>} memberIds 
   * @returns {Promise<Object>}
   */
  async addMembers(groupId, adminId, memberIds) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const aId = String(adminId);
    const isAdmin = String(group.owner._id || group.owner) === aId || (group.admins || []).some((a) => String(a._id || a) === aId);
    if (!isAdmin) {
      const err = new Error('Unauthorized: Only group admins can add new members');
      err.status = 403;
      throw err;
    }

    for (const mId of memberIds) {
      await this.groupRepo.addMember(groupId, mId, 'member');
    }

    return this.groupRepo.findById(groupId);
  }

  /**
   * Removes a member from the group
   * @param {string} groupId 
   * @param {string} adminId 
   * @param {string} memberId 
   * @returns {Promise<Object>}
   */
  async removeMember(groupId, adminId, memberId) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const aId = String(adminId);
    const isAdmin = String(group.owner._id || group.owner) === aId || (group.admins || []).some((a) => String(a._id || a) === aId);
    if (!isAdmin) {
      const err = new Error('Unauthorized: Only group admins can remove members');
      err.status = 403;
      throw err;
    }

    if (String(memberId) === String(group.owner._id || group.owner)) {
      const err = new Error('Cannot remove the group owner');
      err.status = 400;
      throw err;
    }

    return this.groupRepo.removeMember(groupId, memberId);
  }

  /**
   * Leaves a group
   * @param {string} groupId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async leaveGroup(groupId, userId) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return false;

    if (String(group.owner._id || group.owner) === String(userId)) {
      const err = new Error('Group owner cannot leave the group without transferring ownership');
      err.status = 400;
      throw err;
    }

    await this.groupRepo.removeMember(groupId, userId);
    return true;
  }
}

export const groupService = new GroupService();
export default groupService;
