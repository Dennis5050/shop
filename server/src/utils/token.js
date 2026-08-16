import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generates a signed JWT for an authenticated user
 * @param {Object} payload Payload to encode (e.g. { userId, email, username })
 * @param {string} [expiresIn] Custom expiration string
 * @returns {string} Signed JWT token
 */
export function generateToken(payload, expiresIn = config.jwt.expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  if (!token) {
    throw new Error('Token is required for verification');
  }
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Extracts bearer token from Authorization header or cookie
 * @param {Object} req Express request object
 * @returns {string|null}
 */
export function extractToken(req) {
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (req.cookies?.jwt) {
    return req.cookies.jwt;
  }

  if (req.query?.token) {
    return req.query.token;
  }

  return null;
}

export default {
  generateToken,
  verifyToken,
  extractToken,
};
