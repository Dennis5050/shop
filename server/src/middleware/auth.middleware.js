import { extractToken, verifyToken } from '../utils/token.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication Middleware for protected REST API routes
 */
export function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(res, 'Authentication required. Please provide a valid Bearer token', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = String(decoded.userId);
    next();
  } catch (error) {
    return sendError(res, `Authentication failed: ${error.message}`, 401, 'UNAUTHORIZED');
  }
}

export default authenticate;
