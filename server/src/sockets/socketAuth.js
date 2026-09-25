import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Socket.io handshake authentication middleware verifying JWT
 */
export function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth?.token;

    // Check authorization header in handshake
    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Check cookies in handshake
    if (!token && socket.handshake.headers?.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, val] = cookie.trim().split('=');
        if (name === 'accessToken') {
          token = decodeURIComponent(val);
          break;
        }
      }
    }

    if (!token) {
      logger.warn('Socket connection rejected: No authentication token provided', { id: socket.id });
      return next(new Error('AUTH_REQUIRED: Authentication token missing'));
    }

    const decoded = jwt.verify(token, env.JWT.ACCESS_SECRET);
    socket.user = {
      _id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (err) {
    logger.warn('Socket connection rejected: Invalid token', { id: socket.id, error: err.message });
    return next(new Error('AUTH_FAILED: Invalid or expired token'));
  }
}
