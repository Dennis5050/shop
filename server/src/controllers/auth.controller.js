import { authService } from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const authController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);

      // Set cookie for web browser clients
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      res.clearCookie('jwt');
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.userId);
      return sendSuccess(res, { user }, 'Current user retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.userId, currentPassword, newPassword);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
