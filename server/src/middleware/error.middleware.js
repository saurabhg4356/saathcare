import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known operational ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.code, err.details)
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json(
      ApiResponse.error('Validation failed', 'VALIDATION_ERROR', formattedErrors)
    );
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json(
      ApiResponse.error(`A record with this ${field} already exists`, 'DUPLICATE_KEY_ERROR', { field })
    );
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json(
      ApiResponse.error('Database validation error', 'DATABASE_VALIDATION_ERROR', details)
    );
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      ApiResponse.error(`Invalid identifier for field: ${err.path}`, 'INVALID_ID_ERROR')
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ApiResponse.error('Invalid token', 'INVALID_TOKEN')
    );
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      ApiResponse.error('Token expired', 'TOKEN_EXPIRED')
    );
  }

  // Unhandled / unexpected internal error
  logger.error('Unhandled Server Exception', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  return res.status(500).json(
    ApiResponse.error(message, 'INTERNAL_SERVER_ERROR')
  );
}
