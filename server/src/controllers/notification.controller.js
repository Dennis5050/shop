import { notificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.js';

export const notificationController = {
  /**
   * GET /api/v1/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getUserNotifications(req.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/notifications/:id/read
   */
  async markRead(req, res, next) {
    try {
      const notification = await notificationService.markRead(req.params.id, req.userId);
      return sendSuccess(res, { notification }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/notifications/read-all
   */
  async markAllRead(req, res, next) {
    try {
      const count = await notificationService.markAllRead(req.userId);
      return sendSuccess(res, { count }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;
