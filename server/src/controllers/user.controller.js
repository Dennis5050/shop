import { userService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export const userController = {
  /**
   * GET /api/v1/users/profile/:id
   */
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.params.id, req.userId);
      return sendSuccess(res, { profile });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await userService.updateProfile(req.userId, req.body);
      return sendSuccess(res, { user: updated }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/users/settings
   */
  async updateSettings(req, res, next) {
    try {
      const updated = await userService.updateSettings(req.userId, req.body);
      return sendSuccess(res, { user: updated }, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/users/search
   */
  async searchUsers(req, res, next) {
    try {
      const { q } = req.query;
      const users = await userService.searchUsers(q, req.userId);
      return sendSuccess(res, { users });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/users/block/:id
   */
  async blockUser(req, res, next) {
    try {
      await userService.blockUser(req.userId, req.params.id);
      return sendSuccess(res, null, 'User blocked successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/users/unblock/:id
   */
  async unblockUser(req, res, next) {
    try {
      await userService.unblockUser(req.userId, req.params.id);
      return sendSuccess(res, null, 'User unblocked successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
