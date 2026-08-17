import { processMediaUpload } from '../utils/storage.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const mediaController = {
  /**
   * POST /api/v1/media/upload
   * Accepts Base64 dataUrl or media payload
   */
  async uploadMedia(req, res, next) {
    try {
      const { data, type, duration, fileName } = req.body;
      const processed = processMediaUpload(data, type);

      const result = {
        mediaUrl: processed.mediaUrl,
        mediaType: processed.mediaType,
        mimeType: processed.mimeType,
        fileSize: processed.fileSize,
        duration: duration || null,
        fileName: fileName || `media_${Date.now()}`,
      };

      return sendCreated(res, result, 'Media uploaded successfully');
    } catch (error) {
      next(error);
    }
  },
};

export default mediaController;
