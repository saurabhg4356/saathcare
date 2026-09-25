import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token (hex string)
 * @param {number} [bytes=32] 
 * @returns {string} 64-character hex string
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes a SHA-256 hash of a string
 * Useful for securely indexing/storing refresh tokens
 * @param {string} token 
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
