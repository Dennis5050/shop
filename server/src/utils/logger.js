const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'cookie',
  'authorization',
  'apikey',
  'api_key',
]);

/**
 * Sanitizes object by redacting sensitive authentication keys
 */
export function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[\s\-_]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey) || normalizedKey.includes('password') || normalizedKey.includes('secret')) {
      clean[key] = '***REDACTED***';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitize(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  warn(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  error(message, error = null, meta = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error ? error.stack || error.message : '', Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
    }
  },
};

export default logger;
