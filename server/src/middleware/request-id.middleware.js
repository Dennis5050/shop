import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId && typeof existingId === 'string'
    ? existingId.trim()
    : 'req_' + crypto.randomUUID().replace(/-/g, '');

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export default requestIdMiddleware;
