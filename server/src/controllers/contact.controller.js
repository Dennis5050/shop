import { contactService } from '../services/contact.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const contactController = {
  /**
   * POST /api/v1/contacts
   */
  async addContact(req, res, next) {
    try {
      const { target, nickname } = req.body;
      const contact = await contactService.addContact(req.userId, target, nickname);
      return sendCreated(res, { contact }, 'Contact added successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/contacts
   */
  async getContacts(req, res, next) {
    try {
      const contacts = await contactService.getContacts(req.userId);
      return sendSuccess(res, { contacts });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/contacts/:id
   */
  async removeContact(req, res, next) {
    try {
      await contactService.removeContact(req.userId, req.params.id);
      return sendSuccess(res, null, 'Contact removed successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default contactController;
