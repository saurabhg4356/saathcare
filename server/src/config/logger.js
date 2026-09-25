/**
 * Structured Logger for SaathCare
 * Sanitizes sensitive fields (passwords, tokens) before logging
 */

const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'secret', 'authorization'];

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },

  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
  },

  error: (message, error = null, meta = {}) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined }
      : error;
    console.error(`[${timestamp}] [ERROR] ${message}`, JSON.stringify({ error: errorDetails, ...sanitize(meta) }));
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : '');
    }
  }
};
