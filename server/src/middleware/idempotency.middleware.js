import { IdempotencyKey } from '../models/IdempotencyKey.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

export function idempotency(options = { required: false }) {
  return async (req, res, next) => {
    const key = req.headers['idempotency-key'];

    if (!key) {
      if (options.required) {
        return next(ApiError.badRequest('Idempotency-Key header is required for this operation'));
      }
      return next();
    }

    if (!req.user || !req.user._id) {
      return next(ApiError.unauthorized('Authentication required to use idempotency keys'));
    }

    try {
      // Check if key already exists for this user
      const existing = await IdempotencyKey.findOne({
        key,
        userId: req.user._id
      });

      if (existing) {
        logger.info(`[IDEMPOTENCY] Replaying cached response for key: ${key}`);
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        return res.status(existing.responseStatus).json(existing.responseBody);
      }

      // Intercept res.json to capture response on successful creation
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful operations (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          IdempotencyKey.create({
            key,
            userId: req.user._id,
            requestPath: req.originalUrl,
            responseStatus: res.statusCode,
            responseBody: body
          }).catch((err) => {
            logger.warn(`[IDEMPOTENCY] Failed to store idempotency key ${key}: ${err.message}`);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('[IDEMPOTENCY] Error inspecting idempotency store', error);
      next(error);
    }
  };
}
