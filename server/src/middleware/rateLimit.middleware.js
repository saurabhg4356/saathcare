import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Standard API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      ApiResponse.error('Too many requests from this IP, please try again later', 'RATE_LIMIT_EXCEEDED')
    );
  }
});

/**
 * Stricter rate limiter for authentication endpoints (prevent brute-force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      ApiResponse.error('Too many authentication attempts, please try again in 15 minutes', 'AUTH_RATE_LIMIT_EXCEEDED')
    );
  }
});
