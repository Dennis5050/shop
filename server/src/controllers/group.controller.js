import { groupService } from '../services/group.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const groupController = {
  /**
   * POST /api/v1/groups
   */
  async createGroup(req, res, next) {
    try {
      const group = await groupService.createGroup({
        ...req.body,
        ownerId: req.userId,
      });
      return sendCreated(res, { group }, 'Group created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/groups/:id
   */
  async getGroup(req, res, next) {
    try {
      const group = await groupService.getGroup(req.params.id, req.userId);
      return sendSuccess(res, { group });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/groups/:id/members
   */
  async addMembers(req, res, next) {
    try {
      const { memberIds } = req.body;
      const group = await groupService.addMembers(req.params.id, req.userId, memberIds);
      return sendSuccess(res, { group }, 'Members added to group');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/groups/:id/members/:memberId
   */
  async removeMember(req, res, next) {
    try {
      const group = await groupService.removeMember(req.params.id, req.userId, req.params.memberId);
      return sendSuccess(res, { group }, 'Member removed from group');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/groups/:id/leave
   */
  async leaveGroup(req, res, next) {
    try {
      await groupService.leaveGroup(req.params.id, req.userId);
      return sendSuccess(res, null, 'Left group successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default groupController;
