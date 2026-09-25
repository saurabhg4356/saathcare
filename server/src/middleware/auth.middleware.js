import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Authentication middleware verifying JWT access token
 */
export function authenticateUser(req, res, next) {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.accessToken) {
    // Fallback to cookie
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is missing. Please log in.'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT.ACCESS_SECRET);
    req.user = {
      _id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token has expired. Please refresh your session.', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
}
