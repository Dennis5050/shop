import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : (status === 400 ? 'VALIDATION_ERROR' : (status === 401 ? 'UNAUTHORIZED' : (status === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR'))));

  logger.error(`API Error on ${req.method} ${req.originalUrl}: ${err.message}`, err, { requestId: req.requestId });

  return sendError(res, err.message || 'An internal server error occurred', status, code, err.details || null);
}

export default errorHandler;
